"""用户路由 — 个人/公开信息"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User as UserModel
from app.schemas.user import User
from app.services.user_service import get_user_by_id

router = APIRouter()


@router.get("/me", response_model=User)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user


@router.get("/{user_id}", response_model=User)
def read_user(
    user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)
):
    """获取用户信息（需登录）"""
    db_user = get_user_by_id(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user
