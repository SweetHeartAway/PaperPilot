from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse
from app.services.ai_service import analyze_paper

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
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """生成论文摘要"""
    # 实现论文摘要功能
    return {"message": "摘要生成功能待实现"}

@router.post("/recommend")
def recommend_papers(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """推荐相关论文"""
    # 实现论文推荐功能
    return {"message": "论文推荐功能待实现"}