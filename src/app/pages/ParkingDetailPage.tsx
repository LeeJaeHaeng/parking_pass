import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Phone, Navigation2, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import parkingLotsSource from '../data/parkingLots.json';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface ParkingDetailPageProps {
  parkingId: string;
  onBack: () => void;
  onStartParking: () => void;
}

export default function ParkingDetailPage({ parkingId, onBack, onStartParking }: ParkingDetailPageProps) {
  const [selectedTime, setSelectedTime] = useState('30');
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [loadingPred, setLoadingPred] = useState(false);
  const [realDistance, setRealDistance] = useState<number | null>(null);
  const [parking, setParking] = useState<any>(() => {
    const list = parkingLotsSource as any[];
    return list.find((p) => p.id === parkingId) || list[0];
  });

  // 거리 계산 로직
  useEffect(() => {
    if (navigator.geolocation && parking) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat1 = position.coords.latitude;
          const lon1 = position.coords.longitude;
          const lat2 = parking.latitude;
          const lon2 = parking.longitude;
          
          if (lat2 && lon2) {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const d = R * c;
            setRealDistance(Math.round(d * 10) / 10);
          }
        },
        (error) => {
          console.error("Location access denied", error);
        }
      );
    }
  }, [parking]);

  useEffect(() => {
    const loadParking = async () => {
      try {
        const p = await api.getParkingLot(parkingId);
        setParking(p);
      } catch {
        const list = parkingLotsSource as any[];
        setParking(list.find((p) => p.id === parkingId) || list[0]);
      }
    };
    loadParking();
    const load = async () => {
      setLoadingPred(true);
      try {
        const data = await api.getPredictions(parkingId, 24);
        // recharts expects occupancyRate field already; api normalizes it
        setPredictionData(data as any);
      } catch (e) {
        setPredictionData([]);
      } finally {
        setLoadingPred(false);
      }
    };
    load();
  }, [parkingId]);

  const getOccupancyColor = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 30) return 'bg-green-500';
    if (rate > 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPredictionForTime = (minutes: number) => {
    if (!predictionData || predictionData.length === 0) {
      return { occupancyRate: 70, confidence: 80 };
    }
    const hourIndex = Math.floor(minutes / 60);
    if (hourIndex >= predictionData.length) return predictionData[predictionData.length - 1];
    return predictionData[hourIndex];
  };

  const prediction = getPredictionForTime(parseInt(selectedTime));
  const total = parking.totalSpaces || 0;
  const estimatedAvailable = total > 0 ? Math.max(0, Math.round(total * (100 - (prediction.occupancyRate || 0)) / 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1>주차장 상세</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-24">
        {/* Parking Info Header */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl">{parking.name}</h2>
                {parking.type === 'public' && (
                  <Badge variant="outline" className="bg-white">공영</Badge>
                )}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 mt-0.5" />
                <p>{parking.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">현재 주차 가능</span>
              <span className={`w-3 h-3 rounded-full ${getOccupancyColor(parking.availableSpaces, parking.totalSpaces)} animate-pulse`}></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl text-blue-600">{parking.availableSpaces}</span>
              <span className="text-gray-500">/ {parking.totalSpaces} 대</span>
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${(parking.availableSpaces / parking.totalSpaces) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* AI Prediction Section */}
        <Card className="m-4 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3>AI 주차 수요 예측</h3>
          </div>

          <div className="mb-4">
            <Label className="mb-2 block text-sm">도착 예정 시간</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15분 후</SelectItem>
                <SelectItem value="30">30분 후</SelectItem>
                <SelectItem value="60">1시간 후</SelectItem>
                <SelectItem value="120">2시간 후</SelectItem>
                <SelectItem value="180">3시간 후</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">{selectedTime}분 후 예상 가능 공간</p>
                <p className="text-2xl text-blue-600">약 {estimatedAvailable}대</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">AI 신뢰도</p>
                <p className="text-lg">{prediction.confidence}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <AlertCircle className="w-3 h-3" />
              <span>실시간 데이터 기반 예측 결과입니다</span>
            </div>
          </div>

          <Tabs defaultValue="hourly" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hourly">시간대별</TabsTrigger>
              <TabsTrigger value="occupancy">점유율</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hourly" className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={predictionData.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: any) => [`${value}%`, '점유율']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="occupancyRate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="occupancy" className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={predictionData.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: any) => [`${value}%`, '점유율']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="occupancyRate" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Parking Details */}
        <Card className="m-4 p-4">
          <h3 className="mb-4">주차장 정보</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">운영 시간</p>
                <p className="whitespace-pre-wrap text-sm">{parking.operatingHours}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">주차 요금 ({parking.fee.type || '정보없음'})</p>
                <div className="space-y-1 text-sm">
                  <p>기본: {parking.fee.basic?.toLocaleString() ?? 0}원 ({parking.fee.basicTime ?? 0}분)</p>
                  <p>추가: {parking.fee.additional?.toLocaleString() ?? 0}원 ({parking.fee.additionalTime ?? 0}분)</p>
                  {parking.fee.daily ? <p>1일 주차권: {parking.fee.daily.toLocaleString()}원</p> : null}
                  {parking.fee.monthly ? <p>월 정기권: {parking.fee.monthly.toLocaleString()}원</p> : null}
                  {parking.paymentMethods && <p className="text-gray-500 mt-1 text-xs">결제: {parking.paymentMethods}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Navigation2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">거리</p>
                <p>현재 위치에서 {realDistance !== null ? `${realDistance}km` : (parking.distance ? `${parking.distance}km` : '계산 중...')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">문의</p>
                <p className="text-blue-600">{parking.phone || '-'}</p>
                {parking.managingOrg && <p className="text-xs text-gray-400 mt-1">관리: {parking.managingOrg}</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Amenities */}
        <Card className="m-4 p-4">
          <h3 className="mb-3">편의 시설 및 정보</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {parking.facilities && parking.facilities.length > 0 ? (
              parking.facilities.map((fac: string, idx: number) => (
                <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {fac}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-500">등록된 편의시설 정보가 없습니다.</span>
            )}
          </div>
          {parking.feeInfo && (
             <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
               <p className="font-semibold mb-1">특이사항</p>
               {parking.feeInfo}
             </div>
          )}
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => {
            const url = `https://map.kakao.com/link/to/${parking.name},${parking.latitude},${parking.longitude}`;
            window.open(url, '_blank');
          }}>
            <Navigation2 className="w-4 h-4 mr-2" />
            길 안내
          </Button>
          <Button className="flex-1" onClick={onStartParking}>
            <Calendar className="w-4 h-4 mr-2" />
            주차 시작
          </Button>
        </div>
      </div>
    </div>
  );
}
