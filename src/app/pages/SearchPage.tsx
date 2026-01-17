import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, ArrowLeft, X, Filter, Sparkles, Navigation } from 'lucide-react';
import { api } from '../api';
import { ParkingLot } from '../types';
import { mockParkingLots } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { ParkingLotCard } from '../components/ParkingLotCard';
import { KakaoMap } from '../components/KakaoMap';

interface SearchPageProps {
  onBack: () => void;
  onParkingSelect: (id: string) => void;
}

export default function SearchPage({ onBack, onParkingSelect }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [recentSearches, setRecentSearches] = useState(['신부동', '천안시청', '일로', '두정역']);
  const [shouldCenterUser, setShouldCenterUser] = useState<number>(0);
  const [locError, setLocError] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    if (!recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)]);
    }

    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(query, (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const first = data[0];
          setTargetLocation({
            lat: parseFloat(first.y),
            lon: parseFloat(first.x),
            name: first.place_name
          });
          setShouldCenterUser(Date.now());
        } else {
          setTargetLocation(null);
        }
      });
    }
  };

  const fetchData = async () => {
    try {
      const data = await api.getParkingLots();
      setParkingLots(data.map(p => ({
          ...p,
          distance: p.distance ?? 0
      })));
    } catch (error) {
      console.error("Failed to load parking lots:", error);
      setParkingLots(mockParkingLots as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setShouldCenterUser(Date.now());
          setLocError(null);
        },
        (err) => {
          console.warn('Geolocation failed in SearchPage:', err);
          setLocError('위치 정보를 가져올 수 없습니다.');
        }
      );
    }
  }, []);

  const getFilteredAndSortedLots = () => {
    let filtered = parkingLots.map((lot) => {
      const lat = Number(lot.latitude);
      const lon = Number(lot.longitude);
      
      let baseLat = userLocation?.lat;
      let baseLon = userLocation?.lon;
      
      if (targetLocation) {
        baseLat = targetLocation.lat;
        baseLon = targetLocation.lon;
      }

      if (baseLat && baseLon) {
        const toRadians = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371;
        const dLat = toRadians(lat - baseLat);
        const dLon = toRadians(lon - baseLon);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRadians(baseLat)) *
            Math.cos(toRadians(lat)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...lot, distance: Math.round(R * c * 10) / 10 };
      }
      return lot;
    });

    // 검색 결과(targetLocation)가 있으면, 텍스트 필터링을 하지 않고 거리순으로만 보여줌 (주변 주차장 검색)
    if (searchQuery && !targetLocation) {
      filtered = filtered.filter(lot => 
        lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(lot => lot.type === selectedFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'distance') return (a.distance ?? 0) - (b.distance ?? 0);
      if (sortBy === 'availability') return (b.availableSpaces ?? 0) - (a.availableSpaces ?? 0);
      if (sortBy === 'price') return (a.fee.basic ?? 0) - (b.fee.basic ?? 0);
      return 0;
    });

    return filtered;
  };

  const clearSearch = () => {
    setSearchQuery('');
    setTargetLocation(null);
  };

  const handleRecentSearch = (search: string) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Header */}
      <div className="bg-white/80 sticky top-0 z-20 px-4 py-4 border-b border-gray-100 backdrop-blur-md">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full bg-gray-50 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">주차장 검색</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">Find Parking Lots</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="장소, 건물명, 주차장 이름"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-11 pr-10 h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-blue-100 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-gray-100 bg-white">
                  <Filter className="w-5 h-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl border-none">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-xl font-bold">정렬 및 필터</SheetTitle>
                </SheetHeader>
                <div className="space-y-8 pb-10">
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">정렬 기준</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'distance', label: '가까운 순' },
                        { id: 'availability', label: '여유 공간 순' },
                        { id: 'price', label: '요금 저렴한 순' },
                      ].map(item => (
                        <Button
                          key={item.id}
                          variant={sortBy === item.id ? 'default' : 'outline'}
                          onClick={() => setSortBy(item.id)}
                          className={`rounded-xl px-5 ${sortBy === item.id ? 'bg-blue-600' : 'border-gray-100'}`}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-24">
        {/* Map Section */}
        <div className="p-4">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 h-[18rem] relative">
            <KakaoMap
              parkingLots={getFilteredAndSortedLots()}
              height="100%"
              onMarkerClick={onParkingSelect}
              userLocation={userLocation}
              targetLocation={targetLocation}
              shouldCenterUser={shouldCenterUser}
            />
          </div>
        </div>

        {/* Results */}
        <div className="px-4 mt-4 space-y-4">
          {!searchQuery && !targetLocation && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1 mb-3">최근 검색어</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-100 rounded-xl cursor-pointer"
                    onClick={() => handleRecentSearch(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              {targetLocation ? `'${targetLocation.name}' 인근 주차장` : '전체 주차장'}
            </h3>
            <span className="text-sm text-gray-400 font-medium">{getFilteredAndSortedLots().length}개 검색됨</span>
          </div>

          {loading ? (
             <div className="py-20 text-center">
               <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-gray-400">정보를 불러오는 중...</p>
             </div>
          ) : getFilteredAndSortedLots().length > 0 ? (
            getFilteredAndSortedLots().map((lot, idx) => (
              <ParkingLotCard
                key={lot.id}
                lot={lot}
                index={idx}
                onClick={onParkingSelect}
                isBest={idx === 0 && !searchQuery}
              />
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
