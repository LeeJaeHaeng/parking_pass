import csv
import json
import os
from pathlib import Path

# 프로젝트 루트 경로 (backend 폴더의 상위)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_FILE = PROJECT_ROOT / "충청남도_천안시_주차장정보_20251128.csv"
JSON_FILE = PROJECT_ROOT / "src" / "app" / "data" / "parkingLots.json"

def clean_str(s):
    """문자열 공백 제거 및 None 처리"""
    if not s:
        return ""
    return s.strip()

def clean_int(s):
    """숫자 변환 (실패 시 0)"""
    if not s:
        return 0
    try:
        return int(float(s)) # "12.0" 같은 경우 처리
    except ValueError:
        return 0

def clean_float(s):
    try:
        return float(s)
    except ValueError:
        return 0.0

def format_time(time_str):
    """HHMM -> HH:MM 형식 변환"""
    # 09:00 형태로 이미 되어있는지 확인
    if ":" in time_str:
        return time_str
    
    # 900 -> 09:00, 1800 -> 18:00
    if not time_str or not time_str.isdigit():
        return ""
    
    time_str = time_str.zfill(4) # 900 -> 0900
    return f"{time_str[:2]}:{time_str[2:]}"

def parse_facilities(row):
    """편의시설 및 특이사항 분석"""
    facilities = []
    
    # 장애인 주차
    if row.get('장애인전용주차구역보유여부') == 'Y':
        facilities.append("장애인 주차")
    
    # 특기사항 분석
    desc = row.get('특기사항', '')
    if '전기차' in desc or '충전' in desc:
        facilities.append("전기차 충전")
    if '경차' in desc:
        facilities.append("경차 전용")
    if '임산부' in desc:
        facilities.append("임산부 전용")
    if '화장실' in desc:
        facilities.append("화장실")
    if '엘리베이터' in desc or '승강기' in desc:
        facilities.append("엘리베이터")
        
    return facilities

def parse_operating_hours(row):
    """운영시간 상세 포맷팅"""
    weekday_start = format_time(row.get('평일운영시작시각', ''))
    weekday_end = format_time(row.get('평일운영종료시각', ''))
    sat_start = format_time(row.get('토요일운영시작시각', ''))
    sat_end = format_time(row.get('토요일운영종료시각', ''))
    hol_start = format_time(row.get('공휴일운영시작시각', ''))
    hol_end = format_time(row.get('공휴일운영종료시각', ''))
    
    hours = []
    if weekday_start and weekday_end:
        hours.append(f"평일 {weekday_start}~{weekday_end}")
    
    if sat_start and sat_end:
        hours.append(f"토요일 {sat_start}~{sat_end}")
    else:
        hours.append("토요일 휴무/정보없음")
        
    if hol_start and hol_end:
        hours.append(f"공휴일 {hol_start}~{hol_end}")
    else:
        hours.append("공휴일 휴무/정보없음")
        
    return " / ".join(hours)

def run():
    print("🚗 천안시 주차장 CSV 파싱 시작...")
    
    parking_lots = []
    
    # 인코딩 시도
    encodings = ['cp949', 'utf-8', 'euc-kr']
    
    for encoding in encodings:
        try:
            with open(CSV_FILE, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    # 필수 데이터 확인
                    name = clean_str(row.get('주차장명'))
                    lat = clean_float(row.get('위도'))
                    lon = clean_float(row.get('경도'))
                    
                    if not name or lat == 0 or lon == 0:
                        continue
                    
                    # 요금 정보 파싱
                    fee_basic = clean_int(row.get('주차기본요금'))
                    fee_add = clean_int(row.get('추가단위요금'))
                    fee_daily = clean_int(row.get('1일주차권요금'))
                    fee_monthly = clean_int(row.get('월정기권요금'))
                    payment_methods = clean_str(row.get('결제방법'))
                    
                    # 주차장 타입
                    p_type_raw = row.get('주차장구분', '') # 공영/민영
                    p_type = 'public' if '공영' in p_type_raw else 'private'
                    
                    parking_type_detail = row.get('주차장유형', '') # 노외/노상/부설
                    
                    # ID 생성 (P + 관리번호 뒷자리 활용하거나 순차 번호)
                    raw_id = row.get('주차장관리번호', '')
                    lot_id = f"P{raw_id.replace('-', '')}" if raw_id else f"P{len(parking_lots)+1000}"
                    
                    facilities = parse_facilities(row)
                    
                    lot = {
                        "id": lot_id,
                        "name": name,
                        "type": p_type,
                        "parkingType": parking_type_detail,
                        "address": clean_str(row.get('소재지도로명주소')) or clean_str(row.get('소재지지번주소')),
                        "totalSpaces": clean_int(row.get('주차구획수')),
                        "availableSpaces": None, # 실시간 정보 없으므로 null (프론트/백엔드에서 예측값 사용)
                        "operatingHours": parse_operating_hours(row),
                        "fee": {
                            "type": clean_str(row.get('요금정보')), # 유료/무료
                            "basic": fee_basic,
                            "basicTime": clean_int(row.get('주차기본시간')),
                            "additional": fee_add,
                            "additionalTime": clean_int(row.get('추가단위시간')),
                            "daily": fee_daily,
                            "monthly": fee_monthly
                        },
                        "feeInfo": clean_str(row.get('특기사항')), # 특기사항을 요금/기타 정보로 활용
                        "paymentMethods": payment_methods,
                        "latitude": lat,
                        "longitude": lon,
                        "hasDisabledParking": row.get('장애인전용주차구역보유여부') == 'Y',
                        "facilities": facilities,
                        "managingOrg": clean_str(row.get('관리기관명')),
                        "phone": clean_str(row.get('전화번호')),
                        "dataDate": clean_str(row.get('데이터기준일자'))
                    }
                    parking_lots.append(lot)
                
                print(f"✅ 인코딩 '{encoding}'으로 성공! {len(parking_lots)}개 데이터 파싱됨.")
                break
                
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"❌ 파싱 오류 ({encoding}): {e}")
            
    # JSON 파일 저장
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(parking_lots, f, ensure_ascii=False, indent=2)
        
    print(f"✅ {JSON_FILE} 저장 완료!")

if __name__ == "__main__":
    run()
