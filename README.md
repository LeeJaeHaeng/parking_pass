# Cheonan AI Parking Pass (MVP)

프런트(React/Vite)와 백엔드(FastAPI)로 구성된 천안 AI 파킹 패스 데모입니다. 공공 주차장 CSV를 기반으로 목록/상세/지도/예측 UI를 제공하고, 백엔드는 회원가입/로그인과 예측/날씨/주차장 엔드포인트를 포함합니다.

## 구성
- 프런트: `npm run dev` (Vite), 카카오 지도 SDK 연동, 모의 데이터 + REST 연동.
- 백엔드: FastAPI, SQLite(기본) 또는 Postgres, JWT 인증, 회원가입/로그인, 예측/날씨/주차장 API.
- 데이터: `src/app/data/parkingLots.json`(천안 주차장 CSV 변환), `violationSummary.json`(불법주정차 요약).

## 환경 변수
- `.env.local` (루트) 예시
  - `VITE_API_BASE_URL=http://localhost:8000`
  - `VITE_KAKAO_JS_KEY=<카카오 JS 키>` (콘솔에 등록된 JS 키 1개)
  - `DATABASE_URL=sqlite:///./dev.db`
  - `JWT_SECRET=<랜덤 문자열>`
  - 기타: `VITE_KAKAO_REST_API_KEY`, `VITE_KMA_API_KEY`, `VITE_SBDC_API_KEY`, `VITE_HOLIDAY_API_KEY`
- 백엔드: `DATABASE_URL`, `JWT_SECRET`는 `.env.local` 또는 OS 환경변수로 자동 로드됩니다.

## 실행
1) 백엔드
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
2) 프런트
```bash
npm install    # 최초 1회
npm run dev -- --host --clearScreen false
```
접속: `http://localhost:5173`

## 카카오 지도 설정
1) 카카오 개발자 콘솔 → 내 애플리케이션 → 웹 플랫폼에 도메인 등록  
   - `http://localhost:5173`, `http://127.0.0.1:5173` (내부 IP 사용 시 해당 IP도 등록)
2) 지도/로컬(OPEN_MAP_AND_LOCAL) 서비스 활성화.
3) `.env.local`의 `VITE_KAKAO_JS_KEY`에 등록된 JS 키를 설정 후 프런트 재시작.

## 주요 엔드포인트(백엔드)
- `POST /auth/register` : 이메일/비밀번호/이름 → JWT 반환
- `POST /auth/login` : 이메일/비밀번호 → JWT 반환
- `GET /parking-lots` / `GET /parking-lots/{id}`
- `POST /predictions`
- `GET /weather`

## 상태/남은 작업
- 회원가입/로그인: 비밀번호 해시 알고리즘을 `pbkdf2_sha256`로 변경(의존성 이슈 회피).
- 지도: Kakao JS SDK 키/도메인 등록 필요. 서비스 비활성화 시 오류 발생.
- 데이터: 주차장 CSV 기반으로 거리/예측 모의 데이터 생성; 실시간 가용/예측 API 연동 시 `api.ts` 정규화만 맞추면 교체 가능.
