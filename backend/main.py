import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import numpy as np
import pandas as pd
import requests
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from prophet import Prophet
from sqlalchemy import Column, Integer, String, DateTime, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session

app = FastAPI(title="Cheonan AI Parking Pass API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발/테스트: 전체 허용
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 환경 변수 로드 (.env.local 우선) =====
def load_env():
    for candidate in [Path(__file__).resolve().parent.parent / ".env.local", Path(__file__).resolve().parent.parent / ".env"]:
        if candidate.exists():
            for line in candidate.read_text(encoding="utf-8").splitlines():
                if not line or line.strip().startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                if key and val and key not in os.environ:
                    os.environ[key.strip()] = val.strip()

load_env()

# ===== 데이터베이스 설정 =====
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./dev.db",  # 기본값: 로컬 SQLite
)
engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===== 비밀번호/JWT 설정 =====
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ===== ORM 모델 =====
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

# ===== Pydantic 모델 =====
class ParkingLot(BaseModel):
    id: int
    name: str
    address: str
    total_spaces: int
    available_spaces: int
    latitude: float
    longitude: float
    fee_basic: int
    fee_additional: int

class PredictionRequest(BaseModel):
    parking_id: int
    hours_ahead: int = 24

class PredictionData(BaseModel):
    time: str
    occupancy_rate: float
    confidence: float

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: EmailStr
    name: Optional[str] = None


class PaymentCreate(BaseModel):
    parking_lot_name: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[int] = None
    fee: int
    user_id: Optional[int] = None


class PaymentOut(BaseModel):
    id: int
    parkingLotName: str
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    duration: Optional[int] = None
    fee: int
    date: str

    class Config:
        orm_mode = True

# Mock 데이터 (실제로는 DB에서 가져옴)
mock_parking_data = [
    {
        "id": 1,
        "name": "불당 공영주차장",
        "address": "충남 천안시 서북구 불당동 123",
        "total_spaces": 150,
        "available_spaces": 45,
        "latitude": 36.8151,
        "longitude": 127.1139,
        "fee_basic": 1000,
        "fee_additional": 500
    }
]

# 기상청 API에서 날씨 데이터 가져오기 (mock)
def get_weather_data():
    # 실제로는 기상청 API 호출
    return {"temperature": 15, "precipitation": 0}

# Prophet 모델로 예측 생성
def generate_prediction(parking_id: int, hours_ahead: int = 24):
    # Mock historical data 생성
    dates = pd.date_range(start='2024-01-01', periods=100, freq='H')
    occupancy = np.random.normal(60, 20, 100)
    occupancy = np.clip(occupancy, 0, 100)

    df = pd.DataFrame({'ds': dates, 'y': occupancy})

    # Prophet 모델 학습
    model = Prophet()
    model.fit(df)

    # 미래 예측
    future = model.make_future_dataframe(periods=hours_ahead, freq='H')
    forecast = model.predict(future)

    predictions = []
    for i in range(hours_ahead):
        time_str = (datetime.now() + timedelta(hours=i+1)).strftime('%H:00')
        pred = forecast.iloc[len(df) + i]
        predictions.append({
            "time": time_str,
            "occupancy_rate": round(pred['yhat'], 1),
            "confidence": round((1 - pred['yhat_upper'] + pred['yhat_lower']) / 2 * 100, 1)
        })

    return predictions

@app.get("/parking-lots", response_model=List[ParkingLot])
async def get_parking_lots():
    return [ParkingLot(**lot) for lot in mock_parking_data]

@app.get("/parking-lots/{parking_id}", response_model=ParkingLot)
async def get_parking_lot(parking_id: int):
    lot = next((lot for lot in mock_parking_data if lot["id"] == parking_id), None)
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    return ParkingLot(**lot)

@app.post("/predictions", response_model=List[PredictionData])
async def get_predictions(request: PredictionRequest):
    predictions = generate_prediction(request.parking_id, request.hours_ahead)
    return [PredictionData(**pred) for pred in predictions]

@app.get("/weather")
async def get_weather():
    return get_weather_data()

# ===== 회원가입/로그인 =====
@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user_id=user.id, email=user.email, name=user.name)

@app.post("/auth/login", response_model=Token)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user_id=user.id, email=user.email, name=user.name)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# ===== 결제/히스토리 =====
@app.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    record = PaymentHistory(
        user_id=payload.user_id,
        parking_lot_name=payload.parking_lot_name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration=payload.duration,
        fee=payload.fee,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return PaymentOut(
        id=record.id,
        parkingLotName=record.parking_lot_name,
        startTime=record.start_time,
        endTime=record.end_time,
        duration=record.duration,
        fee=record.fee,
        date=record.created_at.date().isoformat() if record.created_at else datetime.utcnow().date().isoformat(),
    )


@app.get("/history", response_model=List[PaymentOut])
def get_history(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(PaymentHistory).order_by(PaymentHistory.created_at.desc()).limit(50)
    if user_id:
        query = query.filter(PaymentHistory.user_id == user_id)
    items = query.all()
    return [
        PaymentOut(
            id=rec.id,
            parkingLotName=rec.parking_lot_name,
            startTime=rec.start_time,
            endTime=rec.end_time,
            duration=rec.duration,
            fee=rec.fee,
            date=rec.created_at.date().isoformat() if rec.created_at else datetime.utcnow().date().isoformat(),
        )
        for rec in items
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
