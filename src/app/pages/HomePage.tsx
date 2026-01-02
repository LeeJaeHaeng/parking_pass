import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, TrendingUp, LocateFixed, CloudRain, ThermometerSun } from 'lucide-react';
import { api } from '../api';
import { ParkingLot } from '../types';
import parkingLotsSource from '../data/parkingLots.json';
import { KakaoMap } from '../components/KakaoMap';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface HomePageProps {
  onParkingSelect: (id: string) => void;
  onSearchClick: () => void;
}

type UserLocation = { lat: number; lon: number } | null;

export default function HomePage({ onParkingSelect, onSearchClick }: HomePageProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nearby'>('nearby');
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; condition: string; precipitationProbability: number } | null>(null);
  const [sortBy, setSortBy] = useState<'congestion' | 'distance' | 'price'>('congestion');
  const [currentAddress, setCurrentAddress] = useState('위치 정보를 불러오는 중...');

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const data = await api.getParkingLots();
        // distance가 없는 경우 0 처리
        let normalized = data.map((lot) => ({
          ...lot,
          distance: lot.distance ?? 0,
        }));
        setParkingLots(normalized);
      } catch (error) {
        console.error('Failed to fetch parking lots:', error);
        setParkingLots((parkingLotsSource as any[]).map(normalizeLotFromJson));
      } finally {
        setLoading(false);
      }
    };
    fetchParkingLots();
  }, []);

  // 초기 로딩 시 사용자 위치 자동 확보
  useEffect(() => {
    const requestLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            setLocError(null);
          },
          (err) => {
            let msg = '위치 정보를 가져올 수 없습니다.';
            switch(err.code) {
              case err.PERMISSION_DENIED:
                msg = '위치 권한이 거부되었습니다. (보안 연결(HTTPS)이 아니거나 설정에서 차단됨)';
                break;
              case err.POSITION_UNAVAILABLE:
                msg = '위치 정보를 사용할 수 없습니다.';
                break;
              case err.TIMEOUT:
                msg = '위치 정보 획득 시간이 초과되었습니다.';
                break;
            }
            console.warn(msg, err);
            setLocError(msg);
            setSelectedFilter('all');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocError('브라우저가 위치 정보를 지원하지 않습니다.');
        setSelectedFilter('all');
      }
    };
    requestLocation();
  }, []);

  const normalizeLotFromJson = (lot: any): ParkingLot => ({
    id: lot.id?.toString() || '',
    externalId: lot.id,
    name: lot.name,
    address: lot.address,
    totalSpaces: Number(lot.totalSpaces) || 0,
    availableSpaces: (lot.availableSpaces !== null && lot.availableSpaces !== undefined) 
      ? Number(lot.availableSpaces) 
      : Math.max(0, Math.round((Number(lot.totalSpaces) || 0) * 0.35)),
    distance: Number(lot.distance) || 0,
    fee: { 
      type: lot.fee?.type || '무료',
      basic: lot.fee?.basic ?? 0, 
      additional: lot.fee?.additional ?? 0 
    },
    operatingHours: lot.operatingHours || '정보 없음',
    latitude: Number(lot.latitude),
    longitude: Number(lot.longitude),
    type: lot.type || 'public',
    feeInfo: lot.feeInfo,
    prediction: [],
  });

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
    let processed = [...parkingLots];

    // 1. 거리 재계산 (현 위치 있을 경우 최우선 처리)
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
      processed = processed.map((lot) => ({
        ...lot,
        distance: calcDistance(lot.latitude, lot.longitude),
      }));
    }

    // 2. 필터링 로직
    if (selectedFilter === 'nearby') {
      // 가장 가까운 순으로 강제 정렬 후 상위 5개만 추출
      // 유저 위치가 없으면 distance(0)가 의미 없으므로 기본 정렬 유지될 수 있으나, 
      // 앱 시작 시 유저 위치를 가져오므로 대부분 정상 동작.
      // 위치 권한 거부 시에는 distance 0인 상태에서 id순이나 원래 순서대로 5개 나올 것임.
      processed.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
      return processed.slice(0, 5);
    }

    // 3. 전체 보기 시 사용자 지정 정렬
    return processed.sort((a, b) => {
      if (sortBy === 'congestion') {
        const totalA = Math.max(1, a.totalSpaces || 0);
        const totalB = Math.max(1, b.totalSpaces || 0);
        const rateA = (a.availableSpaces ?? 0) / totalA;
        const rateB = (b.availableSpaces ?? 0) / totalB;
        return rateB - rateA; // 가용률 높은 순
      }
      if (sortBy === 'price') {
        return (a.fee?.basic ?? 0) - (b.fee?.basic ?? 0); // 요금 낮은 순
      }
      if (sortBy === 'distance') {
        return (a.distance ?? 0) - (b.distance ?? 0);
      }
      return 0;
    });
  };

  const getOccupancyColor = (available: number, total: number) => {
    const totalVal = Math.max(1, total);
    const rate = (available / totalVal) * 100;
    if (rate > 30) return 'text-green-600 bg-green-50';
    if (rate > 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getOccupancyStatus = (available: number, total: number) => {
    const totalVal = Math.max(1, total);
    const rate = (available / totalVal) * 100;
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
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Cheonan Logo" className="h-8 w-auto object-contain" />
              <h1 className="text-xl font-bold tracking-tight">AI 파킹 패스</h1>
            </div>
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
              <p className="text-sm">{currentAddress}</p>
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
                setLocError('위치 정보를 요청 중입니다...');
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                    setSelectedFilter('nearby');
                    setSortBy('distance');
                    setLocError(null);
                  },
                  (err) => {
                    setLocError('권한 거부 또는 획득 실패. (HTTP 접속 시 제한될 수 있음)');
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="h-8"
            >
              <LocateFixed className="w-3 h-3 mr-1" />
              현 위치 반영
            </Button>
            {userLocation && (
              <span className="text-blue-600 font-medium">위치 갱신됨</span>
            )}
            {locError && (
              <div className="flex flex-col gap-1">
                <span className="text-red-500 font-medium">{locError}</span>
                {locError.includes('HTTPS') && (
                  <span className="text-[10px] text-gray-400 underline decoration-dotted">테스트 팁: Chrome 설정에서 내부 IP 허용 필요</span>
                )}
              </div>
            )}
          </div>
          <KakaoMap
            parkingLots={parkingLots}
            height="14rem"
            onMarkerClick={(id) => {
              onParkingSelect(id);
            }}
            userLocation={userLocation}
            onAddressFound={setCurrentAddress}
          />
        </div>
      </div>

      {/* Weather summary */}
      {weather && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="max-w-lg mx-auto flex items-center gap-3 text-sm text-gray-700">
            <ThermometerSun className="w-4 h-4 text-orange-500" />
            <span>
              {weather.temperature}°C · {
                { sunny: '맑음', cloudy: '흐림', rainy: '비', snowy: '눈' }[weather.condition] || weather.condition
              }
            </span>
            <CloudRain className="w-4 h-4 text-blue-500" />
            <span>강수확률 {weather.precipitationProbability ?? 0}%</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-lg mx-auto flex flex-wrap gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={selectedFilter === 'nearby' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('nearby')}
          >
            가장 가까운 (Top 5)
          </Button>
          <Button
            variant={sortBy === 'congestion' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('congestion')}
          >
            가용률순
          </Button>
          <Button
            variant={sortBy === 'price' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('price')}
          >
            요금순
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
              <Badge className={getOccupancyColor(lot.availableSpaces ?? 0, lot.totalSpaces || 1)}>
                {getOccupancyStatus(lot.availableSpaces ?? 0, lot.totalSpaces || 1)}
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
