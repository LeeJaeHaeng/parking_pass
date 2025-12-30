#!/usr/bin/env python3
"""
불법주정차 단속 데이터 분석 및 패턴 추출 스크립트
"""
import csv
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# 프로젝트 루트 경로
PROJECT_ROOT = Path(__file__).resolve().parent.parent
# 파일명에 공백이 포함되어 있음
CSV_FILE = PROJECT_ROOT / "충청남도 천안시_불법주정차단속현황_20241231.csv"
OUTPUT_JSON = PROJECT_ROOT / "backend" / "violation_patterns.json"


def safe_parse_time(time_str: str) -> int:
    """시간 문자열에서 시간(hour) 추출"""
    try:
        if ':' in time_str:
            return int(time_str.split(':')[0])
        elif len(time_str) >= 2:
            return int(time_str[:2])
        return -1
    except (ValueError, IndexError):
        return -1


def safe_parse_date(date_str: str) -> tuple:
    """날짜 문자열에서 (year, month, weekday) 추출"""
    try:
        # 형식: 2024-07-25
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return dt.year, dt.month, dt.weekday()  # 0=월요일, 6=일요일
    except (ValueError, TypeError):
        return None, None, None


def extract_dong(location: str) -> str:
    """주소에서 동(洞) 이름 추출"""
    if not location:
        return "기타"
    
    # 동 이름 추출 (예: "구성동 460-6" → "구성동")
    parts = location.strip().split()
    if parts:
        first_part = parts[0]
        # "동"으로 끝나는지 확인
        if first_part.endswith('동'):
            return first_part
        # 주소에서 "~동" 패턴 찾기
        for part in parts:
            if part.endswith('동') and len(part) >= 2:
                return part
    return "기타"


def analyze_violations() -> Dict[str, Any]:
    """불법주정차 단속 데이터 분석"""
    
    patterns = {
        'hourly': defaultdict(int),      # 시간대별 (0-23시)
        'daily': defaultdict(int),       # 요일별 (0-6, 월-일)
        'monthly': defaultdict(int),     # 월별 (1-12)
        'by_dong': defaultdict(int),     # 동별 단속 건수
        'dong_hourly': defaultdict(lambda: defaultdict(int)),  # 동+시간대
        'dong_daily': defaultdict(lambda: defaultdict(int)),   # 동+요일
        'total_count': 0,
        'date_range': {'start': None, 'end': None}
    }
    
    if not CSV_FILE.exists():
        print(f"❌ CSV 파일을 찾을 수 없습니다: {CSV_FILE}")
        return patterns
    
    # 인코딩 시도 (CP949 또는 UTF-8)
    encodings = ['cp949', 'utf-8', 'euc-kr']
    
    for encoding in encodings:
        try:
            with open(CSV_FILE, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                dates = []
                
                for row in reader:
                    patterns['total_count'] += 1
                    
                    # 날짜 분석
                    date_str = row.get('단속일자', '')
                    year, month, weekday = safe_parse_date(date_str)
                    if weekday is not None:
                        patterns['daily'][weekday] += 1
                    if month is not None:
                        patterns['monthly'][month] += 1
                    if date_str:
                        dates.append(date_str)
                    
                    # 시간 분석
                    time_str = row.get('단속시간', '')
                    hour = safe_parse_time(time_str)
                    if 0 <= hour <= 23:
                        patterns['hourly'][hour] += 1
                    
                    # 동 분석
                    dong = row.get('단속동', '').strip()
                    if not dong:
                        location = row.get('단속장소', '')
                        dong = extract_dong(location)
                    
                    if dong:
                        patterns['by_dong'][dong] += 1
                        if 0 <= hour <= 23:
                            patterns['dong_hourly'][dong][hour] += 1
                        if weekday is not None:
                            patterns['dong_daily'][dong][weekday] += 1
                
                # 날짜 범위
                if dates:
                    patterns['date_range']['start'] = min(dates)
                    patterns['date_range']['end'] = max(dates)
                
                print(f"✅ 인코딩 '{encoding}'으로 성공적으로 읽었습니다.")
                break
                
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"⚠️ 인코딩 '{encoding}' 실패: {e}")
            continue
    
    return patterns


def normalize_patterns(patterns: Dict) -> Dict[str, Any]:
    """패턴을 정규화하여 가중치로 변환"""
    total = patterns['total_count']
    if total == 0:
        return patterns
    
    result = {
        'total_count': total,
        'date_range': patterns['date_range'],
        'hourly': {},
        'daily': {},
        'monthly': {},
        'by_dong': {},
        'dong_hourly': {},
        'dong_daily': {},
        'weights': {}
    }
    
    # 시간대별 정규화 (0-23시)
    hourly_max = max(patterns['hourly'].values()) if patterns['hourly'] else 1
    for hour in range(24):
        count = patterns['hourly'].get(hour, 0)
        result['hourly'][str(hour)] = {
            'count': count,
            'weight': round(count / hourly_max, 3) if hourly_max > 0 else 0
        }
    
    # 요일별 정규화 (0=월~6=일)
    day_names = ['월', '화', '수', '목', '금', '토', '일']
    daily_max = max(patterns['daily'].values()) if patterns['daily'] else 1
    for day in range(7):
        count = patterns['daily'].get(day, 0)
        result['daily'][str(day)] = {
            'name': day_names[day],
            'count': count,
            'weight': round(count / daily_max, 3) if daily_max > 0 else 0
        }
    
    # 월별 정규화
    monthly_max = max(patterns['monthly'].values()) if patterns['monthly'] else 1
    for month in range(1, 13):
        count = patterns['monthly'].get(month, 0)
        result['monthly'][str(month)] = {
            'count': count,
            'weight': round(count / monthly_max, 3) if monthly_max > 0 else 0
        }
    
    # 동별 정규화 (상위 30개)
    sorted_dongs = sorted(patterns['by_dong'].items(), key=lambda x: x[1], reverse=True)[:30]
    dong_max = sorted_dongs[0][1] if sorted_dongs else 1
    for dong, count in sorted_dongs:
        result['by_dong'][dong] = {
            'count': count,
            'weight': round(count / dong_max, 3),
            'hourly': dict(patterns['dong_hourly'].get(dong, {})),
            'daily': dict(patterns['dong_daily'].get(dong, {}))
        }
    
    # 종합 가중치 계산 (예측에 사용)
    # 피크 시간대 식별
    peak_hours = sorted(patterns['hourly'].items(), key=lambda x: x[1], reverse=True)[:5]
    result['weights'] = {
        'peak_hours': [h for h, _ in peak_hours],
        'busiest_days': sorted(patterns['daily'].items(), key=lambda x: x[1], reverse=True)[:3],
        'top_dongs': [d for d, _ in sorted_dongs[:10]]
    }
    
    return result


def main():
    """메인 실행 함수"""
    print("🚨 불법주정차 단속 데이터 분석 시작...")
    print(f"   입력: {CSV_FILE}")
    print(f"   출력: {OUTPUT_JSON}")
    
    patterns = analyze_violations()
    
    if patterns['total_count'] == 0:
        print("❌ 분석된 데이터가 없습니다!")
        return
    
    normalized = normalize_patterns(patterns)
    
    # JSON 파일 저장
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 완료! 총 {normalized['total_count']:,}건 분석됨")
    print(f"   기간: {normalized['date_range']['start']} ~ {normalized['date_range']['end']}")
    
    # 통계 출력
    print(f"\n📊 분석 결과:")
    
    print("\n⏰ 피크 시간대 (상위 5개):")
    for hour in normalized['weights']['peak_hours']:
        data = normalized['hourly'][str(hour)]
        print(f"   - {hour}시: {data['count']:,}건 (가중치: {data['weight']})")
    
    print("\n📅 바쁜 요일 (상위 3개):")
    for day, count in normalized['weights']['busiest_days']:
        day_name = normalized['daily'][str(day)]['name']
        print(f"   - {day_name}요일: {count:,}건")
    
    print("\n📍 단속 핫스팟 (상위 10개):")
    for dong in normalized['weights']['top_dongs']:
        data = normalized['by_dong'][dong]
        print(f"   - {dong}: {data['count']:,}건 (가중치: {data['weight']})")


if __name__ == "__main__":
    main()
