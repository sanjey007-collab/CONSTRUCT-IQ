from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.entities import User, Organization
from app.schemas.schemas import UserLogin, Token, UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account.")
    
    token = create_access_token(
        subject=user.id,
        role=user.role,
        org_id=user.org_id
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/switch-demo-user/{role}", response_model=Token)
def switch_demo_user(role: str, db: Session = Depends(get_db)):
    """Convenience endpoint for instant demo switching between roles."""
    user = db.query(User).filter(User.role == role.upper()).first()
    if not user:
        # Fallback to any user
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No demo users seeded yet.")
    
    token = create_access_token(subject=user.id, role=user.role, org_id=user.org_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
