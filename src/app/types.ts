export type ParkingLotType = 'public' | 'private';

export interface PredictionData {
  time: string;
  occupancyRate: number;
  confidence: number;
}

export interface ParkingLot {
  id: number;
  externalId?: string;
  name: string;
  address: string;
  totalSpaces: number;
  availableSpaces: number;
  distance: number;
  fee: {
    basic: number;
    additional: number;
  };
  operatingHours: string;
  latitude: number;
  longitude: number;
  feeInfo?: string;
  type: ParkingLotType;
  prediction?: PredictionData[];
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
