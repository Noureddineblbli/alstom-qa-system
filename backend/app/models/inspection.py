from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from app.db.base import Base

class Inspection(Base):
    __tablename__ = "inspections"

    inspection_id = Column(Integer, primary_key=True, index=True)
    done_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    done_at = Column(DateTime, server_default=func.now())
    ref_id = Column(String, ForeignKey("references.ref_id"), nullable=False)