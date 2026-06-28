from pydantic import BaseModel, Field
from typing import Optional, List

class PaperBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    abstract: Optional[str] = None
    authors: Optional[str] = None
    publication_date: Optional[str] = None
    doi: Optional[str] = None
    file_path: Optional[str] = None
    is_favorite: bool = False

class PaperCreate(PaperBase):
    pass

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    authors: Optional[str] = None
    publication_date: Optional[str] = None
    doi: Optional[str] = None
    file_path: Optional[str] = None
    is_favorite: Optional[bool] = None

class Paper(PaperBase):
    id: int
    user_id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class PaperSearch(BaseModel):
    query: str = Field(..., min_length=1)
    skip: int = 0
    limit: int = 100