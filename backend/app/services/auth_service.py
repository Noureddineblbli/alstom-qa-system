from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, create_access_token

def login(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    if user.state != "active":
        return None
    token = create_access_token(data={"user_id": user.user_id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "nom": user.nom,
        "user_id": user.user_id
    }