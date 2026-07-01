"""Paper Chat 路由 — 基于 RAG 的论文对话"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ask_about_paper

router = APIRouter(prefix="/papers", tags=["chat"])


@router.post("/{paper_id}/chat", response_model=ChatResponse)
def chat_with_paper(
    paper_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """与论文对话 — 基于论文内容的 RAG 问答

    用户提出问题，系统从论文中检索相关片段，由 AI 生成回答。

    Args:
        paper_id: 论文 ID
        request: 问题 + 对话历史 + 参数
        db: 数据库会话
        current_user: 当前用户

    Returns:
        answer: AI 回答文本
        sources: 引用来源列表（chunk_index、片段原文、相关度分数）
    """
    try:
        return ask_about_paper(
            db=db,
            paper_id=paper_id,
            user_id=current_user.id,
            question=request.question,
            history=request.history,
            top_k=request.top_k,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
