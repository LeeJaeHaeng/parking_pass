import { useState } from 'react';
import { ChevronRight, Car, CreditCard, Bell, Settings, CircleHelp, LogOut, Award, Clock, User, Phone, Mail, Plus, Trash2, Check, FileText, Shield } from 'lucide-react';
import { mockVehicle } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch'; // Switch 컴포넌트가 있다면 (없으면 아래 div로 구현)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
  SheetDescription
} from '../components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '../components/ui/dialog';

interface MyPageProps {
  onHistoryClick: () => void;
  onLogout: () => void;
}

export default function MyPage({ onHistoryClick, onLogout }: MyPageProps) {
  const [userProfile, setUserProfile] = useState({ name: '홍길동', email: 'hong@example.com' });
  const [tempName, setTempName] = useState(userProfile.name);
  const [notifications, setNotifications] = useState({ marketing: true, parking: true, bill: false });
  const [vehicles, setVehicles] = useState([mockVehicle]);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: '신한카드', number: '1234-****-****-5678', isDefault: true },
    { id: 2, name: '카카오페이', number: '연동됨', isDefault: false }
  ]);

  const totalParkingCount = 47;
  const totalSpent = 142500;

  const handleUpdateProfile = () => {
    setUserProfile(prev => ({ ...prev, name: tempName }));
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatMoney = (amount: number) => {
    if (amount >= 10000) {
        const man = Math.floor(amount / 10000);
        const rest = amount % 10000;
        return rest > 0 ? `${man}만 ${rest.toLocaleString()}원` : `${man}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-8">
        <div className="max-w-lg mx-auto p-4">
          <h1 className="text-xl mb-6 font-bold">마이페이지</h1>
          
          {/* User Profile */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarFallback className="bg-blue-500 text-white text-xl font-bold">
                  {userProfile.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">{userProfile.name}</h2>
                <p className="text-sm opacity-90">{userProfile.email}</p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => setTempName(userProfile.name)}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>프로필 수정</DialogTitle>
                    <DialogDescription>앱에서 사용할 이름을 설정합니다.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                       <Label htmlFor="name">이름</Label>
                       <Input id="name" value={tempName} onChange={(e) => setTempName(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button onClick={handleUpdateProfile}>저장</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center transition-colors hover:bg-white/20">
                <p className="text-sm opacity-90 mb-1">총 이용 횟수</p>
                <p className="text-xl font-bold">{totalParkingCount}회</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center transition-colors hover:bg-white/20">
                <p className="text-sm opacity-90 mb-1">누적 결제</p>
                <p className="text-xl font-bold tracking-tight text-yellow-300">
                  {formatMoney(totalSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto -mt-4 px-4 space-y-4">
        {/* Vehicle Info */}
        <Sheet>
          <SheetTrigger asChild>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">등록 차량</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Car className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 font-medium">{vehicles[0].licensePlate}</p>
                  <p className="text-sm text-gray-600">{vehicles[0].model} · {vehicles[0].color}</p>
                </div>
                <Badge variant="outline" className="bg-white">대표차량</Badge>
              </div>
            </Card>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl h-[80vh]">
            <SheetHeader>
               <SheetTitle>차량 관리</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
               {vehicles.map((v, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-white shadow-sm">
                    <Car className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                       <p className="font-bold text-lg">{v.licensePlate}</p>
                       <p className="text-sm text-gray-500">{v.model} | {v.color}</p>
                    </div>
                    {i === 0 ? <Badge>대표</Badge> : (
                      <Button variant="ghost" size="icon" className="text-red-500">
                         <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                 </div>
               ))}
               <Button variant="outline" className="w-full h-12 border-dashed border-2">
                 <Plus className="w-5 h-5 mr-2" />
                 차량 추가하기
               </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Menu Items */}
        <Card className="divide-y overflow-hidden">
            {/* 이용 내역 */}
            <button
              onClick={onHistoryClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="flex-1 text-left">이용 내역</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 결제 수단 관리 */}
            <Sheet>
               <SheetTrigger asChild>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="flex-1 text-left">결제 수단 관리</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
               </SheetTrigger>
               <SheetContent side="bottom" className="rounded-t-xl h-auto min-h-[50vh]">
                 <SheetHeader>
                    <SheetTitle>결제 수단 관리</SheetTitle>
                 </SheetHeader>
                 <div className="py-6 space-y-3">
                   {paymentMethods.map(pm => (
                     <div key={pm.id} className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pm.id === 1 ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                             <CreditCard className={`w-5 h-5 ${pm.id === 1 ? 'text-blue-600' : 'text-yellow-600'}`} />
                           </div>
                           <div>
                              <p className="font-medium">{pm.name}</p>
                              <p className="text-xs text-gray-500">{pm.number}</p>
                           </div>
                        </div>
                        {pm.isDefault && <Badge variant="secondary">기본</Badge>}
                     </div>
                   ))}
                   <Button className="w-full mt-4">카드 등록하기</Button>
                 </div>
               </SheetContent>
            </Sheet>

            {/* 알림 설정 */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="flex-1 text-left">알림 설정</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">ON</Badge>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl h-auto">
                 <SheetHeader>
                   <SheetTitle>알림 설정</SheetTitle>
                 </SheetHeader>
                 <div className="py-6 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <Label className="text-base">마케팅 알림</Label>
                          <p className="text-sm text-gray-500">할인 및 이벤트 소식 받기</p>
                       </div>
                       <div 
                         className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${notifications.marketing ? 'bg-blue-600' : 'bg-gray-200'}`}
                         onClick={() => toggleNotification('marketing')}
                       >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.marketing ? 'translate-x-5' : 'translate-x-0'}`} />
                       </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <Label className="text-base">주차 현황 알림</Label>
                          <p className="text-sm text-gray-500">입출차 및 요금 알림</p>
                       </div>
                       <div 
                         className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${notifications.parking ? 'bg-blue-600' : 'bg-gray-200'}`}
                         onClick={() => toggleNotification('parking')}
                       >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.parking ? 'translate-x-5' : 'translate-x-0'}`} />
                       </div>
                    </div>
                 </div>
              </SheetContent>
            </Sheet>

            {/* 할인 혜택 */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <Award className="w-5 h-5 text-gray-600" />
                  <span className="flex-1 text-left">할인 혜택</span>
                  <Badge variant="secondary" className="text-xs text-red-600 bg-red-100 font-bold">NEW</Badge>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl h-[60vh]">
                 <SheetHeader>
                   <SheetTitle>보유 쿠폰</SheetTitle>
                 </SheetHeader>
                 <div className="py-4 space-y-3">
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                       <div>
                          <p className="font-bold text-blue-700">신규 가입 환영 쿠폰</p>
                          <p className="text-xs text-gray-500">2000원 할인 (조건 없음)</p>
                       </div>
                       <Button size="sm" className="bg-blue-600">사용 가능</Button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center opacity-60">
                       <div>
                          <p className="font-bold text-gray-700">첫 결제 감사 쿠폰</p>
                          <p className="text-xs text-gray-500">10% 할인 (최대 3000원)</p>
                       </div>
                       <Button size="sm" variant="outline" disabled>사용 완료</Button>
                    </div>
                 </div>
              </SheetContent>
            </Sheet>
        </Card>

        {/* Settings */}
        <Card className="divide-y overflow-hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left">환경 설정</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl h-auto">
              <SheetHeader>
                <SheetTitle>환경 설정</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span>앱 버전</span>
                  <span className="text-gray-500">v1.0.0</span>
                </div>
                <div className="flex justify-between items-center">
                   <span>캐시 삭제</span>
                   <Button variant="outline" size="sm">삭제</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <CircleHelp className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left">고객센터</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>고객센터</DialogTitle>
                  <DialogDescription>
                     궁금한 점이 있으신가요? 언제든 연락주세요.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                     <Phone className="w-5 h-5 text-blue-600" />
                     <div className="flex-1">
                        <p className="text-sm font-medium">전화 문의</p>
                        <p className="text-lg font-bold">1588-0000</p>
                     </div>
                     <Button variant="outline" size="sm">전화하기</Button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                     <Mail className="w-5 h-5 text-blue-600" />
                     <div className="flex-1">
                        <p className="text-sm font-medium">이메일 문의</p>
                        <p className="text-sm">help@cheonanparking.com</p>
                     </div>
                     <Button variant="outline" size="sm">메일쓰기</Button>
                  </div>
               </div>
               <DialogFooter>
                  <DialogClose asChild><Button className="w-full">닫기</Button></DialogClose>
               </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>

        {/* App Info */}
        <Card className="p-4">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>앱 버전</span>
              <span>1.0.0</span>
            </div>
            <Separator />
            <Sheet>
               <SheetTrigger asChild>
                <button className="w-full flex justify-between pt-1 hover:text-blue-600">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>이용약관</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
               </SheetTrigger>
               <SheetContent className="overflow-y-auto">
                 <SheetHeader>
                   <SheetTitle>이용약관</SheetTitle>
                   <SheetDescription>2025년 3월 1일 시행</SheetDescription>
                 </SheetHeader>
                 <div className="py-4 text-sm text-gray-600 space-y-4">
                   <p><strong>제 1 조 (목적)</strong><br />본 약관은 천안 AI 파킹 패스(이하 "회사")가 제공하는 서비스 이용에 관한 권리 및 의무를 규정합니다.</p>
                   <p><strong>제 2 조 (용어의 정의)</strong><br />① "서비스"란 회사가 제공하는 주차장 정보, 결제 등 제반 서비스를 의미합니다.</p>
                   {/* ... 더미 텍스트 ... */}
                 </div>
               </SheetContent>
            </Sheet>

            <Sheet>
               <SheetTrigger asChild>
                <button className="w-full flex justify-between hover:text-blue-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>개인정보 처리방침</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
               </SheetTrigger>
               <SheetContent className="overflow-y-auto">
                 <SheetHeader>
                   <SheetTitle>개인정보 처리방침</SheetTitle>
                   <SheetDescription>고객님의 소중한 정보를 안전하게 보호합니다.</SheetDescription>
                 </SheetHeader>
                 <div className="py-4 text-sm text-gray-600 space-y-4">
                   <p><strong>1. 수집하는 개인정보 항목</strong><br />이름, 전화번호, 차량번호, 이메일, 결제 정보 등</p>
                   <p><strong>2. 개인정보의 수집 및 이용 목적</strong><br />서비스 이용에 따른 본인 확인, 개인 식별, 불량 회원의 부정 이용 방지 등</p>
                 </div>
               </SheetContent>
            </Sheet>
          </div>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full mb-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>천안 AI 파킹 패스</p>
          <p className="mt-1">Cheonan AI Parking Pass</p>
          <p className="mt-2">© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
