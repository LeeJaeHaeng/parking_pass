import { useState, useEffect, useMemo } from 'react';
import { Car, MapPin, Clock, DollarSign, Navigation2, StopCircle, Sparkles, Navigation, Info } from 'lucide-react';
import { mockParkingLots, mockVehicle } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { KakaoMap } from '../components/KakaoMap';

interface MyParkingPageProps {
  onPayment: () => void;
}

export default function MyParkingPage({ onPayment }: MyParkingPageProps) {
  const [isParking, setIsParking] = useState(true);
  const [parkingDuration, setParkingDuration] = useState(0);
  const [currentFee, setCurrentFee] = useState(0);

  const currentParking = mockParkingLots[0];
  
  if (!currentParking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white rounded-3xl shadow-sm border-none">
          <Car className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-bold mb-2">주차장 정보를 불러올 수 없습니다</h2>
          <p className="text-gray-500 text-sm">데이터를 확인 중입니다...</p>
        </Card>
      </div>
    );
  }

  const parkingStartTime = useMemo(() => {
    const start = new Date();
    start.setHours(start.getHours() - 1);
    start.setMinutes(start.getMinutes() - 23);
    return start;
  }, []);

  useEffect(() => {
    if (!isParking) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - parkingStartTime.getTime()) / 1000);
      setParkingDuration(diff);

      const minutes = Math.floor(diff / 60);
      const basicTime = 30;
      const additionalTime = 10;

      if (minutes <= basicTime) {
        setCurrentFee(currentParking.fee.basic);
      } else {
        const additionalMinutes = minutes - basicTime;
        const additionalFee = Math.ceil(additionalMinutes / additionalTime) * currentParking.fee.additional;
        setCurrentFee(currentParking.fee.basic + additionalFee);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isParking, parkingStartTime]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleEndParking = () => {
    setIsParking(false);
    onPayment();
  };

  if (!isParking) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        {/* Simple Header for Empty State */}
        <div className="bg-white/80 sticky top-0 z-20 px-4 py-4 border-b border-gray-100 backdrop-blur-md">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="premium-gradient p-1.5 rounded-xl shadow-lg shadow-blue-200">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">내 주차</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-12 text-center border-none shadow-none bg-transparent">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold mb-2">주차 중인 차량이 없습니다</h2>
            <p className="text-gray-500 text-sm mb-8">주차장 상세 페이지에서 주차를 시작하세요</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-gray-100 backdrop-blur-md bg-white/80">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="premium-gradient p-1.5 rounded-xl shadow-lg shadow-blue-200">
               <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">내 주차 정보</h1>
              <p className="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-0.5">Parking Active</p>
            </div>
          </div>
          <Badge className="bg-green-500 text-white border-0 py-1.5">실시간 주차 중</Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 pb-24">
        {/* Vehicle Info Card */}
        <div className="glass-card p-5 premium-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Car size={80} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Car className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">차량 번호</p>
              <p className="text-xl font-bold text-gray-900 leading-none">{mockVehicle.licensePlate}</p>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">{mockVehicle.model}  {mockVehicle.color}</p>
            </div>
          </div>
        </div>

        {/* Parking Duration Card */}
        <Card className="p-8 border-none shadow-sm bg-white relative overflow-hidden text-center">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-[0.2em] mb-3">현재 주차 시간</p>
          <p className="text-5xl font-black text-slate-800 tracking-wider tabular-nums mb-8">
            {formatDuration(parkingDuration)}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">입차 시간</p>
              <p className="font-bold text-gray-900">{formatTime(parkingStartTime)}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">실시간 요금</p>
              <p className="font-bold text-blue-600">{currentFee.toLocaleString()}원</p>
            </div>
          </div>
        </Card>

        {/* Parking Location */}
        <div className="glass-card p-5 premium-shadow">
          <div className="flex items-start gap-4 mb-5">
            <div className="bg-blue-50 p-3 rounded-xl shrink-0">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{currentParking.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{currentParking.address}</p>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12 rounded-xl border-gray-100 hover:bg-gray-50 font-semibold group">
                <Navigation2 className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                지도로 차량 위치 보기
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl h-auto flex flex-col border-none p-0 overflow-hidden">
              <div className="p-6 bg-white shrink-0">
                <SheetHeader className="mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <SheetTitle className="text-lg">차량 위치 확인</SheetTitle>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{currentParking.name}</p>
                </SheetHeader>
              </div>
              <div className="w-full h-[24rem] relative">
                 <KakaoMap 
                    parkingLots={[currentParking]} 
                    targetLocation={{
                        lat: currentParking.latitude!,
                        lon: currentParking.longitude!,
                        name: '내 차량'
                    }}
                    height="100%"
                 />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Fee Info - Summary Style */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-gray-400" />
            <h3 className="font-bold text-gray-900">요금 산정 방식</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
              <span className="text-gray-600 font-medium">기본 ({currentParking.fee.basicTime || 30}분)</span>
              <span className="font-bold">{currentParking.fee.basic.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
              <span className="text-gray-600 font-medium">추가 ({currentParking.fee.additionalTime || 10}분당)</span>
              <span className="font-bold">{currentParking.fee.additional.toLocaleString()}원</span>
            </div>
            
            <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">현재까지 추가 요금</span>
                <span className="font-semibold">{(currentFee - currentParking.fee.basic).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-900">총 예상 결제 금액</span>
                <span className="font-black text-blue-600">{currentFee.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full h-16 text-lg font-black rounded-2xl premium-gradient border-none shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] group" size="lg">
                <StopCircle className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform" />
                주차 종료 및 결제하기
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">주차를 종료하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription className="text-base text-gray-600">
                  <span className="block mt-2 font-medium">주차 시간: <span className="text-blue-600 font-bold">{formatDuration(parkingDuration)}</span></span>
                  <span className="block mt-1 font-medium">총 요금: <span className="text-blue-600 font-bold">{currentFee.toLocaleString()}원</span></span>
                  <span className="block mt-4 text-sm text-gray-400">종료 버튼 클릭 시 결제 단계로 이동합니다.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 mt-6">
                <AlertDialogCancel className="rounded-xl h-12 border-gray-100 flex-1">취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndParking} className="rounded-xl h-12 bg-blue-600 hover:bg-blue-700 flex-1">
                  종료 및 결제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
