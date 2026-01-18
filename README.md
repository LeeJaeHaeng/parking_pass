# 천안시 AI 파킹패스 (Cheonan AI Parking Pass) 🚗☁️

**천안시 주차 문제 해결을 위한 AI 기반 스마트 주차 통합 플랫폼**

천안시 AI 파킹패스는 운전자들에게 실시간 주차 가능 여부를 AI로 예측하여 제공하고, 결제부터 내역 관리까지 한 번에 해결해주는 원스톱 주차 서비스입니다.

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

## 🚀 배포 정보

- **Frontend (Firebase Hosting)**: [https://cheonan-parking-ai.web.app](https://cheonan-parking-ai.web.app)
- **Backend (Render)**: [Render Dashboard](https://dashboard.render.com/web/srv-d5bnijer433s73934130)
- **Database (Supabase)**: [Supabase Dashboard](https://supabase.com/dashboard/project/vjjgnlkzyuadynfrwajl)

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

## 🔍 데이터 기반 분석 로직 (상세)

### 1) 데이터 소스
- **주차장 기본 데이터**: 공공 데이터 CSV를 전처리하여 `parkingLots.json` 생성
- **불법주정차 패턴 데이터**: 단속 CSV 분석으로 시간/요일/동(지역) 가중치 추출
- **실시간/동적 보정 요소**: 날씨(기온/강수/하늘 상태), 공휴일 여부

### 2) 주차장 데이터 정규화 (프론트/백엔드 공통 정책)
- **좌표 및 기본 필드 정리**: 위경도, 주소, 운영시간, 요금 구조 통일
- **가용 공간 폴백**: 실시간 데이터가 없으면 `총 주차면 * 0.35` 기준으로 가용 공간 추정
- **거리 계산**: 기준 좌표(천안시청 인근) 또는 사용자 위치 기준으로 Haversine 거리 계산

### 3) 혼잡도 예측 엔진 (백엔드)
- **가중치 구성**
  - 시간대(hourly), 요일(daily), 지역(dong), 요금(fee), 수용(capacity), 날씨(weather), 공휴일(holiday), 핫스팟 근접도(proximity)
- **기본 점유율 + 가중치 보정**
  - 기본 점유율(15%)에서 시작해 가중치를 합산하여 5%~95%로 클램핑
- **실시간 변동성**
  - 시간 기반 seed를 사용한 랜덤 워크로 실시간 변동 시뮬레이션

### 4) 예측 데이터 생성 흐름
1. 주차장 ID 기준 데이터 로딩
2. 현재 시각/요일/동(주소 파싱) 추출
3. 날씨/공휴일 캐시 업데이트
4. 가중치 합산 → 점유율/신뢰도 계산
5. 시간대별(최대 24시간) 예측 시계열 생성

### 5) 프론트 폴백 예측 로직
- **백엔드 실패 시** 클라이언트에서 시간대 패턴 + 요일 + 날씨 조건을 반영한 폴백 생성
- **신뢰도**는 가까운 시간일수록 높게 설정

### 6) AI 추천 점수 (프론트)
- **거리(50%) + 가격(20%) + 가용률(30%)** 가중치 기반 추천 점수 계산
- 이 가중치는 `config.ts`에서 중앙 관리 가능

### 7) 혼잡도 상태 기준 (UI 공통)
- **여유**: 가용률 30% 초과
- **보통**: 10% 초과 ~ 30% 이하
- **혼잡**: 10% 이하

### 8) 로직 추적 (핵심 파일/함수)
- **예측 엔진 (백엔드)**: `backend/main.py` → `PredictionEngine.generate_predictions`, `PredictionEngine.calculate_occupancy`
- **패턴 추출(불법주정차)**: `backend/violation_analyzer.py` → `analyze_violations`, `normalize_patterns`
- **주차장 데이터 전처리**: `backend/csv_parser.py` → `run` (CSV → `src/app/data/parkingLots.json`)
- **프론트 예측 폴백**: `src/app/data/mockData.ts` → `generatePredictionData`
- **주차장 정규화/거리 계산**: `src/app/utils/parking.ts` → `normalizeParkingLot`, `calcDistanceKm`
- **추천 점수 계산**: `src/app/pages/HomePage.tsx` → `ai_score` 계산 블록
- **환경/가중치 설정**: `src/app/config.ts` → `recommendationWeights`

### 9) 분석/추천 파라미터 요약

| 영역 | 파라미터 | 값 | 설명 |
| --- | --- | --- | --- |
| 예측(백엔드) | `WEIGHTS.hourly` | 0.25 | 시간대 가중치 |
| 예측(백엔드) | `WEIGHTS.daily` | 0.10 | 요일 가중치 |
| 예측(백엔드) | `WEIGHTS.location` | 0.15 | 지역(동) 가중치 |
| 예측(백엔드) | `WEIGHTS.proximity` | 0.15 | 핫스팟 근접 가중치 |
| 예측(백엔드) | `WEIGHTS.fee` | 0.10 | 요금 가중치 |
| 예측(백엔드) | `WEIGHTS.capacity` | 0.10 | 수용량 가중치 |
| 예측(백엔드) | `WEIGHTS.weather` | 0.10 | 날씨 가중치 |
| 예측(백엔드) | `WEIGHTS.holiday` | 0.05 | 휴일 가중치 |
| 추천(프론트) | `recommendationWeights.distance` | 0.5 | 거리 점수 비중 |
| 추천(프론트) | `recommendationWeights.price` | 0.2 | 가격 점수 비중 |
| 추천(프론트) | `recommendationWeights.availability` | 0.3 | 가용률 점수 비중 |
| UI 기준 | 가용률 `> 30%` | 여유 | 혼잡도 상태 |
| UI 기준 | 가용률 `> 10%` | 보통 | 혼잡도 상태 |
| UI 기준 | 가용률 `<= 10%` | 혼잡 | 혼잡도 상태 |

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

