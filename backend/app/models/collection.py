"""阅读列表/自定义集合 ORM 模型"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.utils.database import Base

# 论文-集合多对多关联表
paper_collections = Table(
    "paper_collections",
    Base.metadata,
    Column("paper_id", Integer, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "collection_id", Integer, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Collection(Base):
    """阅读列表/自定义集合模型"""

    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="collections")
    papers = relationship("Paper", secondary="paper_collections", back_populates="collections")

    def __repr__(self):
        return f"<Collection(id={self.id}, name={self.name}, user_id={self.user_id})>"
