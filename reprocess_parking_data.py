import json
import os
import re

def clean_val(val):
    if not val: return ""
    return str(val).strip().strip('"').strip()

def parse_num(val, default=0):
    try:
        if not val: return default
        clean = re.sub(r'[^-0-9.]', '', str(val))
        if not clean: return default
        return int(float(clean))
    except:
        return default

def reprocess():
    csv_path = '충청남도_천안시_주차장정보_20251128.csv'
    output_path = 'src/app/data/parkingLots.json'
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return

    # 1. Read the header
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        header_line = f.readline()
        columns = header_line.strip().split(',')
        column_count = len(columns)

    # 2. Read content and merge lines that don't start with ID pattern
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        all_lines = f.read().splitlines()

    merged_lines = []
    # ID pattern for Cheonan public parking (e.g., 301-2-000001)
    id_pattern = re.compile(r'^\d{3}-\d-\d{6}')
    
    current_record = ""
    for i, line in enumerate(all_lines):
        if i == 0: continue # Skip header
        if not line.strip(): continue
        
        if id_pattern.match(line):
            if current_record:
                merged_lines.append(current_record)
            current_record = line
        else:
            if current_record:
                current_record += " " + line
            else:
                # If first line doesn't match ID, treat it as a start anyway
                current_record = line
    
    if current_record:
        merged_lines.append(current_record)

    print(f"Merged into {len(merged_lines)} logical records.")

    parking_lots = []
    for row_str in merged_lines:
        # Split by comma ensuring we don't over-split the middle fields
        # The first N columns are usually stable: ID, Name, Type, SubType, Address1, Address2, Count, Level, SubRule, Days, ...
        # The last N columns are usually stable: ManagingOrg, Phone, Lat, Lon, Disabled, Date
        
        parts = row_str.split(',')
        
        # If we have more than column_count, it's likely commas in '특기사항' or '소재지'
        if len(parts) > column_count:
            # Shift back from the end
            # Date(31), Disabled(30), Lon(29), Lat(28), Phone(27), ManagingOrg(26), Notes(25)
            # Let's try to join the middle part
            # Header indices (0-based):
            # 25: 특기사항
            # 26: 관리기관명
            # 27: 전화번호
            # 28: 위도
            # 29: 경도
            # 30: 장애인전용주차구역보유여부
            # 31: 데이터기준일자
            
            # We take first 25 columns stablely
            # We take last 6 columns stablely (Date, Disabled, Lon, Lat, Phone, ManagingOrg)
            stable_start = parts[:25]
            stable_end = parts[-6:]
            messy_middle = ",".join(parts[25:-6])
            
            joined_parts = stable_start + [messy_middle] + stable_end
            if len(joined_parts) == column_count:
                parts = joined_parts
            else:
                # Fallback to simple split if logic fails
                parts = parts[:column_count-1] + [",".join(parts[column_count-1:])]

        row = dict(zip(columns, parts))
        
        p_id = clean_val(row.get('주차장관리번호', ''))
        name = clean_val(row.get('주차장명', ''))
        if not name or name == '주차장명': continue
        
        basic_time = parse_num(row.get('주차기본시간', 30))
        basic_fee = parse_num(row.get('주차기본요금', 0))
        add_time = parse_num(row.get('추가단위시간', 10))
        add_fee = parse_num(row.get('추가단위요금', 0))
        
        grace_period = 0
        if basic_fee == 0 and basic_time > 0:
            grace_period = basic_time
        
        notes = clean_val(row.get('특기사항', ''))
        # Specific search for Buldang No. 5 type descriptions
        if '무료' in notes or '회차' in notes:
            match = re.search(r'(?:최초|회차)\s*(\d+)분\s*무료', notes)
            if match:
                grace_period = int(match.group(1))

        # Re-verify Buldang No. 5 specifically if this is its record
        if '불당 제5공영주차장' in name:
            # The description says "최초30분 무료 / 30분초과 시 10분마다 200원"
            # But the '추가단위요금' column might have incorrect data if the CSV is really bad
            # Let's force check the description for fees too if column looks wrong (like 500)
            if '10분마다 200원' in notes:
                add_fee = 200
                add_time = 10

        op_hours = f"평일 {row.get('평일운영시작시각','00:00')}~{row.get('평일운영종료시각','23:59')} / " \
                   f"토요일 {row.get('토요일운영시작시각','00:00')}~{row.get('토요일운영종료시각','23:59')} / " \
                   f"공휴일 {row.get('공휴일운영시작시각','00:00')}~{row.get('공휴일운영종료시각','23:59')}"

        lot = {
            "id": p_id,
            "name": name,
            "type": "public" if "공영" in clean_val(row.get('주차장구분', '')) else "private",
            "parkingType": clean_val(row.get('주차장유형', '')),
            "address": clean_val(row.get('소재지도로명주소', row.get('소재지지번주소', ''))),
            "totalSpaces": parse_num(row.get('주차구획수', 0)),
            "availableSpaces": None,
            "operatingHours": op_hours,
            "fee": {
                "type": clean_val(row.get('요금정보', '유료')),
                "basic": basic_fee,
                "basicTime": basic_time,
                "additional": add_fee,
                "additionalTime": add_time,
                "daily": parse_num(row.get('1일주차권요금', 0)),
                "monthly": parse_num(row.get('월정기권요금', 0)),
                "gracePeriod": grace_period
            },
            "feeInfo": notes,
            "paymentMethods": clean_val(row.get('결제방법', '')),
            "latitude": float(row.get('위도', 0)) if row.get('위도') and row.get('위도').strip() else 0,
            "longitude": float(row.get('경도', 0)) if row.get('경도') and row.get('경도').strip() else 0,
            "hasDisabledParking": clean_val(row.get('장애인전용주차구역보유여부', '')) == 'Y',
            "facilities": [],
            "managingOrg": clean_val(row.get('관리기관명', '')),
            "phone": clean_val(row.get('전화번호', '')),
            "dataDate": clean_val(row.get('데이터기준일자', ''))
        }
        if "장애인" in notes: lot["facilities"].append("장애인 주차")
        if "경차" in notes: lot["facilities"].append("경차 전용")
        if "임산부" in notes: lot["facilities"].append("임산부 전용")
        if "전통시장" in notes or "시장" in notes: lot["facilities"].append("시장 할인")
        if "무료" in notes: lot["facilities"].append("무료 주차")
        if "전기차" in notes: lot["facilities"].append("전기차 충전")
        if "카드" in row.get('결제방법', ''): lot["facilities"].append("카드 결제")
        if lot["type"] == "public": lot["facilities"].append("공영 주차")
        
        # Unique list
        lot["facilities"] = list(dict.fromkeys(lot["facilities"]))
        
        parking_lots.append(lot)
            
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(parking_lots, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully reprocessed {len(parking_lots)} parking lots to {output_path}")

if __name__ == "__main__":
    reprocess()
