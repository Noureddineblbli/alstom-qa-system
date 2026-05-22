from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from app.db.base import Base

class Reference(Base):
    __tablename__ = "references"

    ref_id = Column(String, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)