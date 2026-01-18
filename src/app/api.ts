import { ParkingLot, PredictionData, PatternsSummary } from './types';
import { config } from './config';
import parkingLotsSource from './data/parkingLots.json';

const API_BASE_URL = config.apiBaseUrl;
const center = { lat: 36.815, lon: 127.113 };

export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  name?: string;
}

export interface PaymentPayload {
  parkingLotName: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  fee: number;
  userId?: number;
}

export interface PaymentRecord {
  id: number;
  parkingLotName: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  fee: number;
  date: string;
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;

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
  return Math.round(6371 * c * 10) / 10;
};

const normalizeParkingLot = (raw: any): ParkingLot => {
  if (!raw) {
    return {
      id: '',
      name: '정보 없음',
      address: '',
      totalSpaces: 0,
      availableSpaces: 0,
      distance: 0,
      fee: { type: '정보 없음', basic: 0, basicTime: 0, additional: 0, additionalTime: 0, daily: 0, monthly: 0 },
      operatingHours: '정보 없음',
      latitude: 0,
      longitude: 0,
      type: 'private',
      facilities: []
    };
  }

  const lat = Number(raw.latitude) || 0;
  const lon = Number(raw.longitude) || 0;
  
  return {
    id: raw.id?.toString() || '',
    externalId: raw.externalId,
    name: raw.name || '이름 없음',
    address: raw.address || '',
    totalSpaces: Number(raw.totalSpaces) || 0,
    availableSpaces: (raw.availableSpaces !== null && raw.availableSpaces !== undefined) 
      ? Number(raw.availableSpaces) 
      : Math.max(0, Math.round((Number(raw.totalSpaces) || 0) * 0.35)),
    distance: (raw.distance !== null && raw.distance !== undefined) 
      ? Number(raw.distance) 
      : calcDistanceKm(lat, lon),
    fee: {
      type: raw.fee?.type || '정보 없음',
      basic: Number(raw.fee?.basic) || 0,
      basicTime: Number(raw.fee?.basicTime) || 30,
      additional: Number(raw.fee?.additional) || 0,
      additionalTime: Number(raw.fee?.additionalTime) || 10,
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

const getStoredToken = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = window.localStorage.getItem('authUser');
    if (!stored) return undefined;
    const parsed = JSON.parse(stored);
    return parsed?.token as string | undefined;
  } catch {
    return undefined;
  }
};

async function safeFetch(url: string, options?: RequestInit) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(options?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      let errorDetail = '';
      try {
        const errData = await response.json();
        errorDetail = errData.detail || errData.message || '';
      } catch (e) { /* ignore */ }
      
      const msg = errorDetail ? `서버 오류: ${errorDetail}` : (response.statusText || '요청 실패');
      throw new Error(msg);
    }
    return response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('서버 연결 실패 (시간 초과).');
    }
    throw error;
  }
}

export const api = {
  async getParkingLots(): Promise<ParkingLot[]> {
    // 로컬 JSON 데이터 (CSV에서 파싱된 실제 데이터)
    const localLots = (parkingLotsSource as any[])
      .filter((lot) => lot.latitude && lot.longitude && lot.name)
      .map(normalizeParkingLot);
    
    try {
      const data = await safeFetch(`${API_BASE_URL}/parking-lots`);
      const normalized = Array.isArray(data) ? data.map(normalizeParkingLot) : [];
      // 백엔드에서 충분한 데이터를 주면 사용, 아니면 로컬 데이터
      if (normalized.length >= 50) return normalized;
      return localLots;
    } catch (error) {
      console.info('Using local parkingLotsSource (Offline/Fallback mode)');
      return localLots;
    }
  },

  async getParkingLot(id: string): Promise<ParkingLot> {
    const localLots = (parkingLotsSource as any[])
      .filter((lot) => lot.latitude && lot.longitude)
      .map(normalizeParkingLot);
    
    try {
      const data = await safeFetch(`${API_BASE_URL}/parking-lots/${id}`);
      if (!data) throw new Error('데이터가 없습니다.');
      return normalizeParkingLot(data);
    } catch (error) {
      console.info('Falling back to local parkingLotsSource:', error);
      return localLots.find((lot) => lot.id === id) || localLots[0];
    }
  },

  async getPredictions(parkingId: string, hoursAhead: number = 24): Promise<PredictionData[]> {
    try {
      const data = await safeFetch(`${API_BASE_URL}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parking_id: parkingId, hours_ahead: hoursAhead }),
      });
      return Array.isArray(data)
        ? data.map((item: any) => ({
            time: item.time,
            occupancyRate: item.occupancy_rate ?? item.occupancyRate ?? 0,
            confidence: item.confidence ?? 0,
            factors: item.factors,
          }))
        : [];
    } catch (error) {
      console.warn('Prediction fetch failed:', error);
      return [];
    }
  },

  async getPatternsSummary(): Promise<PatternsSummary | null> {
    try {
      return await safeFetch(`${API_BASE_URL}/patterns/summary`);
    } catch (error) {
      console.warn('Patterns summary fetch failed:', error);
      return null;
    }
  },

  async getWeather() {
    try {
      const data = await safeFetch(`${API_BASE_URL}/weather`);
      if (!data) throw new Error('No weather data');
      return data;
    } catch (error) {
      console.info('Falling back to mock weather data:', error);
      return {
        temperature: -2,
        condition: 'sunny',
        precipitationProbability: 0,
      };
    }
  },

  async register(payload: AuthPayload): Promise<AuthResponse> {
    return safeFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: AuthPayload): Promise<AuthResponse> {
    return safeFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createPayment(payload: PaymentPayload): Promise<PaymentRecord> {
    const res = await safeFetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parking_lot_name: payload.parkingLotName,
        start_time: payload.startTime,
        end_time: payload.endTime,
        duration: payload.duration,
        fee: payload.fee,
        user_id: payload.userId,
      }),
    });
    return res;
  },

  async getHistory(userId?: number): Promise<PaymentRecord[]> {
    try {
      const query = userId ? `?user_id=${userId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/history${query}`);
      return res;
    } catch (e) {
      console.warn('Falling back to mock history:', e);
      return (await import('./data/mockData')).mockParkingHistory as any;
    }
  },
};

export function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
