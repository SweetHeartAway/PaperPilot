"""AI 分析记录 ORM 模型"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.utils.database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    analysis_type = Column(String(50), nullable=False)  # 如：summary, keywords, recommendations
    result = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    paper = relationship("Paper", back_populates="ai_analyses")

    def __repr__(self):
        return f"<AIAnalysis(id={self.id}, paper_id={self.paper_id}, type={self.analysis_type})>"
