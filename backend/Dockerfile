# Python 3.10 slim 이미지를 베이스로 사용
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치 (psycopg2 빌드용)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 상위 폴더의 데이터 파일(parkingLots.json)을 위한 더미 디렉토리 구조 생성 가능성 대비
# main.py에서 PROJECT_ROOT를 Path(__file__).resolve().parent.parent로 잡으므로 
# 도커 내부 구조도 맞춰줄 필요가 있음. 하지만 보통은 설정으로 해결.
# 여기서는 필요한 데이터 파일을 backend 폴더 내부로 복사해오거나 main.py를 수정하는 것이 깔끔함.

# Cloud Run은 8080 포트를 기본으로 요구함
ENV PORT 8080
EXPOSE 8080

# 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
