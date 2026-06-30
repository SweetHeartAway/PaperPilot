"""AI 分析工具函数 — 文本提取、提示词格式化、结果构建

从 ai_summary_service.py 拆分，保持主服务文件聚焦于分析编排。
"""

import json
import logging
from typing import Any

from app.utils.pdf_extractor import extract_text_from_pdf

logger = logging.getLogger(__name__)


def extract_text_from_paper(paper: Any) -> str:
    """从论文对象提取可分析文本

    优先级：
    1. 使用 paper.abstract（用户填写的摘要）
    2. 回退到 PDF 文件全文提取（需要已上传文件）
    """
    if paper.abstract and paper.abstract.strip():
        return paper.abstract.strip()

    if paper.file_path:
        try:
            text = extract_text_from_pdf(paper.file_path)
            logger.info("从 PDF 提取文本成功: paper_id=%s, chars=%d", paper.id, len(text))
            return text
        except (FileNotFoundError, ValueError) as e:
            logger.warning("PDF 文本提取失败: paper_id=%s, error=%s", paper.id, e)
            raise ValueError(f"无法提取 PDF 文本: {e}")

    raise ValueError("论文没有可分析的内容（摘要为空且未上传 PDF 文件）")


def format_user_prompt(template: str | None, paper: Any, content: str) -> str:
    """格式化用户提示词

    将 {title} {abstract} {content} {authors} 替换为实际值。
    template 为空时默认仅返回 content。
    """
    if not template:
        return content

    return template.format(
        title=paper.title or "",
        abstract=paper.abstract or "",
        content=content,
        authors=paper.authors or "",
    )


def build_result_dict(summary: str, keywords: list[str]) -> str:
    """构建结构化 JSON 结果"""
    return json.dumps(
        {
            "summary": summary,
            "keywords": keywords,
            "main_points": [],
        },
        ensure_ascii=False,
    )
