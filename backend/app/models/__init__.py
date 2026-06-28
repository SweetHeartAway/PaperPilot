"""ORM 模型统一导出 — 确保 Base.metadata 注册所有表"""

from app.utils.database import Base
from app.models.user import User
from app.models.paper import Paper
from app.models.ai import AIAnalysis
from app.models.tag import Tag  # noqa: F401 — 注册 paper_tags 表
