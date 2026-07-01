"""论文 AI Summary 服务层 — 分析与缓存管理、批量分析、版本对比、自定义 Prompt"""

import difflib
import json
import logging
import time
from datetime import UTC, datetime
from typing import Any

from app.core.config import settings
from app.core.prompts import KEYWORD_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT
from app.models.ai import AIAnalysis
from app.services import prompt_service
from app.services.ai_utils import (
    build_result_dict,
    extract_text_from_paper,
    format_user_prompt,
)
from app.services.paper_service import get_paper
from app.utils.ai_client import ai_client
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _ai_extract_keywords(content: str) -> list[str]:
    """使用 AI 提取关键词"""
    result = ai_client.chat(
        system_prompt=KEYWORD_SYSTEM_PROMPT,
        user_prompt=f"以下是论文内容：\n\n{content}",
        temperature=0.1,
    )
    keywords = [k.strip() for k in result.split(",") if k.strip()]
    return keywords[:10]


# ─── 单篇查询 ────────────────────────────────────────────────


def get_ai_summary(
    db: Session,
    paper_id: int,
    user_id: int,
    analysis_type: str = "summary",
    version: int | None = None,
) -> AIAnalysis | None:
    """获取论文的 AI 分析结果（默认返回最新 completed 版本）"""
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        return None

    query = db.query(AIAnalysis).filter(
        AIAnalysis.paper_id == paper_id,
        AIAnalysis.analysis_type == analysis_type,
    )

    if version is not None:
        query = query.filter(AIAnalysis.version == version)
    else:
        query = query.filter(AIAnalysis.status == "completed")

    return query.order_by(AIAnalysis.version.desc()).first()


# ─── 版本管理 ────────────────────────────────────────────────


def get_analysis_versions(
    db: Session,
    paper_id: int,
    user_id: int,
    analysis_type: str = "summary",
) -> list[AIAnalysis]:
    """获取论文所有版本列表（不含 result，减少数据传输）"""
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        return []

    return (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.paper_id == paper_id,
            AIAnalysis.analysis_type == analysis_type,
        )
        .order_by(AIAnalysis.version.desc())
        .all()
    )


def diff_versions(
    db: Session,
    paper_id: int,
    user_id: int,
    v1: int,
    v2: int,
    analysis_type: str = "summary",
) -> dict[str, Any] | None:
    """对比两个版本的分析结果差异"""
    versions = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.paper_id == paper_id,
            AIAnalysis.analysis_type == analysis_type,
            AIAnalysis.version.in_([v1, v2]),
        )
        .all()
    )

    if len(versions) != 2:
        return None

    version_map = {v.version: v for v in versions}
    ver_a = version_map.get(v1)
    ver_b = version_map.get(v2)

    if not ver_a or not ver_b:
        return None

    # 解析 JSON 结果
    res_a = _parse_result(ver_a.result)
    res_b = _parse_result(ver_b.result)

    summary_a = (res_a or {}).get("summary", "")
    summary_b = (res_b or {}).get("summary", "")
    keywords_a = set((res_a or {}).get("keywords", []))
    keywords_b = set((res_b or {}).get("keywords", []))
    points_a = set((res_a or {}).get("main_points", []))
    points_b = set((res_b or {}).get("main_points", []))

    # 生成 diff
    summary_changed = summary_a != summary_b
    summary_diff = {"old": summary_a, "new": summary_b}

    # 扩展：逐句 diff（如果 summary 较长）
    if len(summary_a) > 100 or len(summary_b) > 100:
        diff_lines = list(
            difflib.unified_diff(
                summary_a.split("\n"),
                summary_b.split("\n"),
                fromfile=f"v{v1}",
                tofile=f"v{v2}",
                lineterm="",
            )
        )
        summary_diff["diff_lines"] = diff_lines

    return {
        "version_a": v1,
        "version_b": v2,
        "summary_changed": summary_changed,
        "summary": summary_diff,
        "keywords_added": sorted(keywords_b - keywords_a),
        "keywords_removed": sorted(keywords_a - keywords_b),
        "main_points_added": sorted(points_b - points_a),
        "main_points_removed": sorted(points_a - points_b),
    }


def _parse_result(result_str: str | None) -> dict[str, Any] | None:
    """安全解析 JSON result 字段"""
    if not result_str:
        return None
    try:
        return json.loads(result_str)
    except (json.JSONDecodeError, TypeError):
        return None


# ─── 进行中检查 ──────────────────────────────────────────────


def _get_pending_analysis(
    db: Session,
    paper_id: int,
    analysis_type: str = "summary",
) -> AIAnalysis | None:
    """获取论文正在处理中的分析记录"""
    return (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.paper_id == paper_id,
            AIAnalysis.analysis_type == analysis_type,
            AIAnalysis.status.in_(["pending", "processing"]),
        )
        .first()
    )


# ─── 触发单篇分析 ──────────────────────────────────────────


def trigger_ai_summary(
    db: Session,
    paper_id: int,
    user_id: int,
    analysis_type: str = "summary",
    force_regenerate: bool = False,
    custom_prompt_id: int | None = None,
) -> AIAnalysis:
    """触发论文 AI 分析

    数据流：
    1. 验证论文存在且属于当前用户
    2. 检查是否有进行中的分析 → 409 Conflict
    3. 检查缓存（非 force 时直接返回）
    4. 确定版本号，创建 pending 记录
    5. 加载自定义 Prompt（如有）
    6. 从论文提取文本
    7. 调用 AI 服务
    8. 保存结果
    """
    # 1. 验证论文
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        raise ValueError("论文不存在")

    # 2. 检查进行中的分析
    pending = _get_pending_analysis(db, paper_id, analysis_type)
    if pending:
        raise ValueError("该论文正在分析中，请稍后查询")

    # 3. 检查缓存
    if not force_regenerate:
        cached = (
            db.query(AIAnalysis)
            .filter(
                AIAnalysis.paper_id == paper_id,
                AIAnalysis.analysis_type == analysis_type,
                AIAnalysis.status == "completed",
            )
            .order_by(AIAnalysis.version.desc())
            .first()
        )
        if cached:
            return cached

    # 4. 确定版本号
    latest = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.paper_id == paper_id,
            AIAnalysis.analysis_type == analysis_type,
        )
        .order_by(AIAnalysis.version.desc())
        .first()
    )
    next_version = (latest.version + 1) if latest else 1

    # 创建分析记录（pending 状态）
    analysis = AIAnalysis(
        paper_id=paper_id,
        analysis_type=analysis_type,
        status="pending",
        version=next_version,
    )

    # 5. 加载自定义 Prompt
    prompt_template = None
    if custom_prompt_id:
        prompt_template = prompt_service.get_template(db, custom_prompt_id, user_id)
        if not prompt_template:
            raise ValueError(f"提示词模板不存在: id={custom_prompt_id}")
        analysis.prompt_template_id = custom_prompt_id
    else:
        # 尝试加载默认模板
        prompt_template = prompt_service.get_default_template(db, user_id, analysis_type)

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # 6. 提取文本 + AI 分析
    try:
        text = extract_text_from_paper(paper)
        start_time = time.time()

        if prompt_template:
            # 使用自定义 Prompt
            user_prompt = format_user_prompt(prompt_template.user_prompt_template, paper, text)

            summary = ai_client.chat(
                system_prompt=prompt_template.system_prompt,
                user_prompt=user_prompt,
            )
            # 关键词仍使用默认方式
            keywords = _ai_extract_keywords(text)
        else:
            # 使用默认 Prompt（共享常量）
            summary = ai_client.chat(
                system_prompt=SUMMARY_SYSTEM_PROMPT,
                user_prompt=f"以下是论文内容：\n\n{text}",
                temperature=0.3,
            ).strip()
            keywords = _ai_extract_keywords(text)

        result_json = build_result_dict(summary, keywords)
        elapsed_ms = int((time.time() - start_time) * 1000)

        # 7. 更新记录
        analysis.status = "completed"
        analysis.result = result_json
        analysis.model_name = settings.AI_MODEL if settings.AI_API_KEY else "stub-ai"
        analysis.processing_time_ms = elapsed_ms
        analysis.completed_at = datetime.now(UTC)
        db.commit()
        db.refresh(analysis)

    except ValueError as e:
        analysis.status = "failed"
        analysis.error_message = str(e)
        db.commit()
        db.refresh(analysis)
        raise

    except Exception as e:
        analysis.status = "failed"
        analysis.error_message = f"AI 分析失败: {str(e)}"
        db.commit()
        db.refresh(analysis)
        raise ValueError(f"AI 服务暂时不可用，请稍后重试: {str(e)}")

    return analysis


# ─── 批量分析 ────────────────────────────────────────────────


def trigger_batch_analysis(
    db: Session,
    user_id: int,
    paper_ids: list[int],
    analysis_type: str = "summary",
    force_regenerate: bool = False,
    custom_prompt_id: int | None = None,
) -> tuple[list[dict[str, Any]], int, int]:
    """批量触发 AI 分析

    逐篇处理，跳过已有 pending/processing 的论文（不报错）。

    Returns:
        (results, accepted_count, skipped_count)
    """
    results: list[dict[str, Any]] = []
    accepted = 0
    skipped = 0

    for pid in paper_ids:
        item: dict[str, Any] = {"paper_id": pid, "status": "", "analysis_id": None, "reason": None}

        # 验证论文
        paper = get_paper(db, pid, user_id)
        if not paper:
            item["status"] = "skipped"
            item["reason"] = "论文不存在或无权访问"
            skipped += 1
            results.append(item)
            continue

        # 跳过进行中
        pending = _get_pending_analysis(db, pid, analysis_type)
        if pending:
            item["status"] = "skipped"
            item["reason"] = "已有进行中的分析"
            skipped += 1
            results.append(item)
            continue

        # 检查缓存（非 force 时跳过已有结果的）
        if not force_regenerate:
            cached = (
                db.query(AIAnalysis)
                .filter(
                    AIAnalysis.paper_id == pid,
                    AIAnalysis.analysis_type == analysis_type,
                    AIAnalysis.status == "completed",
                )
                .first()
            )
            if cached:
                item["status"] = "skipped"
                item["reason"] = "已有缓存结果（使用 force_regenerate 强制刷新）"
                skipped += 1
                results.append(item)
                continue

        # 执行分析
        try:
            analysis = trigger_ai_summary(
                db,
                paper_id=pid,
                user_id=user_id,
                analysis_type=analysis_type,
                force_regenerate=True,  # 已检查过缓存，直接强制生成
                custom_prompt_id=custom_prompt_id,
            )
            item["status"] = "accepted"
            item["analysis_id"] = analysis.id
            accepted += 1
        except ValueError as e:
            item["status"] = "failed"
            item["reason"] = str(e)
            skipped += 1  # 计入未成功
        except Exception as e:
            item["status"] = "failed"
            item["reason"] = str(e)
            skipped += 1

        results.append(item)

    return results, accepted, skipped
