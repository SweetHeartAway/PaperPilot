"""用户 ORM 模型"""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.utils.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    # 用户资料增强
    avatar_uuid = Column(String(255), nullable=True, comment="头像文件 UUID")

    # AI 个人偏好（覆盖全局配置）
    ai_api_key = Column(String(500), nullable=True, comment="用户自有的 AI API Key")
    ai_base_url = Column(String(500), nullable=True, comment="用户偏好的 API 地址")
    ai_model = Column(String(100), nullable=True, comment="用户偏好的 AI 模型名称")
    default_prompt_template_id = Column(
        Integer, ForeignKey("ai_prompt_templates.id"), nullable=True, comment="默认 Prompt 模板"
    )

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    papers = relationship("Paper", back_populates="user")
    collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")

    # 用户的 Prompt 模板列表（通过 prompt_templates.user_id 关联）
    prompt_templates = relationship(
        "AIPromptTemplate",
        foreign_keys="AIPromptTemplate.user_id",
        back_populates="user",
    )

    # 默认 Prompt 模板（通过 users.default_prompt_template_id 关联）
    default_prompt_template = relationship(
        "AIPromptTemplate",
        foreign_keys=[default_prompt_template_id],
        uselist=False,
        post_update=True,
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
