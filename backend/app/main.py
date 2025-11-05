from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import models, crud, database, schemas, auth
from .database import engine, get_db
from dotenv import load_dotenv
import os

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pokemon Search API")

FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5500").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API funcionando"}

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="User already exist")
    db_user = crud.create_user(db, username=user.username, password=user.password, email=user.email)
    return db_user

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserCreate, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, username=credentials.username, password=credentials.password)
    access_token = auth.create_access_token({"sub": user.username, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@app.post("/search-history/", response_model=schemas.SearchHistoryOut)
def create_search_history(search: schemas.SearchHistoryCreate, db: Session = Depends(get_db),
                          token_data: dict = Depends(auth.get_current_token_data)):
    token_user_id = token_data.get("user_id")
    if token_user_id is None or int(token_user_id) != int(search.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not autorized")
    return crud.create_search_history(db=db, user_id=search.user_id, pokemon_name=search.pokemon_name, pokemon_id=search.pokemon_id)

@app.get("/users/{user_id}/searches", response_model=list[schemas.SearchHistoryOut])
def get_history(user_id: int, page: int = 1, size: int = 10, db: Session = Depends(get_db),
                token_data: dict = Depends(auth.get_current_token_data)):
    token_user_id = token_data.get("user_id")
    if token_user_id is None or int(token_user_id) != int(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not autorized")
    skip = (page - 1) * size
    items = crud.get_search_history(db, user_id=user_id, skip=skip, limit=size)
    return items
