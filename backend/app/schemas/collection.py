"""阅读列表/自定义集合 Pydantic 请求/响应模型"""

from datetime import datetime

from pydantic import BaseModel, Field


class CollectionCreate(BaseModel):
    """创建阅读列表请求"""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class CollectionUpdate(BaseModel):
    """更新阅读列表请求"""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None


class Collection(BaseModel):
    """阅读列表响应模型"""

    id: int
    name: str
    description: str | None = None
    user_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CollectionDetail(Collection):
    """阅读列表详情响应（含论文数）"""

    paper_count: int = 0


class AddToCollectionRequest(BaseModel):
    """批量添加论文到阅读列表请求"""

    paper_ids: list[int]
