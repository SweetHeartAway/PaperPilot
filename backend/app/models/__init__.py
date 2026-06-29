"""ORM 模型统一导出 — 确保 Base.metadata 注册所有表"""

from app.models.ai import AIAnalysis, AIPromptTemplate  # noqa: F401
from app.models.paper import Paper  # noqa: F401
from app.models.tag import Tag  # noqa: F401 — 注册 paper_tags 表
from app.models.user import User  # noqa: F401
from app.utils.database import Base  # noqa: F401
