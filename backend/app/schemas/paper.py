"""论文 Pydantic 请求/响应模型"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.tag import Tag as TagSchema

class PaperBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    abstract: Optional[str] = None
    authors: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    is_favorite: bool = False

class PaperCreate(PaperBase):
    pass

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    authors: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    is_favorite: Optional[bool] = None

class Paper(PaperBase):
    id: int
    user_id: int
    file_uuid: Optional[str] = None
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    tags: List[TagSchema] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class PaperSearch(BaseModel):
    query: str = Field(..., min_length=1)
    skip: int = 0
    limit: int = 100