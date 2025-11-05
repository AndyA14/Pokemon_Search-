from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    search_histories = relationship("SearchHistory", back_populates="owner")

class SearchHistory(Base):
    __tablename__ = "search_histories"
    id = Column(Integer, primary_key=True, index=True)
    pokemon_name = Column(String)
    pokemon_id = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    search_time = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="search_histories")
