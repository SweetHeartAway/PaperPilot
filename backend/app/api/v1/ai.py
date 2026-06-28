"""AI 路由 — 论文分析、摘要、推荐"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse
from app.services.ai_service import analyze_paper, generate_summary, recommend_papers

router = APIRouter()


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_paper_content(
    request: AIAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """分析论文内容"""
    try:
        result = analyze_paper(request.paper_content)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI分析失败: {str(e)}"
        )


@router.post("/summarize")
def summarize_paper(
    request: AIAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """生成论文摘要"""
    try:
        summary = generate_summary(request.paper_content)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"摘要生成失败: {str(e)}"
        )


@router.post("/recommend")
def recommend_papers_endpoint(
    request: AIAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """推荐相关论文"""
    try:
        result = recommend_papers(request.paper_content)
        return {"recommendations": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"论文推荐失败: {str(e)}"
        )