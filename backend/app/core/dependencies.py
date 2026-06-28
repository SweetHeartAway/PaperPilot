from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from app.utils.database import get_db

def get_current_user(db: Session = Depends(get_db)):
    """获取当前用户（示例）"""
    # 实际应用中需要从token中解析用户信息
    return None

def get_db_session(db: Session = Depends(get_db)):
    """获取数据库会话"""
    try:
        yield db
    finally:
        db.close()