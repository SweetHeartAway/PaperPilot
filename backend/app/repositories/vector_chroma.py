"""Chroma 向量数据库 Repository 实现

通过 OpenAI 兼容的 Embedding API（或本地 BGE）生成向量，
存储到 Chroma 本地持久化文件中。

切换为 Milvus 只需新建 vector_milvus.py 实现 VectorRepository 接口。
"""

import logging
from typing import TYPE_CHECKING, Any

from app.repositories.vector import ChunkItem, SearchResult, VectorRepository

if TYPE_CHECKING:
    from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class _ChromaEmbeddingFunction:
    """将 EmbeddingService 适配为 Chroma EmbeddingFunction

    Chroma 1.5+ 的 EmbeddingFunction Protocol 要求实现:
        __call__(), embed_query(), name(), get_config(), build_from_config()
    """

    def __init__(self, embedding_service: "EmbeddingService") -> None:
        self._embed = embedding_service.embed

    def __call__(self, input: list[str]) -> list[list[float]]:
        return self._embed(input)

    def embed_query(self, input: list[str]) -> list[list[float]]:
        """查询文本使用同样的 embedding 方式"""
        return self._embed(input)

    @staticmethod
    def name() -> str:
        return "paperpilot_embedding_service"

    def get_config(self) -> dict[str, Any]:
        return {"service": "paperpilot_embedding_service"}

    @staticmethod
    def build_from_config(config: dict[str, Any]) -> "_ChromaEmbeddingFunction":
        from app.services.embedding_service import get_embedding_service

        return _ChromaEmbeddingFunction(get_embedding_service())


class ChromaVectorRepository(VectorRepository):
    """Chroma 向量数据库实现

    数据持久化到本地文件系统，无需外部服务。
    通过 EmbeddingService（而非直接依赖 EmbeddingClient）获取向量，
    未来替换 Embedding 实现时本仓库代码无需改动。

    索引以分块（chunk）为单位，每个 chunk 的 ID 格式为 "{paper_id}_{chunk_index}"。
    metadata 中存储 paper_id、user_id、chunk_index 用于精确过滤和删除。

    Args:
        persist_dir: Chroma 数据目录
        collection_name: 集合名称
        embedding_service: EmbeddingService 实例
    """

    def __init__(
        self,
        persist_dir: str = "./chroma_db",
        collection_name: str = "papers",
        embedding_service: "EmbeddingService | None" = None,
    ) -> None:
        self._persist_dir = persist_dir
        self._collection_name = collection_name

        import chromadb

        self._chroma_client = chromadb.PersistentClient(path=persist_dir)

        ef = None
        if embedding_service is not None:
            ef = _ChromaEmbeddingFunction(embedding_service)

        self._collection = self._chroma_client.get_or_create_collection(
            name=collection_name,
            embedding_function=ef,
        )

        logger.info(
            "ChromaVectorRepository 初始化: path=%s, collection=%s",
            persist_dir,
            collection_name,
        )

    # ─── 内部辅助 ──────────────────────────────────────────────

    @staticmethod
    def _chunk_id(paper_id: int, chunk_index: int) -> str:
        """生成 Chroma 文档 ID"""
        return f"{paper_id}_{chunk_index}"

    # ─── 接口实现 ──────────────────────────────────────────────

    def add_batch(self, items: list[ChunkItem]) -> None:
        if not items:
            return
        ids = [self._chunk_id(item["paper_id"], item["chunk_index"]) for item in items]
        documents = [item["text"] for item in items]
        metadatas = [item["metadata"] or {} for item in items]

        self._collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        logger.info("Chroma batch upsert: count=%d", len(items))

    def delete(self, paper_id: int) -> None:
        """删除论文的所有分块（通过 metadata 中的 paper_id 过滤）"""
        self._collection.delete(where={"paper_id": paper_id})
        logger.debug("Chroma delete: paper_id=%d", paper_id)

    def search(
        self,
        query: str,
        k: int = 10,
        filter: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        kwargs: dict[str, Any] = {}
        if filter is not None:
            kwargs["where"] = filter

        try:
            results = self._collection.query(
                query_texts=[query],
                n_results=max(k, 1),
                **kwargs,
            )
        except Exception as e:
            logger.error("Chroma search 失败: %s", e)
            raise RuntimeError(f"向量搜索失败: {e}") from e

        # Chroma 返回: {ids: [[str]], distances: [[float]], documents: [[str]], metadatas: [[dict]]}
        ids = results.get("ids", [[]])[0]
        distances = results.get("distances", [[]])[0]
        documents = results.get("documents", [[]])[0]

        if not ids:
            return []

        search_results: list[SearchResult] = []
        for i, pid_full in enumerate(ids):
            # pid_full 格式: "{paper_id}_{chunk_index}"
            parts = pid_full.split("_")
            paper_id = int(parts[0])
            chunk_index = int(parts[1]) if len(parts) > 1 else 0
            text = documents[i] if documents and i < len(documents) else ""
            score = float(distances[i]) if distances and i < len(distances) else 0.0

            search_results.append(
                SearchResult(
                    paper_id=paper_id,
                    chunk_index=chunk_index,
                    text=text,
                    score=score,
                )
            )

        # 按分数升序（Chroma 距离越小越相关）
        search_results.sort(key=lambda r: r["score"])
        return search_results

    def count(self) -> int:
        try:
            return self._collection.count()
        except Exception as e:
            logger.error("Chroma count 失败: %s", e)
            return 0

    def close(self) -> None:
        """Chroma PersistentClient 会在进程退出时自动持久化"""
        logger.info("ChromaVectorRepository closed: path=%s", self._persist_dir)
