"""论文索引服务 — 将论文文本分块、Embedding 后写入向量数据库

数据流：
    paper_upload / paper_create
        → extract_text_from_paper()  # 从 PDF 或摘要提取文本
        → chunk_text()               # 分块
        → embed + upsert()           # 向量化 + 写入 Chroma
"""

import logging

from app.repositories.vector import ChunkItem
from app.repositories.vector_chroma import ChromaVectorRepository
from app.services.ai_utils import extract_text_from_paper
from app.services.chunking_service import chunk_text
from app.services.embedding_service import get_embedding_service
from app.services.paper_service import get_paper
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# ─── 全局单例 ───

_vector_repo: ChromaVectorRepository | None = None


def get_vector_repo() -> ChromaVectorRepository:
    """获取或创建 ChromaVectorRepository 单例"""
    global _vector_repo
    if _vector_repo is None:
        from app.core.config import settings

        _vector_repo = ChromaVectorRepository(
            persist_dir=settings.CHROMA_PERSIST_DIR,
            collection_name=settings.VECTOR_COLLECTION_NAME,
            embedding_service=get_embedding_service(),
        )
        logger.info(
            "VectorRepository 初始化: persist=%s, collection=%s",
            settings.CHROMA_PERSIST_DIR,
            settings.VECTOR_COLLECTION_NAME,
        )
    return _vector_repo


def index_paper(db: Session, paper_id: int, user_id: int) -> int:
    """索引一篇论文：提取文本 → 分块 → 向量化 → 写入 Chroma

    Args:
        db: 数据库会话
        paper_id: 论文 ID
        user_id: 用户 ID（用于权限校验）

    Returns:
        索引的分块数量（0 = 无可索引内容）

    Raises:
        ValueError: 论文不存在或无权访问
    """
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        raise ValueError("论文不存在或无权访问")

    # 1. 提取文本
    try:
        text = extract_text_from_paper(paper)
    except ValueError as e:
        logger.warning("论文不可索引: paper_id=%s, error=%s", paper_id, e)
        return 0

    if not text.strip():
        return 0

    # 2. 分块
    chunks = chunk_text(text)

    if not chunks:
        logger.info("论文无有效文本块: paper_id=%d", paper_id)
        return 0

    # 3. 构建索引条目
    items: list[ChunkItem] = [
        ChunkItem(
            paper_id=paper_id,
            chunk_index=ch["index"],
            text=ch["text"],
            metadata={
                "paper_id": paper_id,
                "user_id": user_id,
                "chunk_index": ch["index"],
                "char_count": ch["char_count"],
            },
        )
        for ch in chunks
    ]

    # 4. 批量写入 Chroma
    repo = get_vector_repo()
    repo.add_batch(items)

    logger.info("论文索引完成: paper_id=%d, chunks=%d", paper_id, len(items))
    return len(items)


def remove_paper_index(paper_id: int) -> None:
    """删除论文的向量索引"""
    repo = get_vector_repo()
    repo.delete(paper_id)
    logger.info("论文索引已删除: paper_id=%d", paper_id)


def reindex_paper(db: Session, paper_id: int, user_id: int) -> int:
    """重新索引论文（先删除旧索引，再重建）"""
    get_vector_repo().delete(paper_id)
    return index_paper(db, paper_id, user_id)
