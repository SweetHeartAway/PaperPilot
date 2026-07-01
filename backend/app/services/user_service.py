"""用户服务层 — CRUD 和认证逻辑"""

import logging
import os
import uuid

from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import get_password_hash, verify_password
from fastapi import UploadFile
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def create_user(db: Session, user: UserCreate) -> User:
    """创建新用户"""
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_id(db: Session, user_id: int):
    """根据ID获取用户"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    """根据邮箱获取用户"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str):
    """根据用户名获取用户"""
    return db.query(User).filter(User.username == username).first()


def update_user_profile(db: Session, user_id: int, user_data: UserUpdate) -> User | None:
    """更新用户资料（不含密码）

    支持字段：username, email, ai_api_key, ai_base_url, ai_model, default_prompt_template_id
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    update_data = user_data.model_dump(exclude_unset=True)

    # 不允许通过此接口修改密码
    update_data.pop("password", None)

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def change_password(db: Session, user_id: int, current_password: str, new_password: str) -> bool:
    """修改密码。验证旧密码正确后更新为新密码。

    Returns:
        True 成功，False 旧密码错误
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False

    if not verify_password(current_password, db_user.hashed_password):
        return False

    db_user.hashed_password = get_password_hash(new_password)
    db.commit()
    return True


def _get_avatar_dir() -> str:
    """获取头像存储目录，不存在则创建"""
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    return avatar_dir


def upload_avatar(db: Session, user_id: int, file: UploadFile) -> str | None:
    """上传用户头像

    Returns:
        新的 avatar_uuid，失败返回 None
    """
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    # 校验文件类型
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed_types:
        raise ValueError(f"不支持的头像格式: {file.content_type}")

    # 生成 UUID
    new_uuid = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    avatar_dir = _get_avatar_dir()
    file_path = os.path.join(avatar_dir, f"{new_uuid}{ext}")

    # 保存文件
    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # 删除旧头像文件
    if db_user.avatar_uuid:
        remove_avatar_file(db_user.avatar_uuid)

    # 更新数据库
    db_user.avatar_uuid = new_uuid
    db.commit()
    db.refresh(db_user)
    return new_uuid


def remove_avatar_file(avatar_uuid: str):
    """从磁盘删除头像文件"""
    avatar_dir = _get_avatar_dir()
    for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        path = os.path.join(avatar_dir, f"{avatar_uuid}{ext}")
        if os.path.exists(path):
            os.remove(path)
            return


def remove_avatar(db: Session, user_id: int) -> bool:
    """删除用户头像"""
    db_user = get_user_by_id(db, user_id)
    if not db_user or not db_user.avatar_uuid:
        return False

    remove_avatar_file(db_user.avatar_uuid)
    db_user.avatar_uuid = None
    db.commit()
    db.refresh(db_user)
    return True


def get_avatar_path(avatar_uuid: str) -> str | None:
    """根据 avatar_uuid 查找头像文件路径"""
    avatar_dir = _get_avatar_dir()
    for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        path = os.path.join(avatar_dir, f"{avatar_uuid}{ext}")
        if os.path.exists(path):
            return path
    return None
