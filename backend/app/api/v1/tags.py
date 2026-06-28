"""标签路由 — CRUD"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.tag import Tag, TagCreate, TagUpdate, TagDetail
from app.services import tag_service

router = APIRouter()


@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
def create_new_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新标签"""
    try:
        return tag_service.create_tag(db=db, tag=tag)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[Tag])
def read_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取标签列表"""
    return tag_service.get_tags(db, skip=skip, limit=limit)


@router.get("/{tag_id}", response_model=TagDetail)
def read_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取标签详情（含论文数）"""
    tag = tag_service.get_tag(db, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    return TagDetail(
        id=tag.id,
        name=tag.name,
        created_at=tag.created_at,
        paper_count=len(tag.papers),
    )


@router.put("/{tag_id}", response_model=Tag)
def update_existing_tag(
    tag_id: int,
    tag: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新标签名称"""
    try:
        db_tag = tag_service.update_tag(db, tag_id=tag_id, tag=tag)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if db_tag is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    return db_tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除标签（自动解除所有论文关联）"""
    success = tag_service.delete_tag(db, tag_id=tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="标签不存在")
    return None
