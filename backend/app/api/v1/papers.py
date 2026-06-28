"""论文路由 — CRUD、PDF 上传/下载/删除"""

import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.paper import Paper, PaperCreate, PaperUpdate
from app.schemas.tag import TagName
from app.services import tag_service
from app.services.paper_service import (
    create_paper,
    get_papers,
    get_paper,
    update_paper,
    delete_paper,
    upload_paper_file,
    download_paper_file,
    delete_paper_file,
)

router = APIRouter()


@router.post("/", response_model=Paper, status_code=status.HTTP_201_CREATED)
def create_new_paper(
    paper: PaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新论文"""
    try:
        return create_paper(db=db, paper=paper, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[Paper])
def read_papers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取论文列表"""
    papers = get_papers(db, user_id=current_user.id, skip=skip, limit=limit)
    return papers


@router.get("/{paper_id}", response_model=Paper)
def read_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取论文详情"""
    db_paper = get_paper(db, paper_id=paper_id, user_id=current_user.id)
    if db_paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    return db_paper


@router.put("/{paper_id}", response_model=Paper)
def update_existing_paper(
    paper_id: int,
    paper: PaperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新论文"""
    try:
        db_paper = update_paper(db, paper_id=paper_id, paper=paper, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if db_paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    return db_paper


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除论文（含文件）"""
    success = delete_paper(db, paper_id=paper_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="论文不存在")
    return None


@router.post("/{paper_id}/upload", response_model=Paper)
def upload_file(
    paper_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传论文 PDF 文件"""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")

    try:
        result = upload_paper_file(db, paper_id, current_user.id, file)
        return result
    except ValueError as e:
        detail = str(e)
        status_code = 400 if "文件过大" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)


@router.get("/{paper_id}/download")
def download_file(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """下载论文 PDF 文件"""
    file_path, filename = download_paper_file(db, paper_id, current_user.id)
    if not file_path:
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )


@router.delete("/{paper_id}/file", response_model=Paper)
def delete_file(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除论文上传的文件"""
    success = delete_paper_file(db, paper_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="文件不存在")
    # 返回更新后的论文
    db_paper = get_paper(db, paper_id=paper_id)
    return db_paper


@router.post("/{paper_id}/tags", response_model=Paper)
def add_tag_to_paper(
    paper_id: int,
    tag_data: TagName,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """给论文添加标签（如标签不存在则自动创建）"""
    try:
        paper = tag_service.add_tag_to_paper(
            db, paper_id=paper_id, tag_name=tag_data.name, user_id=current_user.id
        )
        return paper
    except ValueError as e:
        detail = str(e)
        status_code = status.HTTP_404_NOT_FOUND if "不存在" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{paper_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_paper(
    paper_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """从论文移除标签"""
    try:
        tag_service.remove_tag_from_paper(db, paper_id=paper_id, tag_id=tag_id, user_id=current_user.id)
    except ValueError as e:
        detail = str(e)
        status_code = status.HTTP_400_BAD_REQUEST
        if "不存在" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail)
    return None
