import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  TrendingUp, 
  LocateFixed, 
  CloudRain, 
  ThermometerSun,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { ParkingLot } from '../types';
import parkingLotsSource from '../data/parkingLots.json';
import { ParkingLotCard } from '../components/ParkingLotCard';
import { KakaoMap } from '../components/KakaoMap';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const EnvironmentTicker = ({ weather }: { weather: any }) => {
  if (!weather) return null;
  
  const items = [
    { label: '대기질', value: weather.air_quality || '보통', icon: <Sparkles className="w-3 h-3" /> },
    { label: '미세먼지(PM10)', value: `${weather.pm10 || 0}㎍/㎥`, icon: <CloudRain className="w-3 h-3" /> },
    { label: '초미세먼지(PM2.5)', value: `${weather.pm25 || 0}㎍/㎥`, icon: <CloudRain className="w-3 h-3" /> },
    { label: '강수확률', value: `${weather.precipitationProbability || 0}%`, icon: <CloudRain className="w-3 h-3" /> },
  ];

  return (
    <div className="bg-blue-600/5 backdrop-blur-sm border-y border-blue-100/50 py-2.5 overflow-hidden sticky bottom-16 z-20">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap gap-8 items-center"
      >
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 px-2">
            <span className="text-blue-500 opacity-60">{item.icon}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
            <span className="text-[10px] font-black text-gray-900">{item.value}</span>
            <span className="mx-2 text-gray-200">|</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const AIBriefing = ({ weather, parkingLots }: { weather: any, parkingLots: ParkingLot[] }) => {
  const [briefing, setBriefing] = useState('데이터 분석 중...');

  useEffect(() => {
    if (!parkingLots.length) return;
    
    const availableTotal = parkingLots.reduce((acc, lot) => acc + (lot.availableSpaces || 0), 0);
    const avgCongestion = Math.round((1 - (availableTotal / (parkingLots.reduce((acc, lot) => acc + (lot.totalSpaces || 0), 0) || 1))) * 100);
    
    let text = `현재 천안시 주요 주차장 가용률은 약 ${100 - avgCongestion}%입니다. `;
    
    if (weather) {
      if (weather.condition === 'rainy' || weather.condition === 'snowy') {
        text += "날씨의 영향으로 실내 주차장 수요가 급증하고 있습니다. ";
      } else if (weather.temperature > 28) {
        text += "폭염으로 인해 그늘이 있는 주차장으로 차량이 몰리고 있습니다. ";
      }
    }

    if (avgCongestion > 70) {
      text += "현재 도심권 주차 혼잡도가 매우 높습니다. 외곽 공영주차장 이용을 추천드려요!";
    } else {
      text += "주차 여유가 충분한 편입니다. 목적지 근처 공영주차장을 확인해 보세요.";
    }
    
    setBriefing(text);
  }, [weather, parkingLots]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={80} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold">AI 주차 브리핑</h2>
      </div>
      <p className="text-sm leading-relaxed opacity-90 font-light">
        {briefing}
      </p>
      <div className="mt-4 flex gap-2">
        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
          실시간
        </Badge>
        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
          개인화 추천
        </Badge>
      </div>
    </motion.div>
  );
};

interface HomePageProps {
  onParkingSelect: (id: string) => void;
  onSearchClick: () => void;
}

type UserLocation = { lat: number; lon: number } | null;

export default function HomePage({ onParkingSelect, onSearchClick }: HomePageProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nearby' | 'congestion' | 'price'>('all');
  const [shouldCenterUser, setShouldCenterUser] = useState<number>(0);
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
        console.log('[위치정보] 위치 요청 시작...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('[위치정보] 성공:', pos.coords.latitude, pos.coords.longitude);
            setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            setShouldCenterUser(Date.now());
            setLocError(null);
          },
          (err) => {
            console.error('[위치정보] 오류 발생:', err);
            console.error('[위치정보] 오류 코드:', err.code);
            console.error('[위치정보] 오류 메시지:', err.message);
            let msg = '위치 정보를 가져올 수 없습니다.';
            switch(err.code) {
              case err.PERMISSION_DENIED:
                msg = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                console.error('[위치정보] 권한 거부됨');
                break;
              case err.POSITION_UNAVAILABLE:
                msg = '위치 정보를 사용할 수 없습니다.';
                console.error('[위치정보] 위치 사용 불가');
                break;
              case err.TIMEOUT:
                msg = '위치 정보 획득 시간이 초과되었습니다.';
                console.error('[위치정보] 타임아웃');
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
      processed = processed.map((lot) => {
        const dist = calcDistance(lot.latitude, lot.longitude);
        
        // AI 추천 점수 계산 (거리 50%, 가격 20%, 가용률 30%)
        const distScore = Math.max(0, 100 - (dist * 20)); // 5km 벗어나면 점수 급감
        const priceScore = lot.fee?.type === '무료' ? 100 : Math.max(0, 100 - (lot.fee?.basic / 100)); // 가격 비쌀수록 감점
        const availabilityRate = ((lot.availableSpaces ?? 0) / Math.max(1, lot.totalSpaces)) * 100;
        
        const ai_score = (distScore * 0.5) + (priceScore * 0.2) + (availabilityRate * 0.3);

        return {
          ...lot,
          distance: dist,
          ai_score
        };
      });
    }

    // 3. 필터링 및 정렬 로직 고도화
    if (selectedFilter === 'congestion') {
       processed.sort((a, b) => {
         const totalA = Math.max(1, a.totalSpaces || 0);
         const totalB = Math.max(1, b.totalSpaces || 0);
         const rateA = (a.availableSpaces ?? 0) / totalA;
         const rateB = (b.availableSpaces ?? 0) / totalB;
         return rateB - rateA;
       });
    } else if (selectedFilter === 'price') {
       processed.sort((a, b) => (a.fee?.basic ?? 0) - (b.fee?.basic ?? 0));
    } else if (selectedFilter === 'nearby') {
       processed.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
       processed = processed.slice(0, 5);
    } else {
      // AI 추천 정렬 (종합 점수 기반)
      processed.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    }

    return processed;
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Environment Ticker */}
      <EnvironmentTicker weather={weather} />

      {/* Premium Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-gray-100 backdrop-blur-md bg-white/80">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="AI 파킹 패스" className="w-10 h-10 rounded-xl shadow-lg" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">AI 파킹 패스</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">천안 스마트시티</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 border-0"
            onClick={onSearchClick}
          >
            <Navigation className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-24">
        {/* AI Briefing Segment */}
        <div className="px-4 py-6">
          <AIBriefing weather={weather} parkingLots={parkingLots} />
        </div>

        {/* Current Location Bar */}
        <div className="px-4 mb-6">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-4 premium-shadow">
            <div className="bg-blue-50 p-3 rounded-xl">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-blue-600 mb-0.5">현재 위치한 지역</p>
              <p className="text-sm font-medium text-gray-800 truncate">{currentAddress}</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="px-4 mb-8">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-4 flex items-center justify-between bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">주변 주차장 보기</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                        setShouldCenterUser(Date.now());
                      },
                      () => setLocError('위치 획득 실패')
                    );
                  }
                }}
                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
              >
                <LocateFixed className="w-4 h-4 mr-1.5" />
                내 위치로
              </Button>
            </div>
            <KakaoMap
              parkingLots={parkingLots}
              height="16rem"
              onMarkerClick={onParkingSelect}
              userLocation={userLocation}
              shouldCenterUser={shouldCenterUser}
              onAddressFound={setCurrentAddress}
            />
          </div>
          {locError && <p className="mt-2 text-[10px] text-red-500 font-medium px-2">{locError}</p>}
        </div>

      {/* Weather summary */}
      {weather && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="max-w-lg mx-auto flex items-center gap-3 text-sm text-gray-700">
            <ThermometerSun className="w-4 h-4 text-orange-500" />
            <span>
              {weather.temperature}C  {
                { sunny: '맑음', cloudy: '흐림', rainy: '비', snowy: '눈' }[weather.condition] || weather.condition
              }
            </span>
            <CloudRain className="w-4 h-4 text-blue-500" />
            <span>강수확률 {weather.precipitationProbability ?? 0}%</span>
          </div>
        </div>
      )}

        {/* Control & List Segment */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">맞춤형 주차장 탐색</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              < Sparkles className="w-3 h-3 text-blue-500" />
              AI 추천 엔진 가동 중
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'AI 추천' },
              { id: 'nearby', label: '가까운 순' },
              { id: 'congestion', label: '여유 공간순' },
              { id: 'price', label: '최저가순' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-400">최적의 주차장을 선별하고 있습니다...</p>
                </motion.div>
              ) : (
                getFilteredLots().map((lot, idx) => (
                  <ParkingLotCard
                    key={lot.id}
                    lot={lot}
                    index={idx}
                    onClick={onParkingSelect}
                    isBest={idx === 0 && (selectedFilter === 'all' || selectedFilter === 'nearby')}
                    showPrediction={true}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
