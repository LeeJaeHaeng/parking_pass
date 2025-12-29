import { useState, useEffect, useMemo } from 'react';
import { Car, MapPin, Clock, DollarSign, Navigation2, StopCircle } from 'lucide-react';
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

interface MyParkingPageProps {
  onPayment: () => void;
}

export default function MyParkingPage({ onPayment }: MyParkingPageProps) {
  const [isParking, setIsParking] = useState(true);
  const [parkingDuration, setParkingDuration] = useState(0);
  const [currentFee, setCurrentFee] = useState(0);

  const currentParking = mockParkingLots[0];
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

      // Calculate fee
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl mb-2">주차 중인 차량이 없습니다</h2>
          <p className="text-gray-600 text-sm mb-6">주차장 상세 페이지에서 주차를 시작하세요</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="max-w-lg mx-auto">
          <p className="text-sm opacity-90 mb-1">현재 주차 중</p>
          <h1 className="text-xl mb-4">내 주차 정보</h1>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm opacity-90">차량 번호</p>
                  <p className="text-lg">{mockVehicle.licensePlate}</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">주차 중</Badge>
            </div>
            <div className="text-sm opacity-90">
              <p>{mockVehicle.model} · {mockVehicle.color}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Parking Duration Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">주차 시간</p>
            <p className="text-4xl text-blue-600 tracking-wider tabular-nums">
              {formatDuration(parkingDuration)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">시작 시간</p>
              <p className="text-lg">{formatTime(parkingStartTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">예상 요금</p>
              <p className="text-lg text-blue-600">{currentFee.toLocaleString()}원</p>
            </div>
          </div>
        </Card>

        {/* Parking Location */}
        <Card className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="mb-1">{currentParking.name}</h3>
              <p className="text-sm text-gray-600">{currentParking.address}</p>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <Navigation2 className="w-4 h-4 mr-2" />
            주차 위치 확인
          </Button>
        </Card>

        {/* Parking Details */}
        <Card className="p-4">
          <h3 className="mb-4">주차 정보</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">운영 시간</span>
              </div>
              <span className="text-sm">{currentParking.operatingHours}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">기본 요금</span>
              </div>
              <span className="text-sm">{currentParking.fee.basic.toLocaleString()}원 (30분)</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">추가 요금</span>
              </div>
              <span className="text-sm">{currentParking.fee.additional.toLocaleString()}원 / 10분</span>
            </div>
          </div>
        </Card>

        {/* Fee Breakdown */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="mb-3">요금 안내</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">기본 요금 (30분)</span>
              <span>{currentParking.fee.basic.toLocaleString()}원</span>
            </div>
            {parkingDuration > 1800 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  추가 요금 ({Math.floor((parkingDuration - 1800) / 60)}분)
                </span>
                <span>{(currentFee - currentParking.fee.basic).toLocaleString()}원</span>
              </div>
            )}
            <div className="border-t border-yellow-300 pt-2 mt-2 flex justify-between">
              <span>현재 예상 요금</span>
              <span className="text-lg text-blue-600">{currentFee.toLocaleString()}원</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" size="lg">
                <StopCircle className="w-5 h-5 mr-2" />
                주차 종료 및 결제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>주차를 종료하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  주차 시간: {formatDuration(parkingDuration)}<br />
                  예상 요금: {currentFee.toLocaleString()}원<br /><br />
                  종료 후 결제 페이지로 이동합니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndParking}>
                  종료 및 결제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" className="w-full">
            주차 연장 알림 설정
          </Button>
        </div>
      </div>
    </div>
  );
}
