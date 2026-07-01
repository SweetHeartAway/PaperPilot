"""Chat 对话 Pydantic Schema"""

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """单条对话消息"""

    role: str = Field(..., pattern=r"^(user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Chat 请求"""

    question: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1, le=20)


class SourceRef(BaseModel):
    """来源引用"""

    chunk_index: int
    text: str
    score: float


class ChatResponse(BaseModel):
    """Chat 响应"""

    answer: str
    sources: list[SourceRef] = Field(default_factory=list)
