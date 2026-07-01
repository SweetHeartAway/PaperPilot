"""向量数据库 Repository 抽象接口

定义所有向量数据库实现的统一契约。
新增 Milvus 实现只需实现此接口即可无缝替换 Chroma。
"""

from abc import ABC, abstractmethod
from typing import Any, TypedDict


class ChunkItem(TypedDict):
    """分块索引条目 — 用于 RAG 场景"""

    paper_id: int
    chunk_index: int
    text: str
    metadata: dict[str, Any] | None


class SearchResult(TypedDict):
    """搜索结果"""

    paper_id: int
    chunk_index: int
    text: str
    score: float


class VectorRepository(ABC):
    """向量数据库仓储抽象接口

    统一增删查操作，屏蔽底层向量数据库差异。
    """

    @abstractmethod
    def add_batch(self, items: list[ChunkItem]) -> None:
        """批量索引论文分块"""
        ...

    @abstractmethod
    def delete(self, paper_id: int) -> None:
        """删除一篇论文的所有向量索引"""
        ...

    @abstractmethod
    def search(
        self,
        query: str,
        k: int = 10,
        filter: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """语义搜索

        Args:
            query: 搜索文本
            k: 返回结果数
            filter: 元数据过滤条件（Chroma where 语法）

        Returns:
            [{paper_id, chunk_index, text, score}, ...]，按相关性降级
        """
        ...

    @abstractmethod
    def count(self) -> int:
        """当前索引总数"""
        ...

    @abstractmethod
    def close(self) -> None:
        """释放资源（持久化写入、关闭连接等）"""
        ...
