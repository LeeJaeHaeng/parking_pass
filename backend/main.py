"""
천안 AI 파킹 패스 - 백엔드 API
실제 CSV 데이터 + 불법주정차 패턴 + 날씨/휴일 정보 기반 AI 예측
"""
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

app = FastAPI(title="Cheonan AI Parking Pass API")

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "environment": os.getenv("RENDER", "local"),
        "version": "1.0.3",
        "timestamp": "2026-01-02 23:55"
    }

@app.get("/db-debug")
def db_debug():
    debug_info = {
        "database_url_configured": DATABASE_URL is not None,
        "database_type": "postgresql" if DATABASE_URL.startswith("postgresql") else "sqlite",
        "url_preview": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "no-credentials-found",
        "keys_loaded": {
            "KMA": os.getenv("VITE_KMA_API_KEY") is not None or os.getenv("KMA_API_KEY") is not None,
            "HOLIDAY": os.getenv("VITE_HOLIDAY_API_KEY") is not None or os.getenv("HOLIDAY_API_KEY") is not None
        }
    }
    try:
        # 실제 연결 테스트
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1")).scalar()
            debug_info["connection_test"] = "success"
            debug_info["test_result"] = result
    except Exception as e:
        debug_info["connection_test"] = "failed"
        debug_info["error"] = str(e)
    
    return debug_info

@app.get("/weather-debug")
async def weather_debug():
    api_key = os.getenv("VITE_KMA_API_KEY") or os.getenv("KMA_API_KEY")
    lat, lon = 36.815, 127.113
    nx, ny = map_to_grid(lat, lon)
    base_date, base_time = get_vilage_fcst_base_time(datetime.now())
    
    url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
    params = {
        "serviceKey": api_key,
        "pageNo": "1",
        "numOfRows": "100",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        return {
            "url": url.replace(api_key, "HIDDEN") if api_key else url,
            "status_code": response.status_code,
            "response_text": response.text[:500],
            "params": {k: v for k, v in params.items() if k != "serviceKey"},
            "api_key_status": "present" if api_key else "missing",
            "api_key_preview": api_key[:5] + "..." if api_key else "none"
        }
    except Exception as e:
        return {"error": str(e)}

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 경로 설정 =====
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# 도커 환경(배포용)과 로컬 환경(개발용) 모두 대응
PARKING_JSON = BACKEND_DIR / "parkingLots.json"
if not PARKING_JSON.exists():
    PARKING_JSON = PROJECT_ROOT / "src" / "app" / "data" / "parkingLots.json"

VIOLATION_PATTERNS_JSON = BACKEND_DIR / "violation_patterns.json"

# ===== 환경 변수 로드 =====
def load_env():
    for candidate in [PROJECT_ROOT / ".env.local", PROJECT_ROOT / ".env"]:
        if candidate.exists():
            for line in candidate.read_text(encoding="utf-8").splitlines():
                if not line or line.strip().startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                if key and val and key not in os.environ:
                    os.environ[key.strip()] = val.strip()

load_env()

# ===== 데이터베이스 설정 =====
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# SQLAlchemy 1.4+ 에서는 postgres:// 대신 postgresql:// 를 사용해야 함
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 클라우드 DB 연결 안정성을 위한 설정
engine_args = {}
if DATABASE_URL.startswith("postgresql"):
    # SSL 설정을 명시적으로 추가하여 연결 오류 방지
    if "?" not in DATABASE_URL:
        DATABASE_URL += "?sslmode=require"
    elif "sslmode" not in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
        
    engine_args = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True, # 연결 끊김 감지 시 재연결
    }

engine = create_engine(DATABASE_URL, echo=False, future=True, **engine_args)
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

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    license_plate = Column(String, nullable=False)
    model = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_primary = Column(Integer, default=0) # SQLite boolean 호환
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ===== Pydantic 모델 =====
class ParkingLotOut(BaseModel):
    id: str
    name: str
    address: str
    totalSpaces: int
    availableSpaces: Optional[int] = None
    latitude: float
    longitude: float
    type: str
    parkingType: Optional[str] = None
    operatingHours: Optional[str] = None
    operatingDays: Optional[str] = None
    fee: Dict[str, Any]
    feeInfo: Optional[str] = None
    hasDisabledParking: Optional[bool] = None
    managingOrg: Optional[str] = None
    phone: Optional[str] = None

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

class VehicleCreate(BaseModel):
    user_id: int
    license_plate: str
    model: Optional[str] = None
    color: Optional[str] = None
    is_primary: bool = False

class VehicleOut(BaseModel):
    id: int
    license_plate: str
    model: Optional[str] = None
    color: Optional[str] = None
    is_primary: bool
    
    class Config:
        orm_mode = True

# ===== 데이터 로드 =====
_parking_lots_cache: List[Dict] = []
_violation_patterns_cache: Dict = {}

def load_parking_lots() -> List[Dict]:
    global _parking_lots_cache
    if _parking_lots_cache:
        return _parking_lots_cache
    
    if PARKING_JSON.exists():
        with open(PARKING_JSON, 'r', encoding='utf-8') as f:
            _parking_lots_cache = json.load(f)
    return _parking_lots_cache

def load_violation_patterns() -> Dict:
    global _violation_patterns_cache
    if _violation_patterns_cache:
        return _violation_patterns_cache
    
    if VIOLATION_PATTERNS_JSON.exists():
        with open(VIOLATION_PATTERNS_JSON, 'r', encoding='utf-8') as f:
            _violation_patterns_cache = json.load(f)
    return _violation_patterns_cache

def extract_dong_from_address(address: str) -> str:
    if not address:
        return ""
    parts = address.split()
    for part in parts:
        if part.endswith('동') and len(part) >= 2 and not part.endswith('읍동'):
            return part
    for part in parts:
        if part.endswith('읍') or part.endswith('면'):
            return part
    return ""

# ===== 날씨 및 휴일 API 유틸리티 =====

# 기상청 격자 변환 (위경도 -> X,Y)
def map_to_grid(lat, lon, code=0):
    NX = 149            # X축 격자점 수
    NY = 253            # Y축 격자점 수
    items = dict()
    items['re'] = 6371.00877    # 지도반경
    items['grid'] = 5.0         # 격자간격 (km)
    items['slat1'] = 30.0       # 표준위도 1
    items['slat2'] = 60.0       # 표준위도 2
    items['olon'] = 126.0       # 기준점 경도
    items['olat'] = 38.0        # 기준점 위도
    items['xo'] = 210 / items['grid']   # 기준점 X좌표
    items['yo'] = 675 / items['grid']   # 기준점 Y좌표
    
    DEGRAD = math.pi / 180.0
    RADDEG = 180.0 / math.pi
    
    re = items['re'] / items['grid']
    slat1 = items['slat1'] * DEGRAD
    slat2 = items['slat2'] * DEGRAD
    olon = items['olon'] * DEGRAD
    olat = items['olat'] * DEGRAD
    
    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)
    
    ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
    ra = re * sf / math.pow(ra, sn)
    
    theta = lon * DEGRAD - olon
    if theta > math.pi:
        theta -= 2.0 * math.pi
    if theta < -math.pi:
        theta += 2.0 * math.pi
    theta *= sn
    
    x = (ra * math.sin(theta)) + items['xo']
    y = (ro - ra * math.cos(theta)) + items['yo']
    
    return int(x + 1.5), int(y + 1.5)

def get_vilage_fcst_base_time(now: datetime) -> Tuple[str, str]:
    """단기예보 Base Time 계산 (02, 05, 08, 11, 14, 17, 20, 23시 + 10분)"""
    # API 제공 시각을 고려해 15분 전 시간을 기준으로 계산
    target = now - timedelta(minutes=15)
    
    hour = target.hour
    if hour < 2:
        base_hour = 23
        base_date = (target - timedelta(days=1)).strftime("%Y%m%d")
    else:
        base_hour = ((hour - 2) // 3) * 3 + 2
        base_date = target.strftime("%Y%m%d")
        
    return base_date, f"{base_hour:02d}00"

async def fetch_real_weather(lat: float, lon: float):
    """기상청 단기예보 조회 (강수확률 포함)"""
    api_key = os.getenv("VITE_KMA_API_KEY") or os.getenv("KMA_API_KEY")
    if not api_key or api_key == "your_kma_key":
        return None
    
    nx, ny = map_to_grid(lat, lon)
    base_date, base_time = get_vilage_fcst_base_time(datetime.now())
    
    url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
    params = {
        "serviceKey": api_key,
        "pageNo": "1",
        "numOfRows": "1000",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny
    }
    
    try:
        # 동기 요청 (간단 구현)
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            items = data['response']['body']['items']['item']
            
            # 가장 빠른 예측 시간의 데이터 수집
            weather = {}
            target_fcst_time = None
            
            for item in items:
                # 첫 번째 나오는 fcstTime을 타겟으로 잡음 (가장 가까운 미래)
                if target_fcst_time is None:
                    target_fcst_time = item['fcstTime']
                
                if item['fcstTime'] == target_fcst_time:
                    cat = item['category']
                    val = item['fcstValue']
                    
                    if cat == 'TMP': # 1시간 기온
                        weather['temperature'] = float(val)
                    elif cat == 'POP': # 강수확률
                        weather['pop'] = int(val)
                    elif cat == 'PTY': # 강수형태
                        weather['pty'] = int(val)
                    elif cat == 'SKY': # 하늘상태 (1:맑음, 3:구름많음, 4:흐림)
                        weather['sky'] = int(val)

            # 상태 매핑
            condition = "sunny"
            if weather.get('pty', 0) > 0:
                pty = weather.get('pty')
                if pty in [1, 5, 4]: condition = "rainy" # 비, 빗방울, 소나기
                elif pty in [2, 3]: condition = "snowy"  # 비/눈, 눈
            elif weather.get('sky', 1) > 2:
                condition = "cloudy"
            
            return {
                "temperature": weather.get('temperature', 0),
                "condition": condition,
                "precipitationProbability": weather.get('pop', 0),
                "rain_mm": 0 # 단기예보에는 강수량(PCP)이 '강수없음' 등으로 문자열로 옴, 처리 복잡해서 생략
            }
    except Exception as e:
        print(f"Weather API Error: {e}")
        return None
    return None

async def check_is_holiday(date_str: str =  None):
    """특일(공휴일) 정보 조회"""
    if not date_str:
        date_str = datetime.now().strftime("%Y%m%d")
    
    api_key = os.getenv("VITE_HOLIDAY_API_KEY") or os.getenv("HOLIDAY_API_KEY")
    if not api_key or api_key == "your_holiday_key":
        # 주말 체크만
        dt = datetime.strptime(date_str, "%Y%m%d")
        return dt.weekday() >= 5
        
    year = date_str[:4]
    month = date_str[4:6]
    
    url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
    params = {
        "serviceKey": api_key,
        "solYear": year,
        "solMonth": month,
        "_type": "json"
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            # items가 없거나 비어있는 경우 체크
            if "items" in data["response"]["body"] and data["response"]["body"]["items"]:
                items = data["response"]["body"]["items"]["item"]
                if isinstance(items, dict):
                    items = [items]
                for item in items:
                    if str(item["locdate"]) == date_str and item["isHoliday"] == "Y":
                        return True
    except Exception as e:
        print(f"Holiday API Error: {e}")
        pass
    
    # 주말 체크
    dt = datetime.strptime(date_str, "%Y%m%d")
    return dt.weekday() >= 5

# ===== 가중치 기반 예측 엔진 =====
class PredictionEngine:
    
    WEIGHTS = {
        'hourly': 0.30,
        'daily': 0.15,      # 요일 비중 축소 (휴일에 포함)
        'location': 0.20,
        'fee': 0.10,
        'capacity': 0.10,
        'weather': 0.10,    # 신규
        'holiday': 0.05     # 신규
    }
    
    def __init__(self):
        self.patterns = load_violation_patterns()
        self.parking_lots = {lot['id']: lot for lot in load_parking_lots()}
        
        # 캐싱된 날씨/휴일 (메모리)
        self.cached_weather = None
        self.weather_updated = None
        self.is_holiday_today = False
        self.initialized_extras = False

    async def update_extras(self):
        """날씨 및 휴일 정보 업데이트"""
        now = datetime.now()
        # 10분에 한번 날씨 업데이트
        if not self.cached_weather or not self.weather_updated or (now - self.weather_updated).total_seconds() > 600:
            # 천안시청 기준 좌표
            lat, lon = 36.815, 127.113
            w_data = await fetch_real_weather(lat, lon)
            if w_data:
                self.cached_weather = w_data
                self.weather_updated = now
            else: 
                # 실패시 기본값 (흐림)
                self.cached_weather = {"temperature": 18, "condition": "cloudy", "weather_score": 0}
        
        # 휴일 여부 (하루 한번만 체크해도 됨)
        if not self.initialized_extras:
            self.is_holiday_today = await check_is_holiday()
            self.initialized_extras = True

    def get_hourly_weight(self, hour: int) -> float:
        if not self.patterns or 'hourly' not in self.patterns:
            return 0.5
        return self.patterns['hourly'].get(str(hour), {}).get('weight', 0.5)
    
    def get_daily_weight(self, weekday: int) -> float:
        if not self.patterns or 'daily' not in self.patterns:
            return 0.85
        return self.patterns['daily'].get(str(weekday), {}).get('weight', 0.85)
    
    def get_location_weight(self, dong: str) -> float:
        if not self.patterns or 'by_dong' not in self.patterns:
            return 0.5
        return self.patterns['by_dong'].get(dong, {}).get('weight', 0.3)
    
    def get_fee_weight(self, fee_type: str) -> float:
        return 1.2 if fee_type == '무료' else 0.8
    
    def get_capacity_weight(self, total_spaces: int) -> float:
        return 0.8 if total_spaces >= 100 else 1.1

    def get_weather_weight(self, parking_type: str) -> float:
        """날씨에 따른 주차장 선호도 (실내/실외)"""
        if not self.cached_weather:
            return 1.0
        
        cond = self.cached_weather.get('condition', 'sunny')
        # 비/눈 올 때: 실내(indoor/building) 선호, 노외/노상(outdoor) 비선호
        if cond in ['rainy', 'snowy']:
            # parkingType: '노외', '노상', '부설' 등
            if parking_type and '부설' in parking_type: # 보통 건물 내
                return 1.2
            else:
                return 0.8
        return 1.0 # 맑음

    def get_holiday_weight(self, is_holiday: bool) -> float:
        """휴일 여부"""
        return 1.2 if is_holiday else 0.9

    async def calculate_occupancy(
        self,
        parking_id: str,
        target_time: datetime
    ) -> tuple:
        await self.update_extras()
        
        parking_lot = self.parking_lots.get(parking_id)
        if not parking_lot:
            return 50.0, 60.0, {}
        
        hour = target_time.hour
        weekday = target_time.weekday()
        dong = extract_dong_from_address(parking_lot.get('address', ''))
        fee_type = parking_lot.get('fee', {}).get('type', '무료')
        total_spaces = parking_lot.get('totalSpaces', 50)
        p_type = parking_lot.get('parkingType', '') # 노외/노상/부설
        
        # 가중치 계산
        hourly_w = self.get_hourly_weight(hour)
        daily_w = self.get_daily_weight(weekday)
        location_w = self.get_location_weight(dong)
        fee_w = self.get_fee_weight(fee_type)
        capacity_w = self.get_capacity_weight(total_spaces)
        weather_w = self.get_weather_weight(p_type)
        holiday_w = self.get_holiday_weight(self.is_holiday_today)
        
        # 종합 점수 (0-1)
        weighted_score = (
            hourly_w * self.WEIGHTS['hourly'] +
            daily_w * self.WEIGHTS['daily'] +
            location_w * self.WEIGHTS['location'] +
            fee_w * self.WEIGHTS['fee'] +
            capacity_w * self.WEIGHTS['capacity'] +
            weather_w * self.WEIGHTS['weather'] +
            holiday_w * self.WEIGHTS['holiday']
        )
        
        # 현실적인 점유율 분포를 위한 보정 (기본 15% ~ 최대 95%)
        base_occupancy = 15.0
        occupancy = base_occupancy + (weighted_score * 80)
        
        # 요일/시간대에 따른 추가 무작위성 (신뢰도에 영향 없는 미세 변동)
        import random
        random.seed(parking_id + str(hour)) # 재현 가능한 변동
        occupancy += random.uniform(-5, 5)
        
        occupancy = max(5, min(95, occupancy))
        
        confidence = self._calculate_confidence(dong, hour)
        
        factors = {
            'hourly': round(hourly_w, 3),
            'location': round(location_w, 3),
            'weather': round(weather_w, 3),
            'holiday': round(holiday_w, 3)
        }
        
        return round(occupancy, 1), round(confidence, 1), factors
    
    def _calculate_confidence(self, dong: str, hour: int) -> float:
        base = 75.0
        if not self.patterns: return 60.0
        cnt = self.patterns.get('total_count', 0)
        if cnt >= 50000: base += 10
        if dong and dong in self.patterns.get('by_dong', {}):
            d_cnt = self.patterns['by_dong'][dong].get('count', 0)
            if d_cnt >= 1000: base += 8
        return min(95.0, base)
    
    async def generate_predictions(
        self,
        parking_id: str,
        hours_ahead: int = 24
    ) -> List[Dict]:
        predictions = []
        now = datetime.now()
        for i in range(hours_ahead):
            target_time = now + timedelta(hours=i+1)
            occupancy, confidence, factors = await self.calculate_occupancy(parking_id, target_time)
            
            predictions.append({
                "time": target_time.strftime('%H:00'),
                "occupancy_rate": occupancy,
                "confidence": confidence,
                "factors": factors
            })
        return predictions

_prediction_engine: Optional[PredictionEngine] = None

def get_prediction_engine() -> PredictionEngine:
    global _prediction_engine
    if _prediction_engine is None:
        _prediction_engine = PredictionEngine()
    return _prediction_engine

# ===== API 엔드포인트 =====
@app.get("/parking-lots", response_model=List[ParkingLotOut])
async def get_parking_lots():
    lots = load_parking_lots()
    return [ParkingLotOut(**lot) for lot in lots if lot.get('latitude') and lot.get('longitude')]

@app.get("/parking-lots/{parking_id}", response_model=ParkingLotOut)
async def get_parking_lot(parking_id: str):
    lots = load_parking_lots()
    lot = next((l for l in lots if l["id"] == parking_id), None)
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    return ParkingLotOut(**lot)

@app.post("/predictions", response_model=List[PredictionData])
async def get_predictions(request: PredictionRequest):
    engine = get_prediction_engine()
    # async method 호출
    predictions = await engine.generate_predictions(request.parking_id, request.hours_ahead)
    return [PredictionData(**pred) for pred in predictions]

@app.get("/weather")
async def get_weather():
    # 실제 날씨 또는 캐시된 날씨 반환
    engine = get_prediction_engine()
    await engine.update_extras()
    return engine.cached_weather or {
        "temperature": 18,
        "condition": "cloudy",
        "precipitationProbability": 20
    }

@app.get("/patterns/summary")
async def get_patterns_summary():
    patterns = load_violation_patterns()
    if not patterns: return {"error": "No patterns loaded"}
    return {
        "total_violations": patterns.get('total_count', 0),
        "weights_used": PredictionEngine.WEIGHTS
    }

# Auth / Payments (기존 유지)
@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing: raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    user = User(email=payload.email, name=payload.name, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user_id=user.id, email=user.email, name=user.name)

@app.post("/auth/login", response_model=Token)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="로그인 실패")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user_id=user.id, email=user.email, name=user.name)

@app.on_event("startup")
def on_startup():
    try:
        print(f"Connecting to database: {DATABASE_URL[:20]}...")
        Base.metadata.create_all(bind=engine)
        print("Database connection & migration successful.")
    except Exception as e:
        print(f"Database connection failed during startup: {e}")
        print("The server will continue to run using local data files if available.")
        
    load_parking_lots()
    load_violation_patterns()

@app.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    record = PaymentHistory(
        user_id=payload.user_id, parking_lot_name=payload.parking_lot_name,
        start_time=payload.start_time, end_time=payload.end_time,
        duration=payload.duration, fee=payload.fee
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return PaymentOut(id=record.id, parkingLotName=record.parking_lot_name, startTime=record.start_time, endTime=record.end_time, duration=record.duration, fee=record.fee, date=record.created_at.date().isoformat())

@app.get("/history", response_model=List[PaymentOut])
def get_history(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(PaymentHistory).order_by(PaymentHistory.created_at.desc()).limit(50)
    if user_id: q = q.filter(PaymentHistory.user_id == user_id)
    return [PaymentOut(id=r.id, parkingLotName=r.parking_lot_name, startTime=r.start_time, endTime=r.end_time, duration=r.duration, fee=r.fee, date=r.created_at.date().isoformat()) for r in q.all()]

@app.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def register_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    # 기존 차량 확인
    existing = db.query(Vehicle).filter(Vehicle.user_id == payload.user_id, Vehicle.license_plate == payload.license_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 차량 번호입니다.")
    
    # 대표 차량 설정 로직 (첫 차량이거나 is_primary=True인 경우)
    count = db.query(Vehicle).filter(Vehicle.user_id == payload.user_id).count()
    is_primary_val = 1 if payload.is_primary or count == 0 else 0
    
    if is_primary_val:
        # 기존 대표 차량 해제
        db.query(Vehicle).filter(Vehicle.user_id == payload.user_id).update({"is_primary": 0})
    
    vehicle = Vehicle(
        user_id=payload.user_id,
        license_plate=payload.license_plate,
        model=payload.model,
        color=payload.color,
        is_primary=is_primary_val
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return VehicleOut(id=vehicle.id, license_plate=vehicle.license_plate, model=vehicle.model, color=vehicle.color, is_primary=bool(vehicle.is_primary))

@app.get("/vehicles", response_model=List[VehicleOut])
def get_vehicles(user_id: int, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(Vehicle.user_id == user_id).all()
    return [VehicleOut(id=v.id, license_plate=v.license_plate, model=v.model, color=v.color, is_primary=bool(v.is_primary)) for v in vehicles]

@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, user_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == user_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="차량을 찾을 수 없습니다.")
    db.delete(vehicle)
    db.commit()
    return {"message": "삭제되었습니다."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
