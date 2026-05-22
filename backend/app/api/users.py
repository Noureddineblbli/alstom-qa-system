from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import (
    get_all_users,
    get_user_by_id,
    create_user,
    update_user,
    delete_user
)
from app.core.dependencies import require_admin
from app.models.user import User
from typing import List

router = APIRouter(prefix="/api", tags=["Admin"])


@router.get("/users", response_model=List[UserResponse])
def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return get_all_users(db)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/users", response_model=UserResponse)
def create_new_user(data: UserCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = create_user(data, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_existing_user(user_id: int, data: UserUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = update_user(user_id, data, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.delete("/users/{user_id}")
def delete_existing_user(user_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    result = delete_user(user_id, db)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted successfully"}