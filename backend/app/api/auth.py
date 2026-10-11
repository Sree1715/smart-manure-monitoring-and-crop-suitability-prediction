from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models
from ..schemas import schemas
from ..core import security

router = APIRouter()

@router.post("/auth/register")
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    district = user_data.district or user_data.location or "General"
    role = user_data.role if user_data.role in ["farmer", "authority"] else "farmer"
    hashed_password = security.get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        password_hash=hashed_password,
        role=role,
        district=district
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
        "success": True,
        "message": "User registered successfully",
        "user_id": db_user.id
    }

def _authenticate(user_data: schemas.UserCreate, expected_role: str = None, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not security.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    if expected_role and user.role != expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User role is '{user.role}', but this portal requires '{expected_role}'."
        )

    access_token = security.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "district": user.district
        }
    }

@router.post("/auth/login")
def login(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return _authenticate(user_data, db=db)

@router.post("/auth/farmer/login")
def login_farmer(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return _authenticate(user_data, expected_role="farmer", db=db)

@router.post("/auth/authority/login")
def login_authority(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return _authenticate(user_data, expected_role="authority", db=db)
