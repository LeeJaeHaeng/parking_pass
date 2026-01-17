export type ParkingLotType = 'public' | 'private';

export interface PredictionData {
  time: string;
  occupancyRate: number;
  confidence: number;
  factors?: {
    hourly: number;
    daily: number;
    location: number;
    fee: number;
    capacity: number;
  };
}

export interface ParkingFee {
  type?: string;
  basic: number;
  basicTime?: number;
  additional: number;
  additionalTime?: number;
    gracePeriod?: number;
  daily?: number;
  monthly?: number;
}

export interface ParkingLot {
  id: string;
  externalId?: string;
  name: string;
  address: string;
  totalSpaces: number;
  availableSpaces?: number | null;
  distance?: number;
  fee: ParkingFee;
  operatingHours?: string;
  operatingDays?: string;
  latitude: number;
  longitude: number;
  feeInfo?: string;
  type: ParkingLotType;
  parkingType?: string;
  hasDisabledParking?: boolean;
  managingOrg?: string;
  phone?: string;
  paymentMethods?: string;
  facilities?: string[];
  dataDate?: string;
  prediction?: PredictionData[];
  ai_score?: number;
}

export interface ParkingHistory {
  id: number;
  parkingLotName: string;
  startTime: string;
  endTime: string;
  duration: number;
  fee: number;
  date: string;
}

export interface Vehicle {
  licensePlate: string;
  model: string;
  color: string;
}

export interface PatternsSummary {
  total_violations: number;
  date_range: {
    start: string;
    end: string;
  };
  peak_hours: number[];
  top_dongs: string[];
  weights_used: {
    hourly: number;
    daily: number;
    location: number;
    fee: number;
    capacity: number;
  };
}
