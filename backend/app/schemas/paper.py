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


class BatchActionItem(BaseModel):
    """批量操作中单篇论文的结果"""

    paper_id: int
    status: str  # "success" | "failed"
    reason: str | None = None


class BatchActionResponse(BaseModel):
    """批量操作响应"""

    total: int
    succeeded: int
    failed: int
    results: list[BatchActionItem]


class BatchDeleteRequest(BaseModel):
    """批量删除请求"""

    paper_ids: list[int] = Field(..., min_length=1, max_length=50)


class BatchTagRequest(BaseModel):
    """批量添加标签请求"""

    paper_ids: list[int] = Field(..., min_length=1, max_length=50)
    tag_name: str = Field(..., min_length=1, max_length=100)


class DOILookupRequest(BaseModel):
    """DOI 查询请求"""

    doi: str = Field(..., min_length=1, max_length=500, description="DOI 标识符")


class DOILookupResponse(BaseModel):
    """DOI 查询响应（CrossRef 元数据）"""

    title: str
    authors: str
    abstract: str | None = None
    publication_date: datetime | None = None
