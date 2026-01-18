import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  DollarSign, 
  Phone, 
  Navigation2, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import parkingLotsSource from '../data/parkingLots.json';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ReferenceLine
} from 'recharts';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getOccupancyBadgeClass, getOccupancyBarClass, getOccupancyStatus } from '../utils/parking';
import { generatePredictionData } from '../data/mockData';

interface ParkingDetailPageProps {
  parkingId: string;
  onBack: () => void;
  onStartParking: () => void;
}

export default function ParkingDetailPage({ parkingId, onBack, onStartParking }: ParkingDetailPageProps) {
  const [selectedTime, setSelectedTime] = useState('30');
  const [weather, setWeather] = useState<{ temperature: number; condition: string; precipitationProbability: number } | null>(null);
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
    const fetchWeather = async () => { try { const data = await api.getWeather(); setWeather(data); } catch { setWeather(null); } };
    fetchWeather();
    const load = async () => {
      setLoadingPred(true);
      try {
        const data = await api.getPredictions(parkingId, 24);
        if (data && data.length > 0) {
          setPredictionData(data as any);
        } else {
          setPredictionData(
            generatePredictionData(parkingId, { hoursAhead: 24, weather: weather || undefined })
          );
        }
      } catch (e) {
        console.error("그래프 데이터 로드 실패:", e);
        setPredictionData(
          generatePredictionData(parkingId, { hoursAhead: 24, weather: weather || undefined })
        );
      } finally {
        setLoadingPred(false);
      }
    };
    load();
  }, [parkingId]);

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F8FAFC]"
    >
      {/* Premium Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={onBack}
              className="rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 border-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">주차장 상세</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">실시간 분석</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-gray-400"
          >
            <AlertCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-10">
        {/* Dynamic Header Section */}
        <div className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl opacity-60" />
          
          <div className="relative mb-6">
            <div className="flex items-center gap-2 mb-3">
                {parking.type === 'public' && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">공영</Badge>
                )}
                <Badge className="bg-indigo-50 text-indigo-600 border-0 text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">AI 인증</Badge>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight uppercase tracking-tight">{parking.name}</h2>
            <div className="flex items-start gap-1.5 text-sm text-gray-500 font-medium">
              <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              <p>{parking.address}</p>
            </div>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card rounded-3xl p-6 premium-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
               <Zap className="w-12 h-12 text-blue-500/5" />
            </div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">남은 공간</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-gray-900 tracking-tighter">{parking.availableSpaces}</span>
                  <span className="text-lg font-bold text-gray-300">/ {parking.totalSpaces}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                  getOccupancyBadgeClass(parking.availableSpaces ?? 0, parking.totalSpaces || 1)
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    getOccupancyBarClass(parking.availableSpaces ?? 0, parking.totalSpaces || 1)
                  }`} />
                  {getOccupancyStatus(parking.availableSpaces ?? 0, parking.totalSpaces || 1)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(parking.availableSpaces / parking.totalSpaces) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full premium-gradient shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>0%</span>
                <span>수용률</span>
                <span>100%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Analysis Segment */}
        <div className="px-6 mb-8">
          <Card className="rounded-[2.5rem] p-8 border-0 shadow-xl shadow-blue-500/5 bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8">
                <Sparkles className="w-8 h-8 text-blue-100" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
                 <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">AI 수요 분석 및 예측</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">AI 예측 정보</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-4">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">도착 예정 시간</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="rounded-2xl border-gray-100 bg-gray-50 h-14 font-bold text-gray-900 focus:ring-blue-100 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-gray-100 shadow-2xl z-[100] bg-white">
                    <SelectItem value="15">15분 후에 도착</SelectItem>
                    <SelectItem value="30">30분 후에 도착</SelectItem>
                    <SelectItem value="60">1시간 후에 도착</SelectItem>
                    <SelectItem value="120">2시간 후에 도착</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gray-50 rounded-[1.75rem] p-5 flex flex-col justify-center border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">예상 여유</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-600 tracking-tighter">약 {estimatedAvailable}</span>
                  <span className="text-xs font-bold text-gray-400">대</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 rounded-3xl p-6 text-white mb-8 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
               <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck size={120} />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">AI 신뢰도 점수</span>
                    <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">높은 신뢰도</Badge>
                 </div>
                 <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black tracking-tighter">{prediction.confidence}</span>
                    <span className="text-xl font-bold opacity-70">%</span>
                 </div>
                 <p className="text-xs font-medium opacity-90 leading-relaxed">
                    천안시 불법주정차 핫스팟과 현재 날씨 조건을 결합하여 산출된 정밀 예측값입니다.
                 </p>
               </div>
            </div>

            <div className="mb-6 overflow-hidden">
              <Tabs defaultValue="hourly" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-50 rounded-2xl p-1 mb-6">
                  <TabsTrigger value="hourly" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">시간별 추이</TabsTrigger>
                  <TabsTrigger value="occupancy" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">점유율</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hourly" className="mt-0 min-h-[220px] relative">
                  {loadingPred && predictionData.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                      패턴 분석 중...
                    </div>
                  ) : predictionData.length > 0 ? (
                    <div className={`h-[220px] w-full transition-opacity duration-300 ${loadingPred ? 'opacity-50' : 'opacity-100'}`}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={predictionData.slice(0, 12)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                             <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} 
                            domain={[0, 100]} 
                          />
                          <Tooltip 
                            cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                            contentStyle={{ 
                              border: 0, 
                              borderRadius: '16px', 
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '12px'
                            }}
                            formatter={(value: any) => [`${value}%`, '예상 점유율']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="occupancyRate" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                          />
                          <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '혼잡', position: 'right', fill: '#EF4444', fontSize: 10, fontWeight: 'bold' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 italic">
                      데이터를 불러올 수 없습니다
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="occupancy" className="mt-0 min-h-[220px] relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={predictionData.slice(0, 12)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ border: 0, borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="occupancyRate" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorOcc)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-gray-50 rounded-[1.75rem] p-5">
               <div className="flex items-center gap-2 mb-4">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">AI 분석 요인</span>
               </div>
               <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white text-gray-600 border-gray-100 text-[9px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {weather?.condition === 'rainy' ? '우천 영향 가중치 적용' : '양호한 기상 조건'}
                  </Badge>
                  <Badge className="bg-white text-gray-600 border-gray-100 text-[9px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                    인근 불법주정차 단속 데이터 기반
                  </Badge>
                  <Badge className="bg-white text-gray-600 border-gray-100 text-[9px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                    시간대별 혼잡 패턴 분석
                  </Badge>
               </div>
            </div>
          </Card>
        </div>

        {/* Details Segment */}
        <div className="px-6 space-y-4">
          <Card className="rounded-3xl border-0 shadow-sm p-6 space-y-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">기본 정보</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">운영 시간</p>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">{parking.operatingHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">요금 체계</p>
                    <Badge variant="outline" className="text-[10px] font-bold border-gray-100">{parking.fee.type || '표준'}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-1.5 mb-1.5">
                      <span className="text-gray-500 font-medium">회차시간 (무료)</span>
                      <span className="font-bold text-green-600">{parking.fee.gracePeriod ?? 0}분</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">기본 ({parking.fee.basicTime ?? 30}분)</span>
                      <span className="font-bold text-gray-900">{parking.fee.basic?.toLocaleString() ?? 0}원</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">추가 ({parking.fee.additionalTime ?? 10}분)</span>
                      <span className="font-bold text-gray-900">{parking.fee.additional?.toLocaleString() ?? 0}원</span>
                    </div>
                    {parking.fee.daily ? (
                      <div className="flex justify-between items-center text-sm pt-1.5 border-t border-gray-50">
                        <span className="text-gray-500 font-medium">1일 최대</span>
                        <span className="font-bold text-blue-600">{parking.fee.daily.toLocaleString()}원</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">연락처</p>
                  <p className="text-sm font-bold text-blue-600 underline decoration-blue-100 decoration-2 underline-offset-4">{parking.phone || '정보 없음'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Amenities with Premium Look */}
          <Card className="rounded-3xl border-0 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5">
               <Info className="w-16 h-16" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 mb-6">편의 시설 및 태그</h3>
            <div className="flex flex-wrap gap-2.5">
              {parking.facilities && parking.facilities.length > 0 ? (
                parking.facilities.map((fac: string, idx: number) => (
                  <Badge key={idx} className="bg-white text-gray-600 border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:border-blue-200 transition-colors">
                    {fac}
                  </Badge>
                ))
              ) : !parking.feeInfo ? (
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">제공되는 추가 정보가 없습니다</p>
              ) : null}
            </div>
            {parking.feeInfo && (
               <div className="mt-6 p-4 bg-gray-50 rounded-2xl border-l-[4px] border-blue-500 font-medium text-xs text-gray-500 leading-loose">
                 {parking.feeInfo}
               </div>
            )}
          </Card>
        </div>


          {/* Futuristic Action Bar - Now part of flow at the bottom */}
          <div className="mt-8 pb-12 px-6">
            <div className="glass-card rounded-[2rem] p-3 flex gap-3 premium-shadow ring-1 ring-white/20">
              <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-600 font-bold text-sm tracking-tight transition-all active:scale-95"
                onClick={() => {
                  const url = `https://map.kakao.com/link/to/${parking.name},${parking.latitude},${parking.longitude}`;
                  window.open(url, '_blank');
                }}
              >
                <Navigation2 className="w-5 h-5 mr-2" />
                길 안내
              </Button>
              <Button 
                className="flex-[1.5] h-14 rounded-2xl premium-gradient text-white font-black text-sm tracking-tight shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                onClick={onStartParking}
              >
                <Calendar className="w-5 h-5 mr-2" />
                주차 예약 및 시작
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
}
