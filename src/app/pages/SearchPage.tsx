import { useState, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, SlidersHorizontal, X, TrendingUp, Wallet, Building2, Car } from 'lucide-react';
import { mockParkingLots, violationHotspotsWithCoords } from '../data/mockData';
import { api } from '../api';
import { ParkingLot } from '../types';
import { KakaoMap } from '../components/KakaoMap';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '../components/ui/sheet';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';

interface SearchPageProps {
  onBack: () => void;
  onParkingSelect: (id: string) => void;
}

export default function SearchPage({ onBack, onParkingSelect }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'availability' | 'price'>('distance');
  const [maxDistance, setMaxDistance] = useState([30]); // 기본값을 30km로 넉넉하게 설정 (전체 보기)
  const [parkingType, setParkingType] = useState<'all' | 'public' | 'private'>('all');
  const [showHotspots, setShowHotspots] = useState(false);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      } else {
        setRecentSearches(['불당동', '신부동', '터미널', '갤러리아']);
      }
    } catch (e) {
      console.error("Failed to parse recent searches", e);
    }
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const newSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const deleteSearch = (term: string) => {
    const newSearches = recentSearches.filter(s => s !== term);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    setSearchQuery(term);
    saveSearch(term);

    // 1. 카카오 장소 검색 API 호출
    if ((window as any).kakao?.maps?.services) {
      const ps = new (window as any).kakao.maps.services.Places();
      ps.keywordSearch(term, (data: any[], status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK) {
          // 장소 검색 성공 시 첫 번째 결과를 목적지로 설정
          const place = data[0];
          setTargetLocation({
            name: place.place_name,
            lat: parseFloat(place.y),
            lon: parseFloat(place.x),
          });
          setSortBy('distance'); // 거리순 정렬 자동 선택
        } else {
          // 장소 검색 실패 시 (일반 텍스트 검색)
          setTargetLocation(null);
        }
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getParkingLots();
        // search page에서는 백엔드에서 받은 원본 거리(천안시청 기준)를 쓰거나 
        // 여기서도 사용자 위치를 받아 재계산할수 있음. 
        // 일단 백엔드 데이터를 신뢰 (distance가 이미 들어있음)
        // 만약 거리가 없으면 0 처리
        setParkingLots(data.map(p => ({
            ...p,
            distance: p.distance ?? 0
        })));
      } catch (error) {
        console.error("Failed to load parking lots:", error);
        // Fallback: mockData는 string id 등으로 수정되었는지 확인 필요. 
        // mockData.ts 내용을 볼 수 없지만 일단 빈 배열 혹은 mock 그대로 사용
        setParkingLots(mockParkingLots as any); // 타입 호환 강제
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFilteredAndSortedLots = () => {
    // targetLocation이 있으면 거리를 재계산하여 매핑
    let filtered = parkingLots.map((lot) => {
      // ParkingLot uses latitude/longitude, targetLocation uses lat/lon
      if (targetLocation && lot.latitude && lot.longitude) {
        const dist = calculateDistance(targetLocation.lat, targetLocation.lon, lot.latitude, lot.longitude);
        return { ...lot, distance: dist };
      }
      return lot;
    });

    // Search filter
    // targetLocation이 있으면(장소 검색 성공) 이름 필터링은 건너뜀 (목적지 주변 검색 모드)
    if (searchQuery && !targetLocation) {
      filtered = filtered.filter(lot =>
        lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (parkingType !== 'all') {
      filtered = filtered.filter(lot => lot.type === parkingType);
    }

    // Distance filter
    filtered = filtered.filter(lot => (lot.distance ?? 0) <= maxDistance[0]);

    // Sort
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1>주차장 검색</h1>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="주차장 이름, 지역 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>필터 설정</SheetTitle>
                </SheetHeader>
                
                <div className="p-6 space-y-8">
                  {/* 정렬 기준 */}
                  <section>
                    <Label className="text-base font-semibold text-gray-900 mb-4 block">정렬 기준</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSortBy(sortBy === 'availability' ? 'distance' : 'availability')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          sortBy === 'availability' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-500' 
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <TrendingUp className="mb-2 w-6 h-6" />
                        <span className="text-sm">여유 공간</span>
                      </button>
                      <button
                        onClick={() => setSortBy(sortBy === 'price' ? 'distance' : 'price')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          sortBy === 'price' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-500' 
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Wallet className="mb-2 w-6 h-6" />
                        <span className="text-sm">저렴한 순</span>
                      </button>
                    </div>
                  </section>

                  {/* 최대 거리 */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base font-semibold text-gray-900">최대 검색 거리</Label>
                      <Badge variant="secondary" className="text-blue-700 bg-blue-100 px-3 py-1 text-sm font-bold rounded-full">
                        {maxDistance[0]}km 이내
                      </Badge>
                    </div>
                    <div className="px-2 py-2">
                       <Slider
                          value={maxDistance}
                          onValueChange={setMaxDistance}
                          max={30}
                          min={1}
                          step={1}
                          className="py-4"
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400 font-medium px-1">
                       <span>1km</span>
                       <span>30km</span>
                    </div>
                  </section>


                  
                  {/* Action Button */}
                  <div className="pt-4 pb-2">
                    <SheetClose asChild>
                      <Button className="w-full h-12 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                        필터 적용하기
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Map preview of results */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>검색 결과 지도</span>
            <div className="flex gap-2">
              <Button variant={showHotspots ? 'default' : 'outline'} size="sm" onClick={() => setShowHotspots((v) => !v)}>
                핫스팟 보기
              </Button>
            </div>
          </div>
            <KakaoMap
              parkingLots={getFilteredAndSortedLots()}
              height="12rem"
              onMarkerClick={onParkingSelect}
              hotspots={violationHotspotsWithCoords}
              showHotspots={showHotspots}
              targetLocation={targetLocation}
            />
        </div>
      </div>

      {/* Recent Searches */}
      {!searchQuery && (
        <div className="max-w-lg mx-auto p-4 bg-gray-50/50">
          <p className="text-sm text-gray-500 mb-3">최근 검색어</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <div 
                key={index} 
                className="group flex items-center bg-white border border-gray-200 rounded-full pl-3 pr-1 py-1 shadow-sm hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleSearch(search)}
              >
                <span className="text-sm text-gray-700 mr-1">{search}</span>
                <button
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSearch(search);
                  }}
                  title="검색어 삭제"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
             <p className="text-sm text-gray-600">
               총 {getFilteredAndSortedLots().length}개 검색됨
             </p>
             {targetLocation && (
               <p className="text-xs text-blue-600 font-medium">
                 📍 '{targetLocation.name}' 주변 주차장 ({maxDistance[0]}km 이내)
               </p>
             )}
          </div>
          <div className="flex gap-1 text-xs text-gray-500">
            <span>정렬:</span>
            <span className="text-blue-600">
              {sortBy === 'distance' && '가까운 순'}
              {sortBy === 'availability' && '여유 공간'}
              {sortBy === 'price' && '저렴한 순'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="text-center py-8 text-gray-500">데이터를 불러오는 중입니다...</div>
          ) : (
            getFilteredAndSortedLots().map((lot) => (
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
                    <div className="flex items-start gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{lot.address}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">잔여</p>
                    <p className="text-blue-600">{lot.availableSpaces}대</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">거리</p>
                    <p>{lot.distance}km</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">요금</p>
                    <p>{lot.fee.basic.toLocaleString()}원</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {!loading && getFilteredAndSortedLots().length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">필터 조건을 변경하거나 검색어를 수정해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
