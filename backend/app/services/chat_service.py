"""Paper Chat 服务 — 基于 RAG 的论文对话

数据流：
    用户提问
        → 语义搜索 Chroma（按 paper_id + user_id 过滤）
        → 取 top-k 相关 chunk 作为上下文
        → 构建 system_prompt（含上下文）
        → 拼接对话历史（history）
        → 调用 AI
        → 返回 answer + sources
"""

import logging
from typing import Any

from app.repositories.vector import SearchResult
from app.schemas.chat import ChatMessage, ChatResponse, SourceRef
from app.services.indexing_service import get_vector_repo
from app.services.paper_service import get_paper
from app.utils.ai_client import ai_client
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# ─── 系统提示词模板 ───

SYSTEM_PROMPT_TPL = """你是一个专业的论文分析助手，基于以下论文内容片段回答用户的问题。

回答要求：
1. 仅基于提供的论文片段回答，不要编造内容
2. 如果论文片段不足以回答问题，请明确说明
3. 引用相关的论文片段编号 [1]、[2] 等来支持你的回答
4. 用中文回答
5. 保持回答简洁、专业

论文内容：
{context}

---
注意事项：论文片段是按语义相关性检索的结果，可能不是连续的段落。
如果问题涉及论文中的图表（如 Figure 3），请根据上下文描述回答。
"""


def _format_context(chunks: list[SearchResult]) -> str:
    """将检索到的 chunk 格式化为上下文文本"""
    parts: list[str] = []
    for i, chunk in enumerate(chunks):
        parts.append(f"[{i + 1}] (相关度: {1 - chunk['score']:.2f})\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _chat_history_to_messages(history: list[ChatMessage]) -> list[dict[str, str]]:
    """将 ChatMessage 列表转换为 AI client 所需的格式"""
    msgs: list[dict[str, str]] = []
    for msg in history:
        msgs.append({"role": msg.role, "content": msg.content})
    # 最多保留最近 10 轮对话
    return msgs[-20:]


def ask_about_paper(
    db: Session,
    paper_id: int,
    user_id: int,
    question: str,
    history: list[ChatMessage] | None = None,
    top_k: int = 5,
) -> ChatResponse:
    """针对一篇论文提问

    Args:
        db: 数据库会话
        paper_id: 论文 ID
        user_id: 用户 ID
        question: 用户问题
        history: 对话历史
        top_k: 检索 chunk 数量

    Returns:
        回答 + 来源引用
    """
    # 1. 验证论文
    paper = get_paper(db, paper_id, user_id)
    if not paper:
        raise ValueError("论文不存在或无权访问")

    # 2. 语义检索
    try:
        repo = get_vector_repo()
        # Chroma where 语法
        filter_clause: dict[str, Any] = {"paper_id": paper_id}
        chunks = repo.search(
            query=question,
            k=top_k,
            filter=filter_clause,
        )
    except Exception as e:
        logger.error("向量检索失败: paper_id=%s, error=%s", paper_id, e)
        # 检索失败时仍然尝试回答（无上下文）
        chunks = []

    if not chunks:
        logger.info("未检索到相关片段: paper_id=%d, question=%s", paper_id, question[:50])
        # 无上下文，直接让 AI 回答
        context_msg = "当前论文暂无索引内容，请根据论文标题和已有信息回答。"
    else:
        context_msg = _format_context(chunks)

    # 3. 构建消息
    system_prompt = SYSTEM_PROMPT_TPL.format(context=context_msg)
    history_messages = _chat_history_to_messages(history or [])

    # 4. 调用 AI
    try:
        answer = ai_client.chat(
            system_prompt=system_prompt,
            user_prompt=question,
            messages=history_messages,
            temperature=0.3,
        )
    except RuntimeError as e:
        raise ValueError(f"AI 服务暂时不可用: {e}")

    # 5. 构建来源引用
    sources: list[SourceRef] = []
    for chunk in chunks:
        sources.append(
            SourceRef(
                chunk_index=chunk["chunk_index"],
                text=chunk["text"][:300],  # 仅返回片段，避免过长
                score=chunk["score"],
            )
        )

    return ChatResponse(answer=answer, sources=sources)
