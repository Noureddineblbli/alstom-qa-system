from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, index=True)
    projectName = Column(String, unique=True, nullable=False)