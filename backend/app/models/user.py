from sqlalchemy import Column, Integer, String, Boolean
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "admin" or "controller"
    state = Column(String, default="active")