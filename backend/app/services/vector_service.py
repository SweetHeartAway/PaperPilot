"""向量索引服务 — 业务逻辑层

职责：
1. 封装 VectorRepository，提供上层友好的增删查接口
2. 根据配置自动创建对应的 Repository（Chroma / 未来 Milvus）
3. 统一错误处理与日志

用法：
    from app.services.vector_service import VectorService

    service = VectorService()
    service.index(1, "论文全文文本", {"title": "深度学习综述"})
    results = service.search("注意力机制", k=5)
"""

import logging
from typing import Any

from app.core.config import settings
from app.repositories import ChromaVectorRepository
from app.repositories.vector import SearchResult, VectorRepository
from app.utils.embedding_client import embedding_client

logger = logging.getLogger(__name__)


def _create_repository() -> VectorRepository:
    """根据配置创建向量数据库 Repository

    当前仅支持 Chroma，扩展 Milvus 在此处添加分支。
    """
    provider = settings.VECTOR_DB_PROVIDER.lower()

    if provider == "chroma":
        return ChromaVectorRepository(
            persist_dir=settings.CHROMA_PERSIST_DIR,
            collection_name=settings.VECTOR_COLLECTION_NAME,
            embedding_client=embedding_client,
        )

    if provider == "milvus":
        raise NotImplementedError("Milvus 支持尚未实现")

    raise ValueError(f"不支持的向量数据库: {provider}")


# 全局单例（延迟初始化）
_repository: VectorRepository | None = None


def get_repository() -> VectorRepository:
    """获取或创建 Repository 单例"""
    global _repository
    if _repository is None:
        _repository = _create_repository()
    return _repository


class VectorService:
    """向量索引服务

    可通过 `VectorService(repo=...)` 注入自定义 Repository，方便测试。
    """

    def __init__(self, repo: VectorRepository | None = None) -> None:
        self._repo = repo or get_repository()

    # ─── 索引管理 ──────────────────────────────────────────────

    def index(self, paper_id: int, text: str, **metadata: Any) -> None:
        """索引或更新一篇论文

        Args:
            paper_id: 论文 ID
            text: 论文全文或摘要（用于向量化的文本）
            **metadata: 附加元数据（title, authors, tags 等），可用于搜索过滤

        Raises:
            RuntimeError: Chroma 操作失败
        """
        try:
            self._repo.upsert(paper_id, text, metadata or None)
            logger.info("向量索引成功: paper_id=%d", paper_id)
        except Exception as e:
            logger.error("向量索引失败: paper_id=%d, error=%s", paper_id, e)
            raise

    def remove(self, paper_id: int) -> None:
        """删除论文的向量索引"""
        try:
            self._repo.delete(paper_id)
            logger.info("向量索引已删除: paper_id=%d", paper_id)
        except Exception as e:
            logger.error("删除向量索引失败: paper_id=%d, error=%s", paper_id, e)
            raise

    # ─── 语义搜索 ──────────────────────────────────────────────

    def search(
        self,
        query: str,
        k: int = 10,
        **filter_kwargs: Any,
    ) -> list[SearchResult]:
        """语义搜索

        Args:
            query: 搜索文本
            k: 返回结果数
            **filter_kwargs: 元数据过滤条件，传入 Chroma where 语法

        Returns:
            [{paper_id, score}, ...]，按距离（越小越相似）升序
        """
        try:
            return self._repo.search(query, k, filter_kwargs or None)
        except Exception as e:
            logger.error("语义搜索失败: query=%s, error=%s", query[:50], e)
            raise

    # ─── 统计 ──────────────────────────────────────────────────

    @property
    def count(self) -> int:
        """索引总数"""
        return self._repo.count()

    # ─── 生命周期 ──────────────────────────────────────────────

    def close(self) -> None:
        """释放 Repository 资源"""
        self._repo.close()
