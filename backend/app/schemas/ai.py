from pydantic import BaseModel
from typing import Optional

class AIAnalysisRequest(BaseModel):
    paper_content: str = Field(..., min_length=1)
    analysis_type: str = Field(..., min_length=1)  # 如：summary, keywords, recommendations

class AIAnalysisResponse(BaseModel):
    analysis_id: int
    analysis_type: str
    result: str
    created_at: str

    class Config:
        from_attributes = True