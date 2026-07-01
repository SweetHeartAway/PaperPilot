"""论文 Pydantic 请求/响应模型"""

from datetime import datetime

from app.schemas.tag import Tag as TagSchema
from pydantic import BaseModel, Field


class PaperBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    abstract: str | None = None
    authors: str | None = None
    publication_date: datetime | None = None
    doi: str | None = None
    is_favorite: bool = False


class PaperCreate(PaperBase):
    tag_ids: list[int] = []


class PaperUpdate(BaseModel):
    title: str | None = None
    abstract: str | None = None
    authors: str | None = None
    publication_date: datetime | None = None
    doi: str | None = None
    is_favorite: bool | None = None


class Paper(PaperBase):
    id: int
    user_id: int
    file_uuid: str | None = None
    original_filename: str | None = None
    file_size: int | None = None
    tags: list[TagSchema] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PaperSearch(BaseModel):
    query: str = Field(..., min_length=1)
    skip: int = 0
    limit: int = 100


class PaperListResponse(BaseModel):
    """分页论文列表响应"""

    items: list[Paper]
    total: int
