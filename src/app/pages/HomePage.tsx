import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, TrendingUp, LocateFixed, CloudRain, ThermometerSun } from 'lucide-react';
import { api } from '../api';
import { ParkingLot } from '../types';
import { mockParkingLots } from '../data/mockData';
import { KakaoMap } from '../components/KakaoMap';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface HomePageProps {
  onParkingSelect: (id: number) => void;
  onSearchClick: () => void;
}

type UserLocation = { lat: number; lon: number } | null;

export default function HomePage({ onParkingSelect, onSearchClick }: HomePageProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'nearby'>('all');
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>(mockParkingLots);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; condition: string; precipitationProbability: number } | null>(null);

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const data = await api.getParkingLots();
        // distance가 없는 경우 0 처리
        const normalized = data.map((lot) => ({
          ...lot,
          distance: lot.distance ?? 0,
        }));
        setParkingLots(normalized);
      } catch (error) {
        console.error('Failed to fetch parking lots:', error);
        setParkingLots(mockParkingLots);
      } finally {
        setLoading(false);
      }
    };
    fetchParkingLots();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await api.getWeather();
        setWeather(data);
      } catch (e) {
        setWeather(null);
      }
    };
    fetchWeather();
  }, []);

  const getFilteredLots = () => {
    let filtered = [...parkingLots];
    
    if (selectedFilter === 'available') {
      filtered = filtered.filter(lot => lot.availableSpaces > 10);
    } else if (selectedFilter === 'nearby') {
      if (userLocation) {
        filtered = filtered.filter(lot => lot.distance < 1.5);
      } else {
        filtered = filtered.filter(lot => lot.distance < 1);
      }
    }
    
    // 현 위치가 있으면 실제 거리 순으로, 없으면 distance 필드 순
    if (userLocation) {
      const toRadians = (deg: number) => (deg * Math.PI) / 180;
      const EARTH_RADIUS_KM = 6371;
      const calcDistance = (lat: number, lon: number) => {
        const dLat = toRadians(lat - userLocation.lat);
        const dLon = toRadians(lon - userLocation.lon);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRadians(userLocation.lat)) *
            Math.cos(toRadians(lat)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
      };
      filtered = filtered.map((lot) => ({
        ...lot,
        distance: calcDistance(lot.latitude, lot.longitude),
      }));
    }

    return filtered.sort((a, b) => a.distance - b.distance);
  };

  const getOccupancyColor = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 30) return 'text-green-600 bg-green-50';
    if (rate > 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getOccupancyStatus = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 30) return '여유';
    if (rate > 10) return '보통';
    return '혼잡';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl">천안 AI 파킹 패스</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-500"
              onClick={onSearchClick}
            >
              <Navigation className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm opacity-90">현재 위치</p>
              <p className="text-sm">천안시 서북구 불당동</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>주변 주차장 위치</span>
            <span className="text-blue-600">총 {parkingLots.length}곳</span>
          </div>
          <div className="flex gap-2 text-xs text-gray-500 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!navigator.geolocation) {
                  setLocError('브라우저에서 위치를 지원하지 않습니다.');
                  return;
                }
                setLocError(null);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                  },
                  (err) => {
                    setLocError(err.message || '위치 정보를 가져올 수 없습니다.');
                  },
                  { enableHighAccuracy: false, timeout: 5000 }
                );
              }}
              className="h-8"
            >
              <LocateFixed className="w-3 h-3 mr-1" />
              현 위치 반영
            </Button>
            {userLocation && (
              <span className="text-blue-600">위치 갱신됨</span>
            )}
            {locError && (
              <span className="text-red-500">{locError}</span>
            )}
          </div>
          <KakaoMap
            parkingLots={parkingLots}
            height="14rem"
            onMarkerClick={(id) => {
              onParkingSelect(id);
            }}
          />
        </div>
      </div>

      {/* Weather summary */}
      {weather && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="max-w-lg mx-auto flex items-center gap-3 text-sm text-gray-700">
            <ThermometerSun className="w-4 h-4 text-orange-500" />
            <span>{weather.temperature}°C · {weather.condition}</span>
            <CloudRain className="w-4 h-4 text-blue-500" />
            <span>강수확률 {weather.precipitationProbability}%</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={selectedFilter === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('available')}
          >
            여유 있음
          </Button>
          <Button
            variant={selectedFilter === 'nearby' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('nearby')}
          >
            가까운 순
          </Button>
        </div>
      </div>

      {/* Parking Lots List */}
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {loading && (
          <Card className="p-4">
            <p className="text-sm text-gray-500">주차장 정보를 불러오는 중입니다...</p>
          </Card>
        )}
        {!loading && getFilteredLots().map((lot) => (
          <Card
            key={lot.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onParkingSelect(lot.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3>{lot.name}</h3>
                  {lot.type === 'public' && (
                    <Badge variant="outline" className="text-xs">공영</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{lot.address}</p>
              </div>
              <Badge className={getOccupancyColor(lot.availableSpaces, lot.totalSpaces)}>
                {getOccupancyStatus(lot.availableSpaces, lot.totalSpaces)}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">잔여 공간</p>
                <p className="text-blue-600">{lot.availableSpaces}/{lot.totalSpaces}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">거리</p>
                <p>{lot.distance}km</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">기본 요금</p>
                <p>{lot.fee.basic.toLocaleString()}원</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lot.operatingHours}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                30분 후 만차 확률: {lot.prediction ? Math.round(lot.prediction[0]?.occupancyRate || 0) : 0}%
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
