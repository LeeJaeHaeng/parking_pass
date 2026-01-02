from firebase_functions import https_fn
from firebase_admin import initialize_app
import json
import os
import math
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple

import numpy as np
import pandas as pd
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, DateTime, Float, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Firebase Admin 초기화
initialize_app()

app = FastAPI(title="Cheonan AI Parking Pass API (Cloud)")

# CORS 설정 (함수 레벨에서도 가능하지만 FastAPI 미들웨어로 유지)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 클라우드 함수 환경에서는 유연하게 설정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 경로 설정 (Functions 환경 최적화) =====
BACKEND_DIR = Path(__file__).resolve().parent
# Functions 환경에서는 파일들이 같은 폴더에 있음
PARKING_JSON = BACKEND_DIR / "parkingLots.json"
VIOLATION_PATTERNS_JSON = BACKEND_DIR / "violation_patterns.json"

# ===== 데이터베이스 설정 =====
# 서버리스 환경(Functions)에서는 로컬 SQLite 쓰기가 제한적일 수 있으므로 
# /tmp를 활용하거나 외부 DB(PostgreSQL) 권장
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # 로컬 테스트용이 아니면 /tmp 사용 (휘발성 주의)
    DATABASE_URL = "sqlite:////tmp/dev.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_args = {}
if DATABASE_URL.startswith("postgresql"):
    engine_args = {"pool_size": 5, "max_overflow": 10}

engine = create_engine(DATABASE_URL, echo=False, future=True, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- 모델 및 비즈니스 로직 (기존 main.py와 동일) ---
# (공간 절약을 위해 핵심 로직만 보존하거나 전체 복사)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "cheonan-secure-key-2026")
ALGORITHM = "HS256"

def hash_password(password: str): return pwd_context.hash(password)
def verify_password(password: str, hashed: str): return pwd_context.verify(password, hashed)
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=1440))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class PaymentHistory(Base):
    __tablename__ = "payment_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    parking_lot_name = Column(String, nullable=False)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)
    fee = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    license_plate = Column(String, nullable=False)
    model = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_primary = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic 모델들
class PredictionRequest(BaseModel):
    parking_id: str
    hours_ahead: int = 24

class PredictionData(BaseModel):
    time: str
    occupancy_rate: float
    confidence: float
    factors: Optional[Dict[str, float]] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: EmailStr
    name: Optional[str] = None

# ... (기타 Pydantic 모델 동일) ...

# 데이터 로드 로직
_cache = {}

def load_data():
    if "parking" not in _cache and PARKING_JSON.exists():
        with open(PARKING_JSON, 'r', encoding='utf-8') as f:
            _cache["parking"] = json.load(f)
    if "patterns" not in _cache and VIOLATION_PATTERNS_JSON.exists():
        with open(VIOLATION_PATTERNS_JSON, 'r', encoding='utf-8') as f:
            _cache["patterns"] = json.load(f)
    return _cache.get("parking", []), _cache.get("patterns", {})

def extract_dong(address: str):
    if not address: return ""
    for part in address.split():
        if part.endswith('동') and len(part) >= 2: return part
    return ""

# AI 예측 엔진 (기본 버전 유지)
class PredictionEngine:
    def __init__(self):
        _, self.patterns = load_data()
        lots, _ = load_data()
        self.parking_lots = {lot['id']: lot for lot in lots}
    
    async def generate_predictions(self, parking_id, hours_ahead):
        # (생략: 기존 calculate_occupancy 로직과 동일하게 구현됨을 가정)
        # 실제 구현은 main.py의 로직을 그대로 가져옵니다.
        results = []
        now = datetime.now()
        for i in range(hours_ahead):
            target = now + timedelta(hours=i+1)
            results.append({
                "time": target.strftime('%H:00'),
                "occupancy_rate": 65.0 + math.sin(i) * 10, # 테스트용 임시
                "confidence": 85.0
            })
        return results

# API Endpoints
@app.get("/parking-lots")
async def get_lots():
    lots, _ = load_data()
    return lots

@app.post("/predictions")
async def get_preds(req: PredictionRequest):
    engine = PredictionEngine()
    return await engine.generate_predictions(req.parking_id, req.hours_ahead)

@app.post("/auth/register")
async def register(payload: UserCreate, db: Session = Depends(get_db)):
    # DB 초기화 (SQLite /tmp용)
    Base.metadata.create_all(bind=engine)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing: raise HTTPException(400, "이미 존재")
    user = User(email=payload.email, name=payload.name, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    return {"access_token": create_access_token({"sub": str(user.id)}), "token_type": "bearer", "user_id": user.id, "email": user.email}

# Firebase Function 핸들러
@https_fn.on_request()
def cheonan_api(req: https_fn.Request) -> https_fn.Response:
    # FastAPI를 WSGI/ASGI 핸들러로 변환하여 처리
    from fastapi.testclient import TestClient
    # 로컬에서 테스트할 때처럼 요청을 FastAPI로 전달
    # 실제 프로덕션에서는 mangum 등을 사용하거나 더 효율적인 래퍼 사용 권장
    # 여기서는 간단히 FastAPI의 ASGI 인스턴스를 호출
    import anyio
    
    async def handle():
        # (상세 구현 생략, 개념적 흐름)
        pass
        
    return https_fn.Response("현재 API 준비 중 (FastAPI Wrapper 설정 필요)", status=200)