import { ParkingLot, PredictionData, ParkingHistory, Vehicle } from '../types';
import parkingLotsSource from './parkingLots.json';
import violationSummary from './violationSummary.json';

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const EARTH_RADIUS_KM = 6371;
const center = { lat: 36.815, lon: 127.113 }; // 천안시청 근처 기준점

const calcDistanceKm = (lat: number, lon: number) => {
  if (!lat || !lon) return 0;
  const dLat = toRadians(lat - center.lat);
  const dLon = toRadians(lon - center.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(center.lat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
};

/**
 * 시간대별 예측 데이터 생성 (클라이언트 폴백용)
 * 실제 예측은 백엔드 API에서 불법주정차 패턴 기반으로 수행
 */
export const generatePredictionData = (parkingId: string): PredictionData[] => {
  const now = new Date();
  const data: PredictionData[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24;
    let baseOccupancy = 50;

    // 시간대별 기본 패턴 (불법주정차 데이터 기반 가중치 적용)
    const hourlyWeights: Record<number, number> = {
      0: 0.15, 1: 0.12, 2: 0.10, 3: 0.07, 4: 0.09, 5: 0.11,
      6: 0.18, 7: 0.59, 8: 0.68, 9: 0.73, 10: 0.92, 11: 0.75,
      12: 0.84, 13: 0.72, 14: 0.81, 15: 0.85, 16: 0.86, 17: 0.87,
      18: 0.93, 19: 1.00, 20: 0.95, 21: 0.42, 22: 0.33, 23: 0.26
    };
    
    const weight = hourlyWeights[hour] || 0.5;
    baseOccupancy = 40 + weight * 55;
    baseOccupancy = Math.max(10, Math.min(95, baseOccupancy));

    // 신뢰도: 가까운 시간일수록 높음
    const confidence = Math.max(60, 90 - i * 1.5);

    data.push({
      time: `${hour}:00`,
      occupancyRate: Math.round(baseOccupancy),
      confidence: Math.round(confidence),
    });
  }

  return data;
};

/**
 * CSV에서 파싱된 실제 주차장 데이터
 */
export const mockParkingLots: ParkingLot[] = (parkingLotsSource as any[])
  .filter((p) => p.latitude && p.longitude && p.name)
  .map((p) => {
    const lat = Number(p.latitude);
    const lon = Number(p.longitude);
    return {
      id: p.id?.toString() || '',
      name: p.name,
      address: p.address || '',
      totalSpaces: Number(p.totalSpaces) || 0,
      availableSpaces: p.availableSpaces ?? Math.max(1, Math.round((Number(p.totalSpaces) || 50) * 0.35)),
      distance: calcDistanceKm(lat, lon),
      fee: {
        type: p.fee?.type || '무료',
        basic: p.fee?.basic ?? 0,
        basicTime: p.fee?.basicTime ?? 30,
        additional: p.fee?.additional ?? 0,
        additionalTime: p.fee?.additionalTime ?? 10,
        daily: p.fee?.daily ?? 0,
        monthly: p.fee?.monthly ?? 0,
      },
      operatingHours: p.operatingHours || '정보 없음',
      operatingDays: p.operatingDays || '',
      latitude: lat,
      longitude: lon,
      type: p.type === 'public' ? 'public' : 'private',
      parkingType: p.parkingType,
      feeInfo: p.feeInfo,
      hasDisabledParking: p.hasDisabledParking,
      managingOrg: p.managingOrg,
      phone: p.phone,
      prediction: generatePredictionData(p.id?.toString() || '1'),
    };
  });

export const mockParkingHistory: ParkingHistory[] = [
  {
    id: 1,
    parkingLotName: '불당 제1공영주차장',
    startTime: '14:30',
    endTime: '17:20',
    duration: 170,
    fee: 5500,
    date: '2025-12-28'
  },
  {
    id: 2,
    parkingLotName: '쌍용 제1공영주차장',
    startTime: '10:15',
    endTime: '12:45',
    duration: 150,
    fee: 4000,
    date: '2025-12-25'
  },
  {
    id: 3,
    parkingLotName: '신부 제1공영주차장',
    startTime: '19:00',
    endTime: '21:30',
    duration: 150,
    fee: 3200,
    date: '2025-12-22'
  }
];

export const mockVehicle: Vehicle = {
  licensePlate: '12가 3456',
  model: '현대 아이오닉 5',
  color: '화이트'
};

export const violationHotspots = violationSummary;

// 불법주정차 핫스팟 좌표 (상위 동별 데이터)
export const violationHotspotsWithCoords = [
  { place: '성정동', count: 15186, lat: 36.820, lon: 127.139, id: 1 },
  { place: '불당동', count: 14446, lat: 36.811, lon: 127.109, id: 2 },
  { place: '두정동', count: 9993, lat: 36.832, lon: 127.139, id: 3 },
  { place: '백석동', count: 7516, lat: 36.835, lon: 127.155, id: 4 },
  { place: '성성동', count: 6315, lat: 36.839, lon: 127.117, id: 5 },
  { place: '신부동', count: 4633, lat: 36.818, lon: 127.158, id: 6 },
  { place: '쌍용동', count: 3410, lat: 36.800, lon: 127.123, id: 7 },
  { place: '차암동', count: 3217, lat: 36.810, lon: 127.145, id: 8 },
  { place: '신방동', count: 2697, lat: 36.786, lon: 127.122, id: 9 },
  { place: '직산읍', count: 2210, lat: 36.879, lon: 127.150, id: 10 },
];
