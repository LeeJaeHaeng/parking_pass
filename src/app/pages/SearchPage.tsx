import { useState } from 'react';
import { ArrowLeft, Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { mockParkingLots, violationHotspotsWithCoords } from '../data/mockData';
import { KakaoMap } from '../components/KakaoMap';
import { Button as UIButton } from '../components/ui/button';
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
} from '../components/ui/sheet';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Slider } from '../components/ui/slider';

interface SearchPageProps {
  onBack: () => void;
  onParkingSelect: (id: number) => void;
}

export default function SearchPage({ onBack, onParkingSelect }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'availability' | 'price'>('distance');
  const [maxDistance, setMaxDistance] = useState([2]);
  const [parkingType, setParkingType] = useState<'all' | 'public' | 'private'>('all');
  const [showHotspots, setShowHotspots] = useState(false);

  const recentSearches = ['불당동', '신부동', '터미널', '갤러리아'];

  const getFilteredAndSortedLots = () => {
    let filtered = [...mockParkingLots];

    // Search filter
    if (searchQuery) {
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
    filtered = filtered.filter(lot => lot.distance <= maxDistance[0]);

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'availability') return b.availableSpaces - a.availableSpaces;
      if (sortBy === 'price') return a.fee.basic - b.fee.basic;
      return 0;
    });

    return filtered;
  };

  const clearSearch = () => {
    setSearchQuery('');
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
              <SheetContent side="bottom" className="max-w-lg mx-auto">
                <SheetHeader>
                  <SheetTitle>필터 설정</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  <div>
                    <Label className="mb-3 block">정렬 기준</Label>
                    <RadioGroup value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="distance" id="distance" />
                        <Label htmlFor="distance">가까운 순</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="availability" id="availability" />
                        <Label htmlFor="availability">여유 공간 많은 순</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="price" />
                        <Label htmlFor="price">저렴한 순</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block">최대 거리: {maxDistance[0]}km</Label>
                    <Slider
                      value={maxDistance}
                      onValueChange={setMaxDistance}
                      max={5}
                      min={0.5}
                      step={0.5}
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">주차장 유형</Label>
                    <RadioGroup value={parkingType} onValueChange={(value: any) => setParkingType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">전체</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">공영 주차장</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">민영 주차장</Label>
                      </div>
                    </RadioGroup>
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
              <UIButton variant="outline" size="sm" onClick={() => setSortBy('distance')}>
                거리 우선 정렬
              </UIButton>
              <UIButton variant={showHotspots ? 'default' : 'outline'} size="sm" onClick={() => setShowHotspots((v) => !v)}>
                핫스팟 보기
              </UIButton>
            </div>
          </div>
          <KakaoMap
            parkingLots={getFilteredAndSortedLots()}
            height="12rem"
            onMarkerClick={onParkingSelect}
            hotspots={violationHotspotsWithCoords}
            showHotspots={showHotspots}
          />
        </div>
      </div>

      {/* Recent Searches */}
      {!searchQuery && (
        <div className="max-w-lg mx-auto p-4">
          <p className="text-sm text-gray-500 mb-3">최근 검색</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleRecentSearch(search)}
              >
                {search}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            총 {getFilteredAndSortedLots().length}개 검색됨
          </p>
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
          {getFilteredAndSortedLots().map((lot) => (
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
          ))}
        </div>

        {getFilteredAndSortedLots().length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">다른 검색어를 입력해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
