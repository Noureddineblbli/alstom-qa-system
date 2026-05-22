from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import login

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login_route(request: LoginRequest, db: Session = Depends(get_db)):
    result = login(request.email, request.password, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    return result