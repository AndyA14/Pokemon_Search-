from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from . import models, auth

def create_user(db: Session, username: str, password: str, email: str):
    hashed_password = auth.hash_password(password)
    db_user = models.User(username=username, email=email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not auth.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user or password incorrect",
        )
    return user

def create_search_history(db: Session, user_id: int, pokemon_name: str, pokemon_id: int):
    entry = models.SearchHistory(user_id=user_id, pokemon_name=pokemon_name, pokemon_id=pokemon_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_search_history(db: Session, user_id: int, skip: int = 0, limit: int = 10):
    return db.query(models.SearchHistory).filter(models.SearchHistory.user_id == user_id).order_by(models.SearchHistory.search_time.desc()).offset(skip).limit(limit).all()
