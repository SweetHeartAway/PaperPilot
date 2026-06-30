"""AI 分析请求/响应 Pydantic 模型"""

import json
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

# ─── 遗留通用 AI 分析 Schema ─────────────────────────────────


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


# ─── 论文 AI Summary Schema ──────────────────────────────────


class AIAnalysisTriggerRequest(BaseModel):
    """触发论文 AI 分析请求"""

    analysis_type: str = Field(
        default="summary", pattern=r"^(summary|keywords|full_analysis|method|result|conclusion)$"
    )
    force_regenerate: bool = Field(default=False, description="忽略缓存，强制重新生成")
    custom_prompt_id: int | None = Field(
        default=None, description="自定义提示词模板 ID（空 = 使用默认提示词）"
    )


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
    prompt_template_id: int | None = None
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


# ─── 版本相关 Schema ─────────────────────────────────────────


class AnalysisVersionItem(BaseModel):
    """版本列表中的一项"""

    version: int
    status: str
    model_name: str | None = None
    tokens_used: int | None = None
    created_at: datetime | None = None
    completed_at: datetime | None = None


class VersionDiffResponse(BaseModel):
    """两个版本的差异对比"""

    version_a: int
    version_b: int
    summary_changed: bool = False
    summary: dict[str, str] = Field(
        default_factory=lambda: {"old": "", "new": ""},
        description="新旧摘要（逐句级别）",
    )
    keywords_added: list[str] = []
    keywords_removed: list[str] = []
    main_points_added: list[str] = []
    main_points_removed: list[str] = []


# ─── 批量分析 Schema ─────────────────────────────────────────


class BatchAnalysisRequest(BaseModel):
    """批量触发 AI 分析请求"""

    paper_ids: list[int] = Field(
        ..., min_length=1, max_length=50, description="论文 ID 列表（最多 50 篇）"
    )
    analysis_type: str = Field(
        default="summary", pattern=r"^(summary|keywords|full_analysis|method|result|conclusion)$"
    )
    force_regenerate: bool = False
    custom_prompt_id: int | None = None


class BatchAnalysisItem(BaseModel):
    """批量分析中单篇论文的结果"""

    paper_id: int
    status: str  # accepted | skipped | failed
    analysis_id: int | None = None
    reason: str | None = None


class BatchAnalysisResponse(BaseModel):
    """批量分析响应"""

    total: int
    accepted: int
    skipped: int
    results: list[BatchAnalysisItem]


# ─── 自定义 Prompt Schema ────────────────────────────────────


class PromptTemplateCreate(BaseModel):
    """创建提示词模板请求"""

    name: str = Field(..., min_length=1, max_length=100, description="模板名称")
    description: str | None = None
    analysis_type: str = Field(
        ..., pattern=r"^(summary|keywords|full_analysis|method|result|conclusion)$"
    )
    system_prompt: str = Field(..., min_length=1, description="系统提示词")
    user_prompt_template: str | None = Field(
        None,
        description=(
            "用户提示模板，支持 {content} {title} {abstract} 占位符。" "留空 = 默认仅传入论文内容"
        ),
    )
    is_default: bool = False


class PromptTemplateUpdate(BaseModel):
    """更新提示词模板请求"""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    analysis_type: str | None = Field(
        None, pattern=r"^(summary|keywords|full_analysis|method|result|conclusion)$"
    )
    system_prompt: str | None = Field(None, min_length=1)
    user_prompt_template: str | None = None
    is_default: bool | None = None


class PromptTemplateResponse(BaseModel):
    """提示词模板响应"""

    id: int
    name: str
    description: str | None = None
    analysis_type: str
    system_prompt: str
    user_prompt_template: str | None = None
    is_default: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
