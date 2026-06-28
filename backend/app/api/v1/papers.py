from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.paper import Paper, PaperCreate, PaperUpdate
from app.services.paper_service import (
    create_paper,
    get_papers,
    get_paper,
    update_paper,
    delete_paper,
    search_papers
)

router = APIRouter()

@router.post("/", response_model=Paper)
def create_new_paper(
    paper: PaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新论文"""
    return create_paper(db=db, paper=paper, user_id=current_user.id)

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
def read_paper(paper_id: int, db: Session = Depends(get_db)):
    """获取论文详情"""
    db_paper = get_paper(db, paper_id=paper_id)
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
    db_paper = update_paper(db, paper_id=paper_id, paper=paper, user_id=current_user.id)
    if db_paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    return db_paper

@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除论文"""
    success = delete_paper(db, paper_id=paper_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="论文不存在")
    return {"message": "论文删除成功"}

@router.post("/{paper_id}/upload")
async def upload_paper_file(
    paper_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传论文文件"""
    # 这里需要实现文件上传逻辑
    return {"filename": file.filename, "paper_id": paper_id}