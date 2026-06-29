"""AI 分析记录 ORM 模型"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.utils.database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    analysis_type = Column(String(50), nullable=False)  # summary | keywords | full_analysis

    # 状态管理
    status = Column(String(20), nullable=False, default="pending")
    # pending → processing → completed | failed
    # completed → stale（文件重新上传后自动失效）

    # 结果
    result = Column(Text, nullable=True)  # JSON 结构化结果，失败时为 None
    error_message = Column(Text, nullable=True)  # AI 调用失败时的错误信息

    # 版本和元数据
    version = Column(Integer, nullable=False, default=1)  # 重新生成时递增
    model_name = Column(String(100), nullable=True)  # AI 模型名称
    tokens_used = Column(Integer, nullable=True)  # Token 消耗
    processing_time_ms = Column(Integer, nullable=True)  # 处理耗时（毫秒）

    # 时间戳
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)  # 完成时间
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    paper = relationship("Paper", back_populates="ai_analyses")

    def __repr__(self):
        status_str = self.status or "no_status"
        return (
            f"<AIAnalysis(id={self.id}, paper_id={self.paper_id}, "
            f"type={self.analysis_type}, status={status_str})>"
        )
