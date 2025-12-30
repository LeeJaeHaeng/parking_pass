import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Phone, Navigation2, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { mockParkingLots, generatePredictionData } from '../data/mockData';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface ParkingDetailPageProps {
  parkingId: number;
  onBack: () => void;
  onStartParking: () => void;
}

export default function ParkingDetailPage({ parkingId, onBack, onStartParking }: ParkingDetailPageProps) {
  const [selectedTime, setSelectedTime] = useState('30');
  const [predictionData, setPredictionData] = useState(generatePredictionData(parkingId));
  const [loadingPred, setLoadingPred] = useState(false);
  const parking = mockParkingLots.find(lot => lot.id === parkingId) || mockParkingLots[0];

  useEffect(() => {
    const load = async () => {
      setLoadingPred(true);
      try {
        const data = await api.getPredictions(parkingId, 24);
        // recharts expects occupancyRate field already; api normalizes it
        setPredictionData(data as any);
      } catch (e) {
        setPredictionData(generatePredictionData(parkingId));
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
    const hourIndex = Math.floor(minutes / 60);
    if (hourIndex >= predictionData.length) return predictionData[predictionData.length - 1];
    return predictionData[hourIndex];
  };

  const prediction = getPredictionForTime(parseInt(selectedTime));
  const estimatedAvailable = Math.round(parking.totalSpaces * (100 - prediction.occupancyRate) / 100);

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
                <p>{parking.operatingHours}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">주차 요금</p>
                <p>기본 {parking.fee.basic.toLocaleString()}원 (30분)</p>
                <p className="text-sm text-gray-500">추가 {parking.fee.additional.toLocaleString()}원 / 10분</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Navigation2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">거리</p>
                <p>현재 위치에서 {parking.distance}km</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">문의</p>
                <p className="text-blue-600">041-XXX-XXXX</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Amenities */}
        <Card className="m-4 p-4">
          <h3 className="mb-3">편의 시설</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">CCTV</Badge>
            <Badge variant="outline">여성 우선 주차</Badge>
            <Badge variant="outline">장애인 주차</Badge>
            <Badge variant="outline">전기차 충전</Badge>
            <Badge variant="outline">실내 주차</Badge>
          </div>
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
