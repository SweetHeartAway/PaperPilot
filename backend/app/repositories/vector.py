"""向量数据库 Repository 抽象接口

定义所有向量数据库实现的统一契约。
新增 Milvus 实现只需实现此接口即可无缝替换 Chroma。
"""

from abc import ABC, abstractmethod
from typing import Any, TypedDict


class IndexItem(TypedDict):
    """索引条目"""

    paper_id: int
    text: str
    metadata: dict[str, Any] | None


class SearchResult(TypedDict):
    """搜索结果"""

    paper_id: int
    score: float


class VectorRepository(ABC):
    """向量数据库仓储抽象接口

    统一增删查操作，屏蔽底层向量数据库差异。
    """

    @abstractmethod
    def upsert(self, paper_id: int, text: str, metadata: dict[str, Any] | None = None) -> None:
        """索引或更新一篇论文

        若 paper_id 已存在则更新，否则新增。
        """
        ...

    @abstractmethod
    def add_batch(self, items: list[IndexItem]) -> None:
        """批量索引论文"""
        ...

    @abstractmethod
    def delete(self, paper_id: int) -> None:
        """删除一篇论文的向量索引"""
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
            [{paper_id, score}, ...]，按相关性降级
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
