"""文件服务层 — PDF 文件上传/下载/删除

从 paper_service.py 拆分，保持文件操作与论文数据库操作分离。
"""

import logging
import os
import uuid

from app.core.config import settings
from app.models.ai import AIAnalysis
from app.models.paper import Paper
from fastapi import UploadFile
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _get_upload_dir() -> str:
    """获取上传目录路径，不存在则创建"""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return settings.UPLOAD_DIR


def _remove_file(file_uuid: str):
    """从磁盘删除文件"""
    upload_dir = _get_upload_dir()
    for ext in [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"]:
        file_path = os.path.join(upload_dir, f"{file_uuid}{ext}")
        if os.path.exists(file_path):
            os.remove(file_path)
            return


def _invalidate_ai_analyses(db: Session, paper_id: int) -> int:
    """失效论文的 AI 分析缓存

    文件重新上传后，旧的 AI 分析结果已不准确，标记为 stale。

    Returns:
        失效的记录条数
    """
    stale = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.paper_id == paper_id,
            AIAnalysis.status == "completed",
        )
        .all()
    )
    for analysis in stale:
        analysis.status = "stale"
    return len(stale)


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
    ext = os.path.splitext(file.filename)[1] or ".pdf"
    file_path = os.path.join(upload_dir, f"{file_uuid}{ext}")

    # 分块读取，渐进校验大小（避免 OOM）
    CHUNK_SIZE = 64 * 1024  # 64KB
    total = 0
    with open(file_path, "wb") as f:
        while True:
            chunk = file.file.read(CHUNK_SIZE)
            if not chunk:
                break
            total += len(chunk)
            if total > settings.MAX_UPLOAD_SIZE:
                # 删除已写入的部分文件
                f.close()
                os.remove(file_path)
                raise ValueError(f"文件过大，最大允许 {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
            f.write(chunk)

    # 更新数据库记录
    db_paper.file_uuid = file_uuid
    db_paper.original_filename = file.filename
    db_paper.file_size = total
    db_paper.file_path = file_path

    # 文件变更后，自动失效旧的 AI 分析缓存
    stale_count = _invalidate_ai_analyses(db, paper_id)

    db.commit()
    db.refresh(db_paper)
    if stale_count > 0:
        logger.info("已失效 %d 条 AI 分析缓存: paper_id=%s", stale_count, paper_id)
    return db_paper


def download_paper_file(db: Session, paper_id: int, user_id: int) -> tuple:
    """获取论文文件路径和原始文件名，供下载使用"""
    db_paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
    if not db_paper or not db_paper.file_uuid:
        return None, None

    upload_dir = _get_upload_dir()
    ext = ".pdf"
    # 从原文件名推断扩展名
    if db_paper.original_filename:
        ext = os.path.splitext(db_paper.original_filename)[1] or ".pdf"

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
