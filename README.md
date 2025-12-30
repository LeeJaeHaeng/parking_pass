# 천안 AI 파킹 패스 (Cheonan AI Parking Pass) 🚗☁️

**천안시 주차 문제 해결을 위한 AI 기반 스마트 주차 통합 플랫폼**

천안 AI 파킹 패스는 운전자들에게 실시간 주차 가능 여부를 AI로 예측하여 제공하고, 결제부터 내역 관리까지 한 번에 해결해주는 원스톱 주차 서비스입니다.

![App Screenshot](public\logo192.png)
_(스크린샷 이미지가 있다면 여기에 추가)_

## 🌟 주요 기능 (Key Features)

### 1. 🔮 AI 주차 혼잡도 예측

- **날씨 & 휴일 연동**: 기상청 API와 공휴일 정보를 실시간으로 반영하여 예측 정확도를 높입니다.
- **패턴 분석**: 시간대별, 요일별, 행정동별 불법 주정차 및 주차 패턴 데이터를 학습하여 혼잡도를 산출합니다.
- **직관적 UI**: '여유', '보통', '혼잡' 상태를 색상과 수치(%)로 시각화하여 제공합니다.

### 2. 🗺️ 실시간 지도 & 검색

- **카카오맵 연동**: 천안시 내 모든 공영/민영 주차장 위치를 지도 위에 표시합니다.
- **스마트 필터**: 무료/유료, 공영/민영, 거리순 등 원하는 조건으로 주차장을 빠르게 찾을 수 있습니다.

### 3. 💳 간편 결제 (PortOne 연동)

- **실시간 결제**: 카카오페이, 신용카드 등 다양한 수단으로 주차비를 즉시 결제할 수 있습니다.
- **이용 내역 관리**: 언제 어디서 얼마를 썼는지 히스토리를 한눈에 볼 수 있습니다.

### 4. 👤 스마트 마이페이지

- **차량 관리**: 내 차량 정보를 등록하고 관리할 수 있습니다.
- **알림 설정**: 주차 만료 알림, 마케팅 알림 등을 설정할 수 있습니다.
- **환경 설정**: 앱 버전 확인 및 캐시 삭제 기능을 제공합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend

- **Framework**: React (Vite)
- **Language**: TypeScript
- **UI Library**: Shadcn/ui + TailwindCSS
- **Icons**: Lucide React
- **Map**: Kakao Maps SDK

### Backend & AI

- **Framework**: FastAPI (Python)
- **Database**: SQLite (SQLAlchemy ORM)
- **AI/Logic**: 가중치 기반 예측 엔진 (Weather, Holiday, Violation Patterns)
  - `violation_analyzer.py`: 불법 주정차 데이터 분석
  - `main.py`: REST API 및 비즈니스 로직

### External APIs

- **Weather**: 기상청 단기예보 조회 서비스
- **Holiday**: 한국천문연구원 특일 정보
- **Payment**: PortOne (Iamport)

---

## 🗄️ 데이터베이스 구조 (Database Schema)

현재 **SQLite**를 사용하여 효율적이고 가벼운 구조를 채택하고 있습니다.

### 1. Users (사용자)

가입된 사용자 정보를 관리합니다.

- `id` (PK), `email`, `name`, `password_hash`, `created_at`

### 2. PaymentHistory (결제 내역)

사용자의 주차장 이용 및 결제 기록을 저장합니다.

- `id` (PK), `user_id`, `parking_lot_name`, `fee`, `start_time`, `end_time`

### 3. Vehicles (차량 정보) **[NEW]**

사용자의 등록된 차량 정보를 관리합니다.

- `id` (PK), `user_id`, `license_plate` (차량번호), `model`, `is_primary` (대표차량 여부)

---

## 🚀 설치 및 실행 방법 (Getting Started)

### 1. Backend 실행

Python 가상 환경 설정 후 의존성을 설치하고 서버를 실행합니다.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

- 서버 주소: `http://localhost:8000`
- API 문서: `http://localhost:8000/docs`

### 2. Frontend 실행

Node.js 패키지를 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

- 접속 주소: `http://localhost:5173`

---

## 📝 라이선스

This project is licensed under the MIT License.

---

**Cheonan AI Parking Pass Team** - 천안시 주차 문제, AI로 시원하게 뚫어드립니다! 💨
