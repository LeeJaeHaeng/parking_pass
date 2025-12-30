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
uvicorn main:app --reload --port 5174
```

- 서버 주소: `http://localhost:5174`
- API 문서: `http://localhost:5174/docs`

### 2. Frontend 실행

Node.js 패키지를 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

- 접속 주소: `http://localhost:5173`

---

## 📱 모바일 디바이스 테스트 (Mobile Testing)

PC와 동일한 와이파이(Network)에 연결된 스마트폰에서 테스트하려면 추가 설정이 필요합니다.

### 1. Backend 실행 설정

외부 접속을 허용하기 위해 `--host 0.0.0.0`과 `--port 5174` 옵션을 추가하여 실행합니다.

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5174
```

### 2. Frontend 환경 설정 (.env.local)

`.env.local` 파일의 API 주소를 `localhost` 대신 PC의 내부 IP 주소로 변경해야 합니다.

```properties
VITE_API_BASE_URL=http://192.168.0.x:5174
```

### 3. Kakao Map 도메인 등록

[카카오 개발자 센터](https://developers.kakao.com/) > 플랫폼 > Web > 사이트 도메인에 아래 주소들을 등록해야 지도가 정상 작동합니다.

- `http://192.168.0.x:5173` (Frontend)
- `http://192.168.0.x:5174` (Backend)

---

## ✅ 최근 업데이트 내역 (Recent Updates)

- **카카오 맵 최적화**: 429 에러(Too Many Requests) 해결을 위한 주소 변환 API 호출 제한(디바운싱) 및 지도 인스턴스 재사용 로직 적용.
- **네트워크 안정성**: 모바일 환경을 고려하여 API 타임아웃 시간을 15초로 연장 및 데이터 로드 실패 시 기존 UI 유지 로직 추가.
- **UX 개선**: 페이지 전환 시 화면 상단으로 자동 스크롤되는 기능 추가.
- **서버 설정**: 기본 포트를 8000에서 5174로 변경하여 포트 충돌 및 연결 이슈 우회.

---

## 📝 라이선스

This project is licensed under the MIT License.

---

**Cheonan AI Parking Pass Team** - 천안시 주차 문제, AI로 시원하게 뚫어드립니다! 💨
