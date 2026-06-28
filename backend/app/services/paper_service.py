from sqlalchemy.orm import Session
from app.models.paper import Paper
from app.models.user import User
from app.schemas.paper import PaperCreate, PaperUpdate, PaperSearch
from app.utils.database import get_db

def create_paper(db: Session, paper: PaperCreate, user_id: int):
    """创建新论文"""
    db_paper = Paper(
        title=paper.title,
        abstract=paper.abstract,
        authors=paper.authors,
        publication_date=paper.publication_date,
        doi=paper.doi,
        file_path=paper.file_path,
        user_id=user_id
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper

def get_papers(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """获取用户论文列表"""
    return db.query(Paper).filter(Paper.user_id == user_id).offset(skip).limit(limit).all()

def get_paper(db: Session, paper_id: int):
    """获取论文详情"""
    return db.query(Paper).filter(Paper.id == paper_id).first()

def update_paper(db: Session, paper_id: int, paper: PaperUpdate, user_id: int):
    """更新论文"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper:
        return None

    for key, value in paper.dict(exclude_unset=True).items():
        setattr(db_paper, key, value)

    db.commit()
    db.refresh(db_paper)
    return db_paper

def delete_paper(db: Session, paper_id: int, user_id: int):
    """删除论文"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper:
        return False

    db.delete(db_paper)
    db.commit()
    return True

def search_papers(db: Session, query: str, user_id: int, skip: int = 0, limit: int = 100):
    """搜索论文"""
    search_query = f"%{query}%"
    return db.query(Paper).filter(
        Paper.user_id == user_id,
        (Paper.title.ilike(search_query) |
         Paper.abstract.ilike(search_query) |
         Paper.authors.ilike(search_query) |
         Paper.doi.ilike(search_query))
    ).offset(skip).limit(limit).all()