#!/usr/bin/env python3
"""예측 엔진 테스트 스크립트 (Async 지원)"""
import sys
import asyncio
sys.path.insert(0, 'backend')

from main import load_parking_lots, load_violation_patterns, PredictionEngine

# 데이터 로드 테스트
parking_lots = load_parking_lots()
patterns = load_violation_patterns()

print(f"=== 데이터 로드 테스트 ===")
print(f"주차장 수: {len(parking_lots)}")
print(f"불법주정차 건수: {patterns.get('total_count', 0):,}")
print()

async def run_test():
    engine = PredictionEngine()
    print(f"=== 예측 엔진 테스트 (날씨/휴일 포함) ===")
    
    # 첫 번째 주차장으로 테스트
    test_id = parking_lots[0]['id'] if parking_lots else 'P0001'
    print(f"테스트 주차장 ID: {test_id}")
    
    # 날씨/휴일 정보 업데이트 (API 호출 시도)
    print("날씨/휴일 정보 업데이트 중...")
    await engine.update_extras()
    print(f"현재 날씨: {engine.cached_weather}")
    print(f"오늘 휴일 여부: {engine.is_holiday_today}")

    print("\n향후 6시간 예측:")
    predictions = await engine.generate_predictions(test_id, 6)
    
    for pred in predictions:
        factors = pred.get('factors', {})
        print(f"  {pred['time']}: 혼잡도 {pred['occupancy_rate']}%, 신뢰도 {pred['confidence']}%")
        print(f"    [요소] 시간:{factors.get('hourly',0):.2f} 위치:{factors.get('location',0):.2f} 날씨:{factors.get('weather',0):.2f} 휴일:{factors.get('holiday',0):.2f}")

print("\n=== 테스트 시작 ===")
if __name__ == "__main__":
    asyncio.run(run_test())
print("=== 테스트 완료 ===")
