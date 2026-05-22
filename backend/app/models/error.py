from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base

class Error(Base):
    __tablename__ = "errors"

    slotId = Column(String, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.inspection_id"), primary_key=True)
    extracted_id = Column(String, nullable=True)
    expected_id = Column(String, nullable=False)
    extracted_amp = Column(String, nullable=True)
    expected_amp = Column(String, nullable=False)