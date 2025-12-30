#!/usr/bin/env python3
"""예측 엔진 테스트 스크립트"""
import sys
sys.path.insert(0, 'backend')

from main import load_parking_lots, load_violation_patterns, PredictionEngine

# 데이터 로드 테스트
parking_lots = load_parking_lots()
patterns = load_violation_patterns()

print(f"=== 데이터 로드 테스트 ===")
print(f"주차장 수: {len(parking_lots)}")
print(f"불법주정차 건수: {patterns.get('total_count', 0):,}")
print(f"데이터 기간: {patterns.get('date_range', {})}")
print()

# 예측 엔진 테스트
engine = PredictionEngine()
print(f"=== 예측 엔진 테스트 ===")

# 첫 번째 주차장으로 테스트
test_id = parking_lots[0]['id'] if parking_lots else 'P0001'
print(f"테스트 주차장 ID: {test_id}")
print(f"주차장명: {parking_lots[0].get('name', 'N/A') if parking_lots else 'N/A'}")
print()

predictions = engine.generate_predictions(test_id, 6)
print("향후 6시간 예측:")
for pred in predictions:
    factors = pred.get('factors', {})
    print(f"  {pred['time']}: 혼잡도 {pred['occupancy_rate']}%, 신뢰도 {pred['confidence']}%")
    print(f"    [요소] 시간:{factors.get('hourly',0):.2f} 요일:{factors.get('daily',0):.2f} 위치:{factors.get('location',0):.2f}")

print()
print("=== 테스트 완료 ===")
