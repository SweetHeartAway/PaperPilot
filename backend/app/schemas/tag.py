"""标签 Pydantic 请求/响应模型"""

from datetime import datetime

from pydantic import BaseModel, Field


class TagBase(BaseModel):
    """标签基础字段"""

    name: str = Field(..., min_length=1, max_length=50)


class TagCreate(TagBase):
    """创建标签请求"""

    pass


class TagUpdate(BaseModel):
    """更新标签请求"""

    name: str = Field(..., min_length=1, max_length=50)


class Tag(TagBase):
    """标签响应模型"""

    id: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TagDetail(Tag):
    """标签详情响应（含论文数）"""

    paper_count: int = 0


class TagName(BaseModel):
    """论文添加标签请求体"""

    name: str = Field(..., min_length=1, max_length=50)
