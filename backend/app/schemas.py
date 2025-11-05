from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    email: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class SearchHistoryCreate(BaseModel):
    user_id: int
    pokemon_name: str
    pokemon_id: int

class SearchHistoryOut(BaseModel):
    id: int
    pokemon_name: str
    pokemon_id: int
    user_id: int
    search_time: datetime
    class Config:
        orm_mode = True
