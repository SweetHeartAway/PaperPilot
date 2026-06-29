"""AI分析服务 — 论文内容分析、摘要生成、关键词提取

通过 ai_client 调用真实 AI 模型，无 API Key 时自动降级为本地桩实现。
"""

import json
import logging
from typing import Any

from app.utils.ai_client import ai_client

logger = logging.getLogger(__name__)


_SUMMARY_SYSTEM_PROMPT = (
    """你是一个专业的学术论文分析助手。"""
    """请根据提供的论文内容，生成一份简洁、准确的中文摘要。

要求：
1. 概括论文的核心问题、方法和结论
2. 保持客观，不添加原文没有的信息
3. 控制在 300 字以内
4. 使用中文输出"""
)

_KEYWORD_SYSTEM_PROMPT = (
    """你是一个专业的学术论文关键词提取助手。"""
    """请根据提供的论文内容，提取 3-8 个关键词。

要求：
1. 关键词应准确反映论文的核心主题和方法
2. 优先使用原文中的专业术语
3. 中英文均可，以原文语言为主
4. 仅返回关键词列表，用逗号分隔"""
)


def generate_summary(content: str) -> str:
    """生成论文摘要

    使用配置的 AI 模型生成摘要。无 API Key 时降级为截取前 200 字符。
    """
    if ai_client.is_stub:
        return _stub_summary(content)

    try:
        result = ai_client.chat(
            system_prompt=_SUMMARY_SYSTEM_PROMPT,
            user_prompt=f"以下是论文内容：\n\n{content}",
            temperature=0.3,
        )
        return result.strip()
    except Exception as e:
        logger.warning("AI 生成摘要失败，降级为本地截取: %s", e)
        return _stub_summary(content)


def extract_keywords(content: str) -> list[str]:
    """提取关键词

    使用配置的 AI 模型提取关键词。无 API Key 时降级为词频统计。
    """
    if ai_client.is_stub:
        return _stub_keywords(content)

    try:
        result = ai_client.chat(
            system_prompt=_KEYWORD_SYSTEM_PROMPT,
            user_prompt=f"以下是论文内容：\n\n{content}",
            temperature=0.1,
        )
        # 解析逗号分隔的关键词列表
        keywords = [k.strip() for k in result.split(",") if k.strip()]
        return keywords[:10]  # 最多返回 10 个
    except Exception as e:
        logger.warning("AI 提取关键词失败，降级为本地词频: %s", e)
        return _stub_keywords(content)


def recommend_papers(content: str) -> list[dict[str, str]]:
    """推荐相关论文（需要接入 AI 推荐服务后实现）"""
    # TODO: 需要接入 AI 推荐服务后实现真实推荐逻辑
    return []


def analyze_paper(content: str) -> dict[str, Any]:
    """分析论文内容（组合摘要、关键词、推荐结果）"""
    summary = generate_summary(content)
    keywords = extract_keywords(content)

    return {
        "analysis_id": 1,
        "analysis_type": "full_analysis",
        "result": json.dumps(
            {
                "summary": summary,
                "keywords": keywords,
                "main_points": [],
                "recommendations": recommend_papers(content),
            },
            ensure_ascii=False,
        ),
        "created_at": "2023-01-01T00:00:00",
    }


# ---- 降级实现 ----

_STUB_SUMMARY_LENGTH = 200


def _stub_summary(content: str) -> str:
    """本地桩实现：截取前 N 字符"""
    cleaned = content.strip() if content else ""
    if not cleaned:
        return ""
    summary = cleaned[:_STUB_SUMMARY_LENGTH]
    if len(cleaned) > _STUB_SUMMARY_LENGTH:
        summary += "…"
    return summary


def _stub_keywords(content: str) -> list[str]:
    """本地桩实现：基于词频统计"""
    import re
    from collections import Counter

    tokens = re.findall(r"[一-鿿]+|[a-zA-Z]+", content.lower())
    # 基础停用词
    stop_words = {
        "的",
        "了",
        "在",
        "是",
        "和",
        "就",
        "不",
        "都",
        "一",
        "一个",
        "上",
        "也",
        "很",
        "到",
        "说",
        "要",
        "去",
        "你",
        "会",
        "着",
        "没有",
        "看",
        "好",
        "自己",
        "这",
        "那",
        "the",
        "a",
        "an",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "by",
        "with",
        "and",
        "or",
        "but",
        "not",
        "this",
        "that",
        "it",
        "its",
    }
    tokens = [t for t in tokens if len(t) > 1 and t not in stop_words]
    if not tokens:
        return []
    return [word for word, _ in Counter(tokens).most_common(5)]
