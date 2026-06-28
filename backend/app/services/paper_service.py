"""论文服务层 — CRUD 和文件管理"""

import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.paper import Paper
from app.models.user import User
from app.schemas.paper import PaperCreate, PaperUpdate
from app.core.config import settings


def create_paper(db: Session, paper: PaperCreate, user_id: int):
    """创建新论文"""
    # 检查 DOI 重复
    if paper.doi:
        existing = db.query(Paper).filter(Paper.doi == paper.doi).first()
        if existing:
            raise ValueError(f"DOI '{paper.doi}' 已被其他论文使用")

    db_paper = Paper(
        title=paper.title,
        abstract=paper.abstract,
        authors=paper.authors,
        publication_date=paper.publication_date,
        doi=paper.doi,
        user_id=user_id
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper


def get_papers(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """获取用户论文列表"""
    return db.query(Paper).filter(Paper.user_id == user_id).offset(skip).limit(limit).all()


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
        existing = db.query(Paper).filter(
            Paper.doi == update_data["doi"],
            Paper.id != paper_id
        ).first()
        if existing:
            raise ValueError(f"DOI '{update_data['doi']}' 已被其他论文使用")

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


def _get_upload_dir() -> str:
    """获取上传目录路径，不存在则创建"""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return settings.UPLOAD_DIR


def _remove_file(file_uuid: str):
    """从磁盘删除文件"""
    upload_dir = _get_upload_dir()
    for ext in ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx']:
        file_path = os.path.join(upload_dir, f"{file_uuid}{ext}")
        if os.path.exists(file_path):
            os.remove(file_path)
            return


def upload_paper_file(db: Session, paper_id: int, user_id: int, file: UploadFile) -> Paper:
    """上传论文文件"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper:
        raise ValueError("论文不存在或无权操作")

    # 删除旧文件（如有）
    if db_paper.file_uuid:
        _remove_file(db_paper.file_uuid)

    # 生成唯一 ID 并保存文件
    file_uuid = str(uuid.uuid4())
    upload_dir = _get_upload_dir()
    ext = os.path.splitext(file.filename)[1] or '.pdf'
    file_path = os.path.join(upload_dir, f"{file_uuid}{ext}")

    # 校验文件大小
    content = file.file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise ValueError(f"文件过大，最大允许 {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")

    with open(file_path, 'wb') as f:
        f.write(content)

    # 更新数据库记录
    db_paper.file_uuid = file_uuid
    db_paper.original_filename = file.filename
    db_paper.file_size = len(content)
    db_paper.file_path = file_path

    db.commit()
    db.refresh(db_paper)
    return db_paper


def download_paper_file(db: Session, paper_id: int, user_id: int) -> tuple:
    """获取论文文件路径和原始文件名，供下载使用"""
    db_paper = db.query(Paper).filter(
        Paper.id == paper_id, Paper.user_id == user_id
    ).first()
    if not db_paper or not db_paper.file_uuid:
        return None, None

    upload_dir = _get_upload_dir()
    ext = '.pdf'
    # 从原文件名推断扩展名
    if db_paper.original_filename:
        ext = os.path.splitext(db_paper.original_filename)[1] or '.pdf'

    file_path = os.path.join(upload_dir, f"{db_paper.file_uuid}{ext}")
    if not os.path.exists(file_path):
        return None, None

    return file_path, db_paper.original_filename or f"{db_paper.file_uuid}{ext}"


def delete_paper_file(db: Session, paper_id: int, user_id: int) -> bool:
    """删除论文的文件记录"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper or not db_paper.file_uuid:
        return False

    _remove_file(db_paper.file_uuid)

    db_paper.file_uuid = None
    db_paper.original_filename = None
    db_paper.file_size = None
    db_paper.file_path = None

    db.commit()
    db.refresh(db_paper)
    return True
