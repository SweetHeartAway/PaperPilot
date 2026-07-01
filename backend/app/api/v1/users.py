"""用户路由 — 个人/公开信息"""

import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User as UserModel
from app.schemas.user import ChangePasswordRequest, User, UserUpdate
from app.services.user_service import (
    change_password,
    get_avatar_path,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    remove_avatar,
    update_user_profile,
    upload_avatar,
)

router = APIRouter()


def _enrich_avatar_url(user: UserModel) -> dict:
    """将 ORM User 转为 dict 并补全 avatar_url"""
    data = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "is_active": user.is_active,
        "avatar_uuid": user.avatar_uuid,
        "avatar_url": f"/api/v1/users/{user.id}/avatar" if user.avatar_uuid else None,
        "ai_api_key": user.ai_api_key,
        "ai_base_url": user.ai_base_url,
        "ai_model": user.ai_model,
        "default_prompt_template_id": user.default_prompt_template_id,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }
    return data


@router.get("/me", response_model=User)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """获取当前用户信息"""
    return _enrich_avatar_url(current_user)


@router.put("/me", response_model=User)
def update_users_me(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """更新当前用户资料（用户名、邮箱、AI 偏好等，不含密码）"""
    # 校验邮箱唯一性
    if update_data.email is not None and update_data.email != current_user.email:
        existing = get_user_by_email(db, update_data.email)
        if existing:
            raise HTTPException(status_code=409, detail="邮箱已被使用")

    # 校验用户名唯一性
    if update_data.username is not None and update_data.username != current_user.username:
        existing = get_user_by_username(db, update_data.username)
        if existing:
            raise HTTPException(status_code=409, detail="用户名已被使用")

    updated = update_user_profile(db, current_user.id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="用户不存在")
    return _enrich_avatar_url(updated)


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
def change_my_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """修改当前用户密码"""
    success = change_password(db, current_user.id, request.current_password, request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="当前密码错误")
    return {"message": "密码修改成功"}


@router.post("/me/avatar", response_model=User)
def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """上传当前用户头像"""
    try:
        new_uuid = upload_avatar(db, current_user.id, file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not new_uuid:
        raise HTTPException(status_code=500, detail="头像上传失败")

    db.refresh(current_user)
    return _enrich_avatar_url(current_user)


@router.delete("/me/avatar", response_model=User)
def delete_my_avatar(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """删除当前用户头像"""
    success = remove_avatar(db, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="未设置头像")
    return _enrich_avatar_url(current_user)


@router.get("/{user_id}", response_model=User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """获取指定用户公开信息"""
    db_user = get_user_by_id(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return _enrich_avatar_url(db_user)


@router.get("/{user_id}/avatar")
def get_user_avatar(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """获取用户头像文件"""
    db_user = get_user_by_id(db, user_id)
    if not db_user or not db_user.avatar_uuid:
        raise HTTPException(status_code=404, detail="头像不存在")

    file_path = get_avatar_path(db_user.avatar_uuid)
    if not file_path:
        raise HTTPException(status_code=404, detail="头像文件未找到")

    # 根据扩展名推断媒体类型
    ext = os.path.splitext(file_path)[1].lower()
    media_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(ext, "application/octet-stream")

    return FileResponse(file_path, media_type=media_type)
