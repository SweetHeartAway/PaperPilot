"""标签服务层 — CRUD 和论文标签关联"""

from app.models.paper import Paper
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate
from sqlalchemy.orm import Session, selectinload


def create_tag(db: Session, tag: TagCreate):
    """创建标签"""
    name = tag.name.strip()
    existing = db.query(Tag).filter(Tag.name == name).first()
    if existing:
        raise ValueError(f"标签 '{name}' 已存在")

    db_tag = Tag(name=name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def get_tags(db: Session, skip: int = 0, limit: int = 100):
    """获取标签列表"""
    return db.query(Tag).offset(skip).limit(limit).all()


def get_tag(db: Session, tag_id: int):
    """获取标签详情（含论文关联，避免 N+1）"""
    return db.query(Tag).options(selectinload(Tag.papers)).filter(Tag.id == tag_id).first()


def update_tag(db: Session, tag_id: int, tag: TagUpdate):
    """更新标签名称"""
    name = tag.name.strip()
    # 检查重名（排除自身）
    existing = db.query(Tag).filter(Tag.name == name, Tag.id != tag_id).first()
    if existing:
        raise ValueError(f"标签 '{name}' 已存在")

    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        return None

    db_tag.name = name
    db.commit()
    db.refresh(db_tag)
    return db_tag


def delete_tag(db: Session, tag_id: int):
    """删除标签（自动解除所有论文关联）"""
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        return False

    db.delete(db_tag)
    db.commit()
    return True


def add_tag_to_paper(db: Session, paper_id: int, tag_name: str, user_id: int):
    """给论文添加标签（如标签不存在则自动创建，幂等操作）"""
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not paper:
        raise ValueError("论文不存在或无权操作")

    name = tag_name.strip()
    tag = db.query(Tag).filter(Tag.name == name).first()
    if not tag:
        tag = Tag(name=name)
        db.add(tag)
        db.flush()

    # 幂等：已关联则不重复添加
    if tag not in paper.tags:
        paper.tags.append(tag)
        db.commit()

    db.refresh(paper)
    return paper


def remove_tag_from_paper(db: Session, paper_id: int, tag_id: int, user_id: int):
    """从论文移除标签"""
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not paper:
        raise ValueError("论文不存在或无权操作")

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise ValueError("标签不存在")

    if tag not in paper.tags:
        raise ValueError("该论文未关联此标签")

    paper.tags.remove(tag)
    db.commit()
    return True
