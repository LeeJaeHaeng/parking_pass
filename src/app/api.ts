import { mockParkingLots, generatePredictionData } from './data/mockData';
import { ParkingLot, PredictionData } from './types';
import { config } from './config';

const API_BASE_URL = config.apiBaseUrl;

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

const normalizeParkingLot = (raw: any): ParkingLot => ({
  id: Number(raw.id) || Number(raw.external_id) || Number(raw.externalId) || raw.id,
  externalId: raw.external_id ?? raw.externalId,
  name: raw.name,
  address: raw.address,
  totalSpaces: raw.total_spaces ?? raw.totalSpaces ?? 0,
  availableSpaces: raw.available_spaces ?? raw.availableSpaces ?? Math.max(0, Math.round((raw.total_spaces ?? raw.totalSpaces ?? 0) * 0.35)),
  distance: raw.distance ?? 0,
  fee: {
    basic: raw.fee_basic ?? raw.fee?.basic ?? 0,
    additional: raw.fee_additional ?? raw.fee?.additional ?? 0,
  },
  operatingHours: raw.operating_hours ?? raw.operatingHours ?? '정보 없음',
  latitude: raw.latitude ?? 0,
  longitude: raw.longitude ?? 0,
  feeInfo: raw.fee_info ?? raw.feeInfo,
  type: raw.type ?? 'public',
  prediction: raw.prediction
    ? raw.prediction.map((item: any) => ({
        time: item.time,
        occupancyRate: item.occupancy_rate ?? item.occupancyRate ?? 0,
        confidence: item.confidence ?? 0,
      }))
    : undefined,
});

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
    ...(options?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(response.statusText || 'Request failed');
  }
  return response.json();
}

export const api = {
  async getParkingLots(): Promise<ParkingLot[]> {
    try {
      const data = await safeFetch(`${API_BASE_URL}/parking-lots`);
      return Array.isArray(data) ? data.map(normalizeParkingLot) : mockParkingLots;
    } catch (error) {
      console.warn('Falling back to mock parking lots:', error);
      return mockParkingLots;
    }
  },

  async getParkingLot(id: number): Promise<ParkingLot> {
    try {
      const data = await safeFetch(`${API_BASE_URL}/parking-lots/${id}`);
      return normalizeParkingLot(data);
    } catch (error) {
      console.warn('Falling back to mock parking lot:', error);
      return mockParkingLots.find((lot) => lot.id === id) || mockParkingLots[0];
    }
  },

  async getPredictions(parkingId: number, hoursAhead: number = 24): Promise<PredictionData[]> {
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
          }))
        : generatePredictionData(parkingId);
    } catch (error) {
      console.warn('Falling back to mock prediction data:', error);
      return generatePredictionData(parkingId);
    }
  },

  async getWeather() {
    try {
      return await safeFetch(`${API_BASE_URL}/weather`);
    } catch (error) {
      console.warn('Falling back to mock weather data:', error);
      return {
        temperature: 18,
        condition: 'cloudy',
        precipitationProbability: 10,
      };
    }
  },

  async register(payload: AuthPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || '회원가입 실패');
    }
    return res.json();
  },

  async login(payload: AuthPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || '로그인 실패');
    }
    return res.json();
  },
};

export function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
