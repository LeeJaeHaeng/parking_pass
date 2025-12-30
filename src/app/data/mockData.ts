import { ParkingLot, PredictionData, ParkingHistory, Vehicle } from '../types';
import parkingLotsSource from './parkingLots.json';
import violationSummary from './violationSummary.json';

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const EARTH_RADIUS_KM = 6371;
const center = { lat: 36.815, lon: 127.113 }; // 천안시청 근처 기준점

export const generatePredictionData = (parkingId: number): PredictionData[] => {
  const baseOccupancy = 60 + parkingId * 5;
  const now = new Date();
  const data: PredictionData[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24;
    let occupancy = baseOccupancy;

    // 출퇴근/점심 시간대 반영
    if (hour >= 8 && hour <= 10) occupancy += 20;
    if (hour >= 17 && hour <= 19) occupancy += 25;
    if (hour >= 12 && hour <= 14) occupancy += 15;
    if (hour >= 0 && hour <= 6) occupancy -= 30;

    // 결정적 패턴(랜덤 제거): 시간+주차장 ID 기반 사인파 변동
    occupancy += Math.sin((hour + parkingId) * 1.7) * 3;
    occupancy = Math.max(10, Math.min(95, occupancy));

    const confidence = Math.max(60, 90 - i * 2); // 시간이 지날수록 신뢰도 감소

    data.push({
      time: `${hour}:00`,
      occupancyRate: Math.round(occupancy),
      confidence,
    });
  }

  return data;
};

const calcDistanceKm = (lat: number, lon: number) => {
  if (lat === undefined || lon === undefined) return 0;
  const dLat = toRadians(lat - center.lat);
  const dLon = toRadians(lon - center.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(center.lat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10; // 0.1km 단위 반올림
};

const csvParkingLots: ParkingLot[] = (parkingLotsSource as any[])
  .filter((p) => p.latitude && p.longitude)
  .map((p, idx) => {
    const total = Number(p.totalSpaces) || 0;
    const available = p.availableSpaces ?? Math.max(1, Math.round(total * 0.35));
    return {
      id: idx + 1,
      externalId: p.id,
      name: p.name,
      address: p.address,
      totalSpaces: total,
      availableSpaces: available,
      distance: calcDistanceKm(Number(p.latitude), Number(p.longitude)),
      fee: {
        basic: p.fee?.basic ?? 0,
        additional: p.fee?.additional ?? 0,
      },
      operatingHours: p.operatingHours || '정보 없음',
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      type: p.type === 'public' ? 'public' : 'private',
      feeInfo: p.feeInfo,
      prediction: generatePredictionData(idx + 1),
    };
  });

// 기존 소수 샘플 (CSV가 비어있을 경우 대비)
const seedParkingLots: ParkingLot[] = [
  {
    id: 1,
    name: '불당 공영주차장',
    address: '충남 천안시 서북구 불당동 123',
    totalSpaces: 150,
    availableSpaces: 45,
    distance: 0.3,
    fee: { basic: 1000, additional: 500 },
    operatingHours: '24시간',
    latitude: 36.8151,
    longitude: 127.1139,
    type: 'public',
    prediction: generatePredictionData(1)
  },
  {
    id: 2,
    name: '신부 커뮤니티센터 주차장',
    address: '충남 천안시 서북구 신부동 456',
    totalSpaces: 80,
    availableSpaces: 12,
    distance: 0.5,
    fee: { basic: 800, additional: 400 },
    operatingHours: '06:00-22:00',
    latitude: 36.8201,
    longitude: 127.1189,
    type: 'public'
  },
  {
    id: 3,
    name: '갤러리아백화점 주차장',
    address: '충남 천안시 서북구 불당동 789',
    totalSpaces: 300,
    availableSpaces: 120,
    distance: 0.7,
    fee: { basic: 2000, additional: 1000 },
    operatingHours: '10:00-22:00',
    latitude: 36.8101,
    longitude: 127.1089,
    type: 'private'
  },
  {
    id: 4,
    name: '천안터미널 공영주차장',
    address: '충남 천안시 동남구 터미널길 12',
    totalSpaces: 200,
    availableSpaces: 5,
    distance: 1.2,
    fee: { basic: 1500, additional: 700 },
    operatingHours: '24시간',
    latitude: 36.8051,
    longitude: 127.1289,
    type: 'public'
  },
  {
    id: 5,
    name: '야우리 공영주차장',
    address: '충남 천안시 동남구 야우리 34',
    totalSpaces: 100,
    availableSpaces: 78,
    distance: 1.5,
    fee: { basic: 1000, additional: 500 },
    operatingHours: '24시간',
    latitude: 36.8251,
    longitude: 127.1339,
    type: 'public'
  }
];

export const mockParkingLots: ParkingLot[] =
  csvParkingLots.length > 0 ? csvParkingLots : seedParkingLots;

export const mockParkingHistory: ParkingHistory[] = [
  {
    id: 1,
    parkingLotName: '불당 공영주차장',
    startTime: '14:30',
    endTime: '17:20',
    duration: 170,
    fee: 5500,
    date: '2025-12-28'
  },
  {
    id: 2,
    parkingLotName: '갤러리아백화점 주차장',
    startTime: '10:15',
    endTime: '12:45',
    duration: 150,
    fee: 4000,
    date: '2025-12-25'
  },
  {
    id: 3,
    parkingLotName: '신부 커뮤니티센터 주차장',
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

// 임시 지오코딩 없는 핫스팟 좌표: 주차장/기준점 근처로 매핑
export const violationHotspotsWithCoords = (violationSummary.hotspots || []).slice(0, 20).map((h: any, idx: number) => ({
  place: h.place,
  count: h.count,
  lat: center.lat + (Math.random() * 0.02 - 0.01),
  lon: center.lon + (Math.random() * 0.02 - 0.01),
  id: idx + 1,
}));
