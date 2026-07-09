"""阅读列表/自定义集合路由 — CRUD"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.collection import (
    AddToCollectionRequest,
    Collection,
    CollectionCreate,
    CollectionDetail,
    CollectionUpdate,
)
from app.services import collection_service

router = APIRouter()


@router.post("/", response_model=Collection, status_code=status.HTTP_201_CREATED)
def create_new_collection(
    request: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新阅读列表"""
    return collection_service.create_collection(
        db=db,
        name=request.name,
        description=request.description,
        user_id=current_user.id,
    )


@router.get("/", response_model=list[CollectionDetail])
def read_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前用户的阅读列表（含论文数）"""
    collections = collection_service.get_collections(db, user_id=current_user.id)
    return [
        CollectionDetail(
            id=c.id,
            name=c.name,
            description=c.description,
            user_id=c.user_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            paper_count=len(c.papers),
        )
        for c in collections
    ]


@router.get("/{collection_id}", response_model=CollectionDetail)
def read_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取阅读列表详情（含论文数）"""
    collection = collection_service.get_collection(
        db, collection_id=collection_id, user_id=current_user.id
    )
    if collection is None:
        raise HTTPException(status_code=404, detail="阅读列表不存在")
    return CollectionDetail(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        user_id=collection.user_id,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        paper_count=len(collection.papers),
    )


@router.put("/{collection_id}", response_model=Collection)
def update_existing_collection(
    collection_id: int,
    request: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新阅读列表名称/描述"""
    db_collection = collection_service.update_collection(
        db=db,
        collection_id=collection_id,
        user_id=current_user.id,
        name=request.name,
        description=request.description,
    )
    if db_collection is None:
        raise HTTPException(status_code=404, detail="阅读列表不存在")
    return db_collection


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除阅读列表（自动解除所有论文关联）"""
    success = collection_service.delete_collection(
        db, collection_id=collection_id, user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="阅读列表不存在")
    return None


@router.post("/{collection_id}/papers", response_model=list[dict])
def add_papers_to_collection(
    collection_id: int,
    request: AddToCollectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批量添加论文到阅读列表（幂等操作）"""
    results = collection_service.add_papers_to_collection(
        db=db,
        collection_id=collection_id,
        paper_ids=request.paper_ids,
        user_id=current_user.id,
    )
    return results


@router.delete("/{collection_id}/papers/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_paper_from_collection(
    collection_id: int,
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """从阅读列表移除论文"""
    try:
        collection_service.remove_paper_from_collection(
            db=db,
            collection_id=collection_id,
            paper_id=paper_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        detail = str(e)
        status_code = (
            status.HTTP_404_NOT_FOUND if "不存在" in detail else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail)
    return None
