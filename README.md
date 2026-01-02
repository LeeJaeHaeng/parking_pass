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

### 4. 💳 간편 결제 (PortOne 연동)

- **실시간 결제**: 카카오페이, 신용카드 등 다양한 수단으로 주차비를 즉시 결제할 수 있습니다.
- **이용 내역 관리**: 언제 어디서 얼마를 썼는지 히스토리를 한눈에 볼 수 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend

- **Framework**: React (Vite 6)
- **Deployment**: Firebase Hosting
- **PWA**: `vite-plugin-pwa`
- **UI Library**: Shadcn/ui + TailwindCSS (v4)
- **Data Visualization**: Recharts

### Backend & AI

- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (SQLAlchemy ORM)
- **Tunneling**: Localtunnel (HTTPS 보안 통신 환경 구축)

---

## 🚀 설치 및 실행 방법 (Getting Started)

### 1. 서비스 접속

- **직접 접속**: [https://cheonan-parking-ai.web.app](https://cheonan-parking-ai.web.app)
- **앱 설치**: 스마트폰 브라우저 메뉴에서 **'홈 화면에 추가'**를 선택하세요.

### 2. 개발 환경 설정

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 5174

# Frontend
npm install
npm run dev
```

---

## ✅ 최신 업데이트 내역 (2026.01)

- **[PWA]** 전용 아이콘 적용 및 오프라인 서비스 워커 구축 완료.
- **[Deployment]** Firebase Hosting을 통한 실서비스 배포 성공.
- **[AI Engine]** 기본 점유율(15%) 상향 및 가중치 반영 비율 최적화로 예측 다양성 확보.
- **[Mobile]** HTTP/HTTPS Mixed Content 문제를 해결하기 위한 Localtunnel 보안 헤더 패치 완료.
- **[UI/UX]** 천안시 공식 로고 적용 및 위치 권한 안내 가이드 UI 세분화.

---

## 📝 라이선스

This project is licensed under the MIT License.

---

**Cheonan AI Parking Pass Team** - 천안시 주차 문제, AI로 시원하게 뚫어드립니다! 💨
