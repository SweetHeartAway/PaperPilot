"""仓储层 — 数据访问抽象

仓储层负责与外部数据存储交互，每个 Repository 都对应一个抽象接口，
使得底层实现（Chroma / Milvus / 其他）可无缝替换。

当前实现：
- VectorRepository     → ChromaVectorRepository
"""

from app.repositories.vector import (
    IndexItem,
    SearchResult,
    VectorRepository,
)
from app.repositories.vector_chroma import ChromaVectorRepository

__all__ = [
    "VectorRepository",
    "ChromaVectorRepository",
    "IndexItem",
    "SearchResult",
]
