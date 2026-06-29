"""论文 AI Summary 服务层 — 分析与缓存管理"""

import json
import time
from datetime import UTC, datetime
from typing import Any

from app.models.ai import AIAnalysis
from app.services.ai_service import extract_keywords, generate_summary
from app.services.paper_service import get_paper
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


def _extract_text_from_paper(paper: Any) -> str:
    """从论文对象提取可分析文本（Phase 1: 使用 abstract 字段）"""
    if paper.abstract and paper.abstract.strip():
        return paper.abstract.strip()
    # Phase 2: 将在此处添加 PDF 文本提取逻辑
    raise ValueError("论文没有可分析的内容（摘要为空，且尚未支持 PDF 文本提取）")


def _build_result_dict(summary: str, keywords: list[str]) -> str:
    """构建结构化 JSON 结果"""
    return json.dumps(
        {
            "summary": summary,
            "keywords": keywords,
            "main_points": [],
        },
        ensure_ascii=False,
    )


def get_ai_summary(
    db: Session,
    paper_id: int,
    user_id: int,
    analysis_type: str = "summary",
) -> AIAnalysis | None:
    """获取论文的最新 AI 分析结果（仅返回 completed 状态）"""
    # 验证论文存在且属于当前用户
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        return None

    return (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.paper_id == paper_id,
            AIAnalysis.analysis_type == analysis_type,
            AIAnalysis.status == "completed",
        )
        .order_by(AIAnalysis.version.desc())
        .first()
    )


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


def trigger_ai_summary(
    db: Session,
    paper_id: int,
    user_id: int,
    analysis_type: str = "summary",
    force_regenerate: bool = False,
) -> AIAnalysis:
    """触发论文 AI 分析

    数据流：
    1. 验证论文存在且属于当前用户
    2. 检查是否有进行中的分析 → 409 Conflict
    3. 检查是否有缓存的已完成结果（非 force 时直接返回）
    4. 从论文提取文本内容
    5. 调用 AI 服务生成摘要/关键词
    6. 保存结果到数据库
    """
    # 1. 验证论文
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="论文不存在")

    # 2. 检查进行中的分析
    pending = _get_pending_analysis(db, paper_id, analysis_type)
    if pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该论文正在分析中，请稍后查询",
        )

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
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # 5. 提取文本 + AI 分析
    try:
        text = _extract_text_from_paper(paper)
        start_time = time.time()

        summary = generate_summary(text)
        keywords = extract_keywords(text)
        result_json = _build_result_dict(summary, keywords)

        elapsed_ms = int((time.time() - start_time) * 1000)

        # 6. 更新记录为完成
        analysis.status = "completed"
        analysis.result = result_json
        analysis.model_name = "stub-ai"  # Phase 3 替换为真实模型名
        analysis.processing_time_ms = elapsed_ms
        analysis.completed_at = datetime.now(UTC)
        db.commit()
        db.refresh(analysis)

    except ValueError as e:
        # 论文无内容等业务错误
        analysis.status = "failed"
        analysis.error_message = str(e)
        db.commit()
        db.refresh(analysis)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except Exception as e:
        # AI 服务异常
        analysis.status = "failed"
        analysis.error_message = f"AI 分析失败: {str(e)}"
        db.commit()
        db.refresh(analysis)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 服务暂时不可用，请稍后重试: {str(e)}",
        )

    return analysis
