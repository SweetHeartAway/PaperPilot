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
        is_favorite=paper.is_favorite,
    )

    # 关联已有标签
    if paper.tag_ids:
        from app.models.tag import Tag

        tags = db.query(Tag).filter(Tag.id.in_(paper.tag_ids)).all()
        db_paper.tags = tags

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
    favorite_only: bool = False,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    tag_ids: list[int] | None = None,
    collection_id: int | None = None,
):
    """获取用户论文列表（支持搜索、分页、收藏筛选、排序、标签筛选、阅读列表筛选）"""
    query = db.query(Paper).filter(Paper.user_id == user_id)

    if favorite_only:
        query = query.filter(Paper.is_favorite)

    if tag_ids:
        from app.models.tag import Tag

        query = query.filter(Paper.tags.any(Tag.id.in_(tag_ids)))

    if collection_id is not None:
        query = query.filter(Paper.collections.any(id=collection_id))

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

    # 排序
    allowed_sort_columns = {
        "updated_at": Paper.updated_at,
        "created_at": Paper.created_at,
        "title": Paper.title,
        "publication_date": Paper.publication_date,
        "is_favorite": Paper.is_favorite,
    }
    sort_column = allowed_sort_columns.get(sort_by, Paper.updated_at)
    order_fn = getattr(
        sort_column,
        sort_order.lower() if sort_order.lower() in ("asc", "desc") else "desc",
    )

    papers = (
        query.options(selectinload(Paper.tags)).order_by(order_fn()).offset(skip).limit(limit).all()
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


def toggle_favorite(db: Session, paper_id: int, user_id: int) -> Paper | None:
    """切换论文收藏状态"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper:
        return None
    db_paper.is_favorite = not db_paper.is_favorite
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

    # 清理向量索引
    try:
        from app.services.indexing_service import remove_paper_index

        remove_paper_index(paper_id)
    except Exception as e:
        logger.warning("向量索引清理失败（不影响删除）: paper_id=%s, error=%s", paper_id, e)

    return True


def batch_delete_papers(db: Session, paper_ids: list[int], user_id: int) -> list[dict]:
    """批量删除论文（跳过不存在的论文，不抛异常）

    返回格式：[{"paper_id": int, "status": "success"|"failed", "reason": str|None}]
    """
    results = []
    for paper_id in paper_ids:
        try:
            db_paper = (
                db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
            )
            if not db_paper:
                results.append(
                    {
                        "paper_id": paper_id,
                        "status": "failed",
                        "reason": "论文不存在或无权操作",
                    }
                )
                continue

            if db_paper.file_uuid:
                _remove_file(db_paper.file_uuid)

            # 清理向量索引
            try:
                from app.services.indexing_service import remove_paper_index

                remove_paper_index(paper_id)
            except Exception as e:
                logger.warning("向量索引清理失败: paper_id=%s, error=%s", paper_id, e)

            db.delete(db_paper)
            db.commit()
            results.append({"paper_id": paper_id, "status": "success", "reason": None})
        except Exception as e:
            db.rollback()
            results.append({"paper_id": paper_id, "status": "failed", "reason": str(e)})

    return results


def batch_add_tag(db: Session, paper_ids: list[int], tag_name: str, user_id: int) -> list[dict]:
    """批量给论文添加标签（自动创建标签，幂等操作）

    返回格式：[{"paper_id": int, "status": "success"|"failed", "reason": str|None}]
    """
    from app.models.tag import Tag

    results = []
    name = tag_name.strip()

    # 查找或创建标签
    tag = db.query(Tag).filter(Tag.name == name).first()
    if not tag:
        tag = Tag(name=name)
        db.add(tag)
        db.flush()

    for paper_id in paper_ids:
        try:
            paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
            if not paper:
                results.append(
                    {
                        "paper_id": paper_id,
                        "status": "failed",
                        "reason": "论文不存在或无权操作",
                    }
                )
                continue

            if tag not in paper.tags:
                paper.tags.append(tag)

            db.commit()
            results.append({"paper_id": paper_id, "status": "success", "reason": None})
        except Exception as e:
            db.rollback()
            results.append({"paper_id": paper_id, "status": "failed", "reason": str(e)})

    return results
