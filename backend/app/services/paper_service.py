"""论文服务层 — CRUD 和 DOI 唯一性校验

文件上传/下载/删除功能已移至 file_service.py。
"""

import logging

from app.models.paper import Paper
from app.schemas.paper import PaperCreate, PaperUpdate
from app.services.file_service import _remove_file
from sqlalchemy.orm import Session, selectinload

logger = logging.getLogger(__name__)


def _validate_doi_unique(db: Session, doi: str, exclude_paper_id: int | None = None):
    """检查 DOI 唯一性，重复时抛出 ValueError"""
    query = db.query(Paper).filter(Paper.doi == doi)
    if exclude_paper_id is not None:
        query = query.filter(Paper.id != exclude_paper_id)
    if query.first():
        raise ValueError(f"DOI '{doi}' 已被其他论文使用")


def create_paper(db: Session, paper: PaperCreate, user_id: int):
    """创建新论文"""
    if paper.doi:
        _validate_doi_unique(db, paper.doi)

    db_paper = Paper(
        title=paper.title,
        abstract=paper.abstract,
        authors=paper.authors,
        publication_date=paper.publication_date,
        doi=paper.doi,
        user_id=user_id,
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper


def get_papers(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
):
    """获取用户论文列表（支持搜索和分页）"""
    query = db.query(Paper).filter(Paper.user_id == user_id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Paper.title.ilike(like),
                Paper.authors.ilike(like),
                Paper.abstract.ilike(like),
                Paper.doi.ilike(like),
            )
        )

    total = query.count()
    papers = (
        query.options(selectinload(Paper.tags))
        .order_by(Paper.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return papers, total


def get_paper(db: Session, paper_id: int, user_id: int | None = None):
    """获取论文详情（可选按 user_id 过滤）"""
    query = db.query(Paper).filter(Paper.id == paper_id)
    if user_id is not None:
        query = query.filter(Paper.user_id == user_id)
    return query.first()


def update_paper(db: Session, paper_id: int, paper: PaperUpdate, user_id: int):
    """更新论文"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper:
        return None

    update_data = paper.model_dump(exclude_unset=True)

    # 检查 DOI 重复（排除自身）
    if "doi" in update_data and update_data["doi"]:
        _validate_doi_unique(db, update_data["doi"], exclude_paper_id=paper_id)

    for key, value in update_data.items():
        setattr(db_paper, key, value)

    db.commit()
    db.refresh(db_paper)
    return db_paper


def delete_paper(db: Session, paper_id: int, user_id: int):
    """删除论文（包括文件）"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper:
        return False

    # 删除关联的文件
    if db_paper.file_uuid:
        _remove_file(db_paper.file_uuid)

    db.delete(db_paper)
    db.commit()
    return True
