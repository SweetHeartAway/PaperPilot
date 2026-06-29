"""AI 分析请求/响应 Pydantic 模型"""

import json
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class AIAnalysisRequest(BaseModel):
    """遗留请求模型 — 通用 AI 分析（/api/v1/ai/ 路由使用）"""

    paper_content: str = Field(..., min_length=1)
    analysis_type: str = Field(..., min_length=1)  # 如：summary, keywords, recommendations


class AIAnalysisResponse(BaseModel):
    """遗留响应模型 — 通用 AI 分析"""

    analysis_id: int
    analysis_type: str
    result: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ─── 论文 AI Summary 新 Schema ─────────────────────────────────


class AIAnalysisTriggerRequest(BaseModel):
    """触发论文 AI 分析请求"""

    analysis_type: str = Field(default="summary", pattern=r"^(summary|keywords|full_analysis)$")
    force_regenerate: bool = Field(default=False, description="忽略缓存，强制重新生成")


class AIAnalysisResultContent(BaseModel):
    """AI 分析结果内容（结构化 JSON）"""

    summary: str = ""
    keywords: list[str] = []
    main_points: list[str] = []


class AIAnalysisStatusResponse(BaseModel):
    """论文 AI 分析响应"""

    id: int
    paper_id: int
    analysis_type: str
    status: str  # pending | processing | completed | failed
    result: AIAnalysisResultContent | None = None
    error_message: str | None = None
    version: int = 1
    model_name: str | None = None
    tokens_used: int | None = None
    created_at: datetime | None = None
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}

    @field_validator("result", mode="before")
    @classmethod
    def parse_result_json(cls, v):
        """数据库中以 JSON 字符串存储，自动解析为结构化对象"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v
