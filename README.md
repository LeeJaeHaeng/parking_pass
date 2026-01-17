# 천안 AI 파킹 패스 (Cheonan AI Parking Pass) 🚗☁️

**천안시 주차 문제 해결을 위한 AI 기반 스마트 주차 통합 플랫폼**

천안 AI 파킹 패스는 운전자들에게 실시간 주차 가능 여부를 AI로 예측하여 제공하고, 결제부터 내역 관리까지 한 번에 해결해주는 원스톱 주차 서비스입니다.

### 🌐 실서비스 주소

**[https://cheonan-parking-ai.web.app](https://cheonan-parking-ai.web.app)**

---

## 🌟 주요 기능 (Key Features)

### 1. 🔮 AI 주차 혼잡도 예측

- **날씨 & 휴일 연동**: 기상청 API와 공휴일 정보를 실시간으로 반영하여 예측 정확도를 높입니다.
- **실전 데이터 학습**: 천안시 불법 주정차 단속 현황(2024.12 기준) 및 주차장 정보를 분석하여 현실적인 혼잡도를 산출합니다.
- **모바일 최적화**: 저사양 기기에서도 부드러운 그래프 애니메이션과 빠른 데이터 로딩을 제공합니다.

### 2. 📱 스마트 PWA (설치 가능한 앱)

- **앱 설치 지원**: 브라우저 주소창 없이 홈 화면에서 바로 실행되는 독립 앱(Progressive Web App) 환경을 제공합니다.
- **오프라인 지원**: 주요 정적 리소스를 캐싱하여 불안정한 네트워크 환경에서도 안정적으로 실행됩니다.
- **전용 아이콘**: 현대적인 디자인의 앱 전용 아이콘이 적용되었습니다.

### 3. 🗺️ 실시간 지도 & 검색

- **카카오맵 연동**: 천안시 내 모든 공영/민영 주차장 위치를 지도 위에 표시합니다.
- **스마트 필터**: 무료/유료, 공영/민영, 거리순 등 원하는 조건으로 주차장을 빠르게 찾을 수 있습니다.
- **핫스팟 시각화**: 주차 혼잡도를 히트맵으로 표시하여 한눈에 파악할 수 있습니다.

### 4. 💳 간편 결제 (PortOne 연동)

- **실시간 결제**: 카카오페이, 신용카드 등 다양한 수단으로 주차비를 즉시 결제할 수 있습니다.
- **쿠폰 시스템**: 할인 쿠폰을 적용하여 주차 요금을 절감할 수 있습니다.
- **이용 내역 관리**: 언제 어디서 얼마를 썼는지 히스토리를 한눈에 볼 수 있습니다.

### 5. 👤 마이페이지 (실서비스 수준)

- **프로필 관리**: 이름, 이메일, 전화번호 수정
- **차량 관리**: 차량 추가/삭제/대표 차량 설정
- **결제수단 관리**: 카드 추가/삭제/기본 카드 설정
- **쿠폰함**: 보유 쿠폰 조회 및 사용
- **공지사항 & FAQ**: 서비스 안내 및 자주 묻는 질문
- **알림 설정**: 마케팅, 주차 현황 알림 on/off

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Deployment**: Firebase Hosting
- **PWA**: `vite-plugin-pwa`
- **UI Library**: Shadcn/ui + TailwindCSS v4
- **Data Visualization**: Recharts
- **Map**: Kakao Map API
- **Payment**: PortOne (Iamport)

### Backend & AI

- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (SQLAlchemy ORM)
- **AI Engine**: Custom prediction algorithm (weather, holiday, historical data)
- **External APIs**:
  - 기상청 단기예보 API
  - 한국천문연구원 공휴일 API

---

## 🚀 설치 및 실행 방법 (Getting Started)

### 1. 서비스 접속

- **직접 접속**: [https://cheonan-parking-ai.web.app](https://cheonan-parking-ai.web.app)
- **앱 설치**: 스마트폰 브라우저 메뉴에서 **'홈 화면에 추가'**를 선택하세요.

### 2. 개발 환경 설정

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
npm install
npm run dev
```

#### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_KAKAO_JS_KEY=your_kakao_javascript_key
VITE_KAKAO_REST_KEY=your_kakao_rest_api_key
VITE_WEATHER_API_KEY=your_weather_api_key
```

---

## ✅ 최신 업데이트 내역 (2026.01)

### UI/UX 개선

- **[Premium Design]** 전체 앱 프리미엄 디자인 통일 (glass-card, premium-gradient 적용)
- **[Logo]** 홈화면 로고 이미지 적용 (보라색 동그라미 → 실제 로고)
- **[한글화]** 모든 페이지 한글화 완료 ("CURRENT DURATION" → "현재 주차 시간" 등)

### 마이페이지 고도화

- **[Profile]** 프로필 수정 기능 (이름/이메일/전화번호)
- **[Vehicle]** 차량 관리 CRUD (추가/삭제/대표 설정)
- **[Payment]** 결제수단 관리 CRUD (추가/삭제/기본 설정)
- **[Coupon]** 쿠폰 시스템 및 결제 페이지 연동
- **[Notice]** 공지사항, FAQ, 알림 설정 기능 추가

### 기능 개선

- **[PWA]** 전용 아이콘 적용 및 오프라인 서비스 워커 구축 완료
- **[Deployment]** Firebase Hosting을 통한 실서비스 배포 성공
- **[AI Engine]** 기본 점유율(15%) 상향 및 가중치 반영 비율 최적화로 예측 다양성 확보
- **[Mobile]** HTTP/HTTPS Mixed Content 문제 해결 (Localtunnel 보안 헤더 패치)
- **[Data]** 천안시 주차장 데이터 105개 전면 재처리 및 동기화 완료

### 버그 수정

- **[Map]** 카카오맵 Sheet 내 높이 계산 오류 수정
- **[UI]** 차량 관리 UI 동적 로직 연동 완료
- **[Payment]** 쿠폰 할인 계산 로직 정확도 개선

---

## 📁 프로젝트 구조

```
Cheonan_AI_Parking_Pass/
├── backend/                 # FastAPI 백엔드
│   ├── main.py             # API 엔드포인트
│   ├── models.py           # 데이터베이스 모델
│   └── dev.db              # SQLite 데이터베이스
├── src/
│   ├── app/
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── data/           # Mock 데이터
│   │   └── api.ts          # API 클라이언트
│   └── styles/             # 스타일 파일
├── public/                 # 정적 파일
│   └── logo.jpg           # 앱 로고
└── README.md              # 프로젝트 문서
```

---

## 📝 라이선스

This project is licensed under the MIT License.

---

## 🙏 감사의 말

- **천안시청**: 주차장 정보 및 불법 주정차 단속 현황 데이터 제공
- **기상청**: 단기예보 API 제공
- **한국천문연구원**: 공휴일 정보 API 제공
- **Kakao**: 카카오맵 API 제공

---

**Cheonan AI Parking Pass Team** - 천안시 주차 문제, AI로 시원하게 뚫어드립니다! 💨
