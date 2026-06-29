"""PDF 文件文本提取工具"""

import logging
import os

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str, max_chars: int = 50_000) -> str:
    """从 PDF 文件中提取文本内容

    使用 pypdf 库逐页提取文本，适用于论文全文分析。
    限制最大字符数以避免处理过大的文档。

    Args:
        file_path: PDF 文件路径
        max_chars: 最大提取字符数（默认 50000）

    Returns:
        提取的纯文本内容

    Raises:
        FileNotFoundError: PDF 文件不存在
        ValueError: PDF 文件为空或无法提取文本
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF 文件不存在: {file_path}")

    from pypdf import PdfReader

    try:
        reader = PdfReader(file_path)
    except Exception as e:
        raise ValueError(f"无法读取 PDF 文件: {e}")

    if len(reader.pages) == 0:
        raise ValueError("PDF 文件为空，没有任何页面")

    pages_text: list[str] = []
    total_chars = 0

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if total_chars + len(text) > max_chars:
            # 截断到最大字符数
            remaining = max_chars - total_chars
            if remaining > 0:
                pages_text.append(text[:remaining])
            break
        pages_text.append(text)
        total_chars += len(text)

    result = "\n".join(pages_text).strip()

    if not result:
        raise ValueError("无法从 PDF 中提取文本（可能为扫描件或图片型 PDF）")

    logger.info(
        "从 PDF 提取文本成功: pages=%d, chars=%d, file=%s",
        min(len(reader.pages), i + 1),
        len(result),
        os.path.basename(file_path),
    )
    return result
