import { ParkingLot } from '../types';

export const DEFAULT_CENTER = { lat: 36.815, lon: 127.113 };

const toRadians = (deg: number) => (deg * Math.PI) / 180;

export const calcDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371 * c * 10) / 10;
};

export const getOccupancyRate = (available: number, total: number) => {
  const totalVal = Math.max(1, total);
  return (available / totalVal) * 100;
};

export const getOccupancyStatus = (available: number, total: number) => {
  const rate = getOccupancyRate(available, total);
  if (rate > 30) return '여유';
  if (rate > 10) return '보통';
  return '혼잡';
};

export const getOccupancyBadgeClass = (available: number, total: number) => {
  const rate = getOccupancyRate(available, total);
  if (rate > 30) return 'bg-green-50 text-green-600';
  if (rate > 10) return 'bg-yellow-50 text-yellow-600';
  return 'bg-red-50 text-red-600';
};

export const getOccupancyBarClass = (available: number, total: number) => {
  const rate = getOccupancyRate(available, total);
  if (rate > 30) return 'bg-green-500';
  if (rate > 10) return 'bg-yellow-500';
  return 'bg-red-500';
};

type NormalizeOptions = {
  baseCoord?: { lat: number; lon: number };
};

export const normalizeParkingLot = (
  raw: any,
  options: NormalizeOptions = {}
): ParkingLot => {
  if (!raw) {
    return {
      id: '',
      name: '정보 없음',
      address: '',
      totalSpaces: 0,
      availableSpaces: 0,
      distance: 0,
      fee: {
        type: '정보 없음',
        basic: 0,
        basicTime: 0,
        additional: 0,
        additionalTime: 0,
        gracePeriod: 0,
        daily: 0,
        monthly: 0,
      },
      operatingHours: '정보 없음',
      latitude: 0,
      longitude: 0,
      type: 'private',
      facilities: [],
    };
  }

  const lat = Number(raw.latitude) || 0;
  const lon = Number(raw.longitude) || 0;
  const totalSpaces = Number(raw.totalSpaces) || 0;
  const base = options.baseCoord || DEFAULT_CENTER;

  return {
    id: raw.id?.toString() || '',
    externalId: raw.externalId ?? raw.id,
    name: raw.name || '이름 없음',
    address: raw.address || '',
    totalSpaces,
    availableSpaces:
      raw.availableSpaces !== null && raw.availableSpaces !== undefined
        ? Number(raw.availableSpaces)
        : Math.max(0, Math.round(totalSpaces * 0.35)),
    distance:
      raw.distance !== null && raw.distance !== undefined
        ? Number(raw.distance)
        : calcDistanceKm(base.lat, base.lon, lat, lon),
    fee: {
      type: raw.fee?.type || raw.feeType || '정보 없음',
      basic: Number(raw.fee?.basic ?? raw.basicFee) || 0,
      basicTime: Number(raw.fee?.basicTime ?? raw.basicTime) || 30,
      additional: Number(raw.fee?.additional ?? raw.additionalFee) || 0,
      additionalTime:
        Number(raw.fee?.additionalTime ?? raw.additionalTime) || 10,
      gracePeriod: Number(raw.fee?.gracePeriod) || 0,
      daily: Number(raw.fee?.daily) || 0,
      monthly: Number(raw.fee?.monthly) || 0,
    },
    operatingHours: raw.operatingHours || '정보 없음',
    operatingDays: raw.operatingDays || '',
    latitude: lat,
    longitude: lon,
    feeInfo: raw.feeInfo,
    type: raw.type === 'public' ? 'public' : 'private',
    parkingType: raw.parkingType,
    hasDisabledParking: raw.hasDisabledParking,
    managingOrg: raw.managingOrg,
    phone: raw.phone,
    paymentMethods: raw.paymentMethods,
    facilities: Array.isArray(raw.facilities) ? raw.facilities : [],
    dataDate: raw.dataDate,
    prediction: Array.isArray(raw.prediction)
      ? raw.prediction.map((item: any) => ({
          time: item.time || '',
          occupancyRate: Number(item.occupancy_rate ?? item.occupancyRate) || 0,
          confidence: Number(item.confidence) || 0,
          factors: item.factors,
        }))
      : undefined,
  };
};
