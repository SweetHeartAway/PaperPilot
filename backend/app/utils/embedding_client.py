"""Embedding 客户端 — 统一文本向量化接口

支持多 Provider 切换，通过 .env 配置即可在 OpenAI / Jina / BGE 间切换，
代码不做 provider 判断。

使用示例：
    from app.utils.embedding_client import embedding_client

    vectors = embedding_client.embed("深度学习在自然语言处理中的应用")
    # 或批量
    vectors = embedding_client.embed(["文本1", "文本2", "文本3"])
    print(embedding_client.dimension)  # 当前向量维度
"""

import logging
from abc import ABC, abstractmethod
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── Provider 抽象基类 ────────────────────────────────────────


class EmbeddingProvider(ABC):
    """Embedding Provider 抽象接口"""

    @abstractmethod
    def embed(self, texts: list[str], **kwargs: Any) -> list[list[float]]:
        """文本 → 向量列表"""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """向量维度"""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider 名称（日志用）"""


# ─── OpenAI 兼容 Provider（OpenAI / Jina 共用） ────────────────


class OpenAICompatibleProvider(EmbeddingProvider):
    """OpenAI 兼容的 Embedding API

    OpenAI:      text-embedding-3-small (1536d) / text-embedding-3-large (3072d)
    Jina:        jina-embeddings-v3 (1024d)
    Ollama:      mxbai-embed-large (1024d) / nomic-embed-text (768d)
    其他兼容:    任何提供 /v1/embeddings 接口的服务
    """

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        model: str = "text-embedding-3-small",
        dimension_hint: int | None = None,
    ) -> None:
        self._model = model
        self._dimension: int = dimension_hint or 1536  # 默认 1536，首次响应后可校准
        self._stub = False

        if not api_key:
            logger.info("Embedding API Key 未配置，启用本地桩实现")
            self._stub = True
            return

        try:
            from openai import OpenAI

            self._client = OpenAI(api_key=api_key, base_url=base_url or None)
            logger.info(
                "Embedding 客户端初始化: provider=openai-compatible, model=%s, base_url=%s",
                model,
                base_url or "https://api.openai.com/v1",
            )
        except Exception as e:
            logger.warning("OpenAI 客户端初始化失败，启用本地桩实现: %s", e)
            self._stub = True

    def embed(self, texts: list[str], **kwargs: Any) -> list[list[float]]:
        if self._stub:
            return _stub_embed(texts, self._dimension)

        try:
            response = self._client.embeddings.create(  # type: ignore[union-attr]
                model=self._model,
                input=texts,
                **kwargs,
            )
            vectors = [item.embedding for item in response.data]

            # 从首次响应校准维度
            if vectors and self._dimension != len(vectors[0]):
                self._dimension = len(vectors[0])

            return vectors
        except Exception as e:
            logger.error("Embedding API 调用失败: %s", e)
            raise RuntimeError(f"Embedding API 调用失败: {e}") from e

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def name(self) -> str:
        return f"openai-compatible({self._model})"


# ─── BGE 本地 Provider ────────────────────────────────────────


class BGEProvider(EmbeddingProvider):
    """BGE 本地 Embedding 模型（sentence-transformers）

    默认模型: BAAI/bge-small-zh-v1.5 (512d)
    其他可选: BAAI/bge-base-zh-v1.5 (768d), BAAI/bge-large-zh-v1.5 (1024d)
    首次运行自动下载模型文件到本地缓存。
    """

    def __init__(self, model_name: str = "BAAI/bge-small-zh-v1.5") -> None:
        self._model_name = model_name
        self._dimension: int = 512  # 初始化后校准
        self._model: Any = None
        self._init_model()

    def _init_model(self) -> None:
        """延迟加载 sentence-transformers 模型"""
        try:
            from sentence_transformers import SentenceTransformer

            logger.info("正在加载 BGE 模型: %s", self._model_name)
            self._model = SentenceTransformer(self._model_name)
            self._dimension = self._model.get_sentence_embedding_dimension()
            logger.info(
                "BGE 模型加载完成: model=%s, dimension=%d",
                self._model_name,
                self._dimension,
            )
        except ImportError:
            logger.error(
                "sentence-transformers 未安装，无法使用 BGE Provider。"
                "请执行: pip install sentence-transformers"
            )
            raise
        except Exception as e:
            logger.error("BGE 模型加载失败: %s", e)
            raise RuntimeError(f"BGE 模型加载失败: {e}") from e

    def embed(self, texts: list[str], **kwargs: Any) -> list[list[float]]:
        if self._model is None:
            return _stub_embed(texts, self._dimension)

        try:
            # BGE 模型在 encode 前建议加 instruction prefix（针对中文）
            prefixed = [f"为这个句子生成表示以用于检索：{t}" for t in texts]
            embeddings = self._model.encode(
                prefixed,
                normalize_embeddings=True,
                show_progress_bar=False,
                **kwargs,
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error("BGE Embedding 失败: %s", e)
            raise RuntimeError(f"BGE Embedding 失败: {e}") from e

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def name(self) -> str:
        return f"bge({self._model_name})"


# ─── 桩实现 ────────────────────────────────────────────────────


def _stub_embed(texts: list[str], dimension: int) -> list[list[float]]:
    """无可用 Provider 时的零向量降级"""
    logger.warning("使用桩 Embedding（零向量），dimension=%d", dimension)
    return [[0.0] * dimension for _ in texts]


# ─── Provider 工厂 ─────────────────────────────────────────────


def _create_provider_from_settings() -> EmbeddingProvider:
    """根据配置创建对应的 Embedding Provider"""
    provider_type = settings.EMBEDDING_PROVIDER.lower()

    if provider_type == "bge":
        return BGEProvider(model_name=settings.BGE_MODEL_NAME)

    # openai / jina / 其他 — 都走 OpenAI 兼容接口
    api_key = settings.EMBEDDING_API_KEY or settings.AI_API_KEY
    base_url = settings.EMBEDDING_BASE_URL or settings.AI_API_BASE_URL

    # Jina 默认地址
    if provider_type == "jina" and not settings.EMBEDDING_BASE_URL:
        base_url = "https://api.jina.ai/v1"
        if not settings.EMBEDDING_API_KEY:
            api_key = settings.AI_API_KEY  # 复用 AI key

    return OpenAICompatibleProvider(
        api_key=api_key,
        base_url=base_url,
        model=settings.EMBEDDING_MODEL,
        dimension_hint=_DIMENSION_HINTS.get(settings.EMBEDDING_MODEL, 1536),
    )


# 常见 Embedding 模型的已知维度（用于初始化时填充，实际仍会校准）
_DIMENSION_HINTS: dict[str, int] = {
    # OpenAI
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
    # Jina
    "jina-embeddings-v3": 1024,
    # Ollama / 本地
    "mxbai-embed-large": 1024,
    "nomic-embed-text": 768,
    "all-minilm": 384,
    # 通义千问
    "text-embedding-v1": 1536,
    "text-embedding-v2": 1536,
}


# ─── 全局单例 ──────────────────────────────────────────────────


class EmbeddingClient:
    """统一 Embedding 客户端入口

    通过 EMBEDDING_PROVIDER 配置切换底层 Provider：
    - openai → OpenAI text-embedding-3-small
    - jina   → jina-embeddings-v3（通过 OpenAI 兼容接口）
    - bge    → 本地 BGE 模型（sentence-transformers）
    """

    def __init__(self) -> None:
        self._provider: EmbeddingProvider | None = None
        self._init_provider()

    def _init_provider(self) -> None:
        try:
            self._provider = _create_provider_from_settings()
            logger.info("EmbeddingClient 初始化: provider=%s", self._provider.name)
        except Exception as e:
            logger.warning("Embedding Provider 初始化失败，使用桩实现: %s", e)
            self._provider = None

    @property
    def provider(self) -> EmbeddingProvider | None:
        """当前使用的 Provider（None 表示桩实现）"""
        return self._provider

    def embed(self, texts: str | list[str], **kwargs: Any) -> list[list[float]]:
        """文本向量化

        Args:
            texts: 单段文本或文本列表
            **kwargs: 传递给底层 Provider 的额外参数

        Returns:
            向量列表，形状为 (len(texts), dimension)

        Raises:
            RuntimeError: 所有 Provider 均不可用
        """
        text_list = [texts] if isinstance(texts, str) else texts
        if not text_list:
            return []

        if self._provider is None:
            # 桩实现：用配置指示的维度
            dim = self.dimension
            logger.warning("EmbeddingClient 未初始化, 返回零向量")
            return [[0.0] * dim for _ in text_list]

        return self._provider.embed(text_list, **kwargs)

    @property
    def dimension(self) -> int:
        """当前模型的向量维度"""
        if self._provider is not None:
            return self._provider.dimension
        # 桩实现：用模型 hint 或 1536 兜底
        return _DIMENSION_HINTS.get(settings.EMBEDDING_MODEL, 1536)

    @property
    def provider_name(self) -> str:
        """当前 Provider 名称（日志/调试用）"""
        if self._provider is not None:
            return self._provider.name
        return "stub"


# 全局单例
embedding_client = EmbeddingClient()
