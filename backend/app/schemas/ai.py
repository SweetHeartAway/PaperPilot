"""AI 分析请求/响应 Pydantic 模型"""

from datetime import datetime

from pydantic import BaseModel, Field


class AIAnalysisRequest(BaseModel):
    paper_content: str = Field(..., min_length=1)
    analysis_type: str = Field(..., min_length=1)  # 如：summary, keywords, recommendations


class AIAnalysisResponse(BaseModel):
    analysis_id: int
    analysis_type: str
    result: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
