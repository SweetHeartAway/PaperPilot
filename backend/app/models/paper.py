from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.utils.database import Base

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    abstract = Column(Text)
    authors = Column(String(500))
    publication_date = Column(DateTime)
    doi = Column(String(100), unique=True, index=True)
    file_path = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_favorite = Column(Boolean, default=False)

    user = relationship("User", back_populates="papers")

    def __repr__(self):
        return f"<Paper(id={self.id}, title={self.title}, user_id={self.user_id})>"