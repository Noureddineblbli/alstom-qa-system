from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password

from app.models.inspection import Inspection
from app.models.error import Error


def get_all_users(db: Session):
    return db.query(User).all()


def get_user_by_id(user_id: int, db: Session):
    return db.query(User).filter(User.user_id == user_id).first()


def create_user(data: UserCreate, db: Session):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        return None
    user = User(
        nom=data.nom,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        state="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(user_id: int, data: UserUpdate, db: Session):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    if data.nom is not None:
        user.nom = data.nom
    if data.email is not None:
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.state is not None:
        user.state = data.state
    db.commit()
    db.refresh(user)
    return user


def delete_user(user_id: int, db: Session):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    db.delete(user)
    db.commit()
    return True