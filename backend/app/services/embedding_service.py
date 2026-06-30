"""Embedding 服务 — 统一业务接口

职责：
1. 提供稳定的 Embedding 业务接口，隐藏底层 Provider 切换细节
2. Vector Database 应依赖此接口，不直接依赖 utils/embedding_client
3. 未来替换 Embedding 实现时（换 Provider、改客户端），Vector DB 代码零改动

用法：
    from app.services.embedding_service import EmbeddingService, get_embedding_service

    svc = get_embedding_service()
    vectors = svc.embed("深度学习在自然语言处理中的应用")
    print(svc.dimension)  # 1536
"""

import logging
from typing import Any

from app.utils.embedding_client import EmbeddingClient
from app.utils.embedding_client import embedding_client as _default_client

logger = logging.getLogger(__name__)


class EmbeddingService:
    """统一 Embedding 服务接口

    Vector Database / API 路由等上层模块应仅依赖此接口。
    """

    def __init__(self, client: EmbeddingClient | None = None) -> None:
        self._client = client or _default_client

    def embed(self, texts: str | list[str], **kwargs: Any) -> list[list[float]]:
        """文本向量化

        Args:
            texts: 单段文本或文本列表
            **kwargs: 传递给底层 Provider 的额外参数

        Returns:
            向量列表，形状为 (len(texts), dimension)
        """
        return self._client.embed(texts, **kwargs)

    @property
    def dimension(self) -> int:
        """当前模型的向量维度"""
        return self._client.dimension

    @property
    def provider_name(self) -> str:
        """当前使用的 Provider 名称（日志/调试用）"""
        return self._client.provider_name


# 全局单例（延迟初始化）
_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    """获取或创建 EmbeddingService 单例"""
    global _service
    if _service is None:
        _service = EmbeddingService()
        logger.info(
            "EmbeddingService 初始化: provider=%s, dim=%d",
            _service.provider_name,
            _service.dimension,
        )
    return _service
