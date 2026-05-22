from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base

class ReferenceData(Base):
    __tablename__ = "reference_data"

    slotId = Column(String, primary_key=True, index=True)
    ref_id = Column(String, ForeignKey("references.ref_id"), nullable=False, primary_key=True)
    identification_id = Column(String, nullable=False)
    amperage = Column(String, nullable=False)