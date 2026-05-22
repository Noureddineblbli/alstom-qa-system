from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.user_id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.state != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

def require_operator(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "Controller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Controller access required")
    return current_user