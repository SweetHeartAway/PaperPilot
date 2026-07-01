"""文本分块服务 — 用于 RAG 场景的论文文本分段

将长文本按段落切分为固定大小的块，支持段落感知和重叠。
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# 默认分块参数
DEFAULT_CHUNK_SIZE = 1500  # 字符数（约为 500 token）
DEFAULT_CHUNK_OVERLAP = 200  # 重叠字符数


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[dict[str, Any]]:
    """将长文本分割为重叠的块

    分割策略：
    1. 按段落（两个以上换行）分割
    2. 合并段落直到接近 chunk_size
    3. 在段落边界处切割（避免切断句子）
    4. 相邻块之间有重叠（chunk_overlap 字符）

    Args:
        text: 输入文本
        chunk_size: 每块目标字符数
        chunk_overlap: 块之间重叠字符数

    Returns:
        [{index: int, text: str, char_count: int}, ...]
    """
    if not text or not text.strip():
        return []

    # 1. 按段落分割
    paragraphs = re.split(r"\n\s*\n", text.strip())
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    if not paragraphs:
        return []

    # 2. 合并段落为块
    chunks: list[dict[str, Any]] = []
    current_chunk = ""
    current_paragraphs: list[str] = []

    for para in paragraphs:
        # 单个段落超过 chunk_size 时，强制按字符切分
        if len(para) > chunk_size:
            # 先保存当前积累的块
            if current_chunk:
                chunks.append(
                    {
                        "index": len(chunks),
                        "text": current_chunk.strip(),
                        "char_count": len(current_chunk.strip()),
                    }
                )
                current_chunk = ""
                current_paragraphs = []

            # 将大段落切分为多个子块
            for i in range(0, len(para), chunk_size - chunk_overlap):
                sub_chunk = para[i : i + chunk_size]
                if sub_chunk.strip():
                    chunks.append(
                        {
                            "index": len(chunks),
                            "text": sub_chunk.strip(),
                            "char_count": len(sub_chunk.strip()),
                        }
                    )
            continue

        # 加上新段落是否会超限
        separator = "\n\n" if current_chunk else ""
        candidate = current_chunk + separator + para

        if len(candidate) > chunk_size and current_chunk:
            # 保存当前块，开始新块（带重叠）
            chunks.append(
                {
                    "index": len(chunks),
                    "text": current_chunk.strip(),
                    "char_count": len(current_chunk.strip()),
                }
            )

            # 新块从上一个块末尾截取重叠部分
            overlap_text = _get_overlap(current_chunk, chunk_overlap)
            current_chunk = overlap_text + "\n\n" + para
            current_paragraphs = [overlap_text, para]
        else:
            current_chunk = candidate
            current_paragraphs.append(para)

    # 最后一块
    if current_chunk.strip():
        chunks.append(
            {
                "index": len(chunks),
                "text": current_chunk.strip(),
                "char_count": len(current_chunk.strip()),
            }
        )

    logger.info(
        "文本分块完成: total_chars=%d, chunks=%d, chunk_size=%d, overlap=%d",
        len(text),
        len(chunks),
        chunk_size,
        chunk_overlap,
    )
    return chunks


def _get_overlap(text: str, overlap_chars: int) -> str:
    """从文本末尾取指定字符数的重叠部分

    尽量在段落边界截取，避免从句子中间截断。
    """
    if len(text) <= overlap_chars:
        return ""

    tail = text[-overlap_chars:]
    # 尝试在换行处截断
    newline_pos = tail.find("\n")
    if newline_pos != -1 and newline_pos < len(tail) // 2:
        return tail[newline_pos + 1 :]
    return tail
