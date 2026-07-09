"""阅读列表/自定义集合服务层 — CRUD 和论文集合关联"""

from app.models.collection import Collection
from app.models.paper import Paper
from sqlalchemy.orm import Session


def create_collection(db: Session, name: str, description: str | None, user_id: int) -> Collection:
    """创建阅读列表"""
    db_collection = Collection(
        name=name.strip(),
        description=description.strip() if description else None,
        user_id=user_id,
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection


def get_collections(db: Session, user_id: int) -> list[Collection]:
    """获取用户的阅读列表（按创建时间倒序）"""
    return (
        db.query(Collection)
        .filter(Collection.user_id == user_id)
        .order_by(Collection.created_at.desc())
        .all()
    )


def get_collection(db: Session, collection_id: int, user_id: int) -> Collection | None:
    """获取单个阅读列表详情"""
    return (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == user_id)
        .first()
    )


def update_collection(
    db: Session, collection_id: int, user_id: int, name: str | None, description: str | None
) -> Collection | None:
    """更新阅读列表名称/描述"""
    db_collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == user_id)
        .first()
    )
    if not db_collection:
        return None

    if name is not None:
        db_collection.name = name.strip()
    if description is not None:
        db_collection.description = description.strip() if description else None

    db.commit()
    db.refresh(db_collection)
    return db_collection


def delete_collection(db: Session, collection_id: int, user_id: int) -> bool:
    """删除阅读列表（自动解除所有论文关联）"""
    db_collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == user_id)
        .first()
    )
    if not db_collection:
        return False

    db.delete(db_collection)
    db.commit()
    return True


def add_papers_to_collection(
    db: Session, collection_id: int, paper_ids: list[int], user_id: int
) -> list[dict]:
    """批量添加论文到阅读列表（幂等操作，跳过已添加的论文）

    返回格式：[{"paper_id": int, "status": "success"|"failed", "reason": str|None}]
    """
    results = []

    db_collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == user_id)
        .first()
    )
    if not db_collection:
        return [
            {
                "paper_id": pid,
                "status": "failed",
                "reason": "阅读列表不存在或无权操作",
            }
            for pid in paper_ids
        ]

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

            # 幂等：已关联则不重复添加
            if paper not in db_collection.papers:
                db_collection.papers.append(paper)

            db.commit()
            results.append({"paper_id": paper_id, "status": "success", "reason": None})
        except Exception as e:
            db.rollback()
            results.append({"paper_id": paper_id, "status": "failed", "reason": str(e)})

    return results


def remove_paper_from_collection(
    db: Session, collection_id: int, paper_id: int, user_id: int
) -> bool:
    """从阅读列表移除论文"""
    db_collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == user_id)
        .first()
    )
    if not db_collection:
        raise ValueError("阅读列表不存在或无权操作")

    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not paper:
        raise ValueError("论文不存在或无权操作")

    if paper not in db_collection.papers:
        raise ValueError("该论文不在当前阅读列表中")

    db_collection.papers.remove(paper)
    db.commit()
    return True
