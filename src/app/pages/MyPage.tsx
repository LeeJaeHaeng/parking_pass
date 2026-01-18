import { useState } from 'react';
import { ChevronRight, Car, CreditCard, Bell, Settings, CircleHelp, LogOut, Award, Clock, User, Phone, Mail, Plus, Trash2, Check, FileText, Shield, Sparkles } from 'lucide-react';
import { mockVehicle } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  user: any; // App.tsx의 User 타입과 맞추기 위해 any 사용 (순환 참조 방지 또는 별도 types.ts 필요)
  onHistoryClick: () => void;
  onLogout: () => void;
}

export default function MyPage({ user, onHistoryClick, onLogout }: MyPageProps) {
  const [userProfile, setUserProfile] = useState({ 
      name: user?.name || '사용자', 
      email: user?.email || 'user@example.com', 
      phone: '010-0000-0000' 
  });
  const [tempProfile, setTempProfile] = useState(userProfile);
  const [notifications, setNotifications] = useState({ marketing: true, parking: true, bill: false });
  
  // App.tsx에서 전달받은 user.vehicles 사용, 없으면 빈 배열
  const [vehicles, setVehicles] = useState<any[]>(user?.vehicles || []);
  
  // App.tsx에서 전달받은 user.paymentMethods 사용, 없으면 빈 배열
  const [paymentMethods, setPaymentMethods] = useState<any[]>(user?.paymentMethods || []);

  const [coupons, setCoupons] = useState([
    { id: 'c1', name: '웰컴 할인 쿠폰', discount: 2000, type: 'fixed', expiry: '2025.12.31', used: false },
    { id: 'c2', name: '첫 주차 감사 쿠폰', discount: 10, type: 'percent', expiry: '2025.06.30', used: false }
  ]);
  
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ name: '', number: '' });
  const [historyFilter, setHistoryFilter] = useState<'all' | 'month' | 'year'>('all');
  const [newVehicle, setNewVehicle] = useState({ licensePlate: '', model: '', color: '' });

  const totalParkingCount = 0; // 아직 실제 이용 내역 연동 전
  const totalSpent = 0;

  // vehicles가 비어있을 때 처리를 위해 렌더링 시 안전장치 추가 필요
  // (아래 JSX에서 vehicles[0] 접근 시 에러 방지)
  const defaultVehicle = vehicles.find((v: any) => v.isDefault) || vehicles[0];

  const handleUpdateProfile = () => {
    setUserProfile(tempProfile);
  };

  const handleAddVehicle = () => {
    if (!newVehicle.licensePlate) return;
    setVehicles(prev => [...prev, { ...newVehicle, isDefault: false, id: `v${Date.now()}` }]);
    setNewVehicle({ licensePlate: '', model: '', color: '' });
    setIsAddVehicleOpen(false);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const setDefaultVehicle = (id: string) => {
    setVehicles(prev => prev.map(v => ({ ...v, isDefault: v.id === id })));
  };

  const handleAddPayment = () => {
    if (!newPayment.name || !newPayment.number) return;
    setPaymentMethods(prev => [...prev, {
      id: Date.now(),
      name: newPayment.name,
      number: newPayment.number,
      isDefault: false
    }]);
    setNewPayment({ name: '', number: '' });
    setIsAddPaymentOpen(false);
  };

  const setDefaultPayment = (id: number) => {
    setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: pm.id === id })));
  };

  const handleDeletePayment = (id: number) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  };

  const handleWithdrawal = () => {
    if (confirm('정말로 회원 탈퇴를 하시겠습니까? 모든 정보와 결제 내역이 삭제됩니다.')) {
      alert('회원 탈퇴가 완료되었습니다.');
      onLogout();
    }
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Premium Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-gray-100 backdrop-blur-md bg-white/80">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="premium-gradient p-1.5 rounded-xl shadow-lg shadow-blue-200">
               <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">마이페이지</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">Account Settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 mt-4">
        {/* Profile Glass Card */}
        <div className="glass-card p-6 premium-shadow border-white/60 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-5 mb-8">
            <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
              <AvatarFallback className="premium-gradient text-white text-2xl font-black">
                {userProfile.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{userProfile.name}</h2>
                <Badge className="bg-blue-100 text-blue-600 border-none font-bold text-[10px]">GOLD</Badge>
              </div>
              <p className="text-sm text-gray-500 font-medium">{userProfile.email}</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400" onClick={() => setTempProfile(userProfile)}>
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-none">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">프로필 편집</DialogTitle>
                  <DialogDescription>기본 정보를 수정할 수 있습니다.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                     <Label htmlFor="name" className="text-sm font-bold text-gray-500 ml-1">이름</Label>
                     <Input id="name" value={tempProfile.name} onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                     <Label htmlFor="email" className="text-sm font-bold text-gray-500 ml-1">이메일</Label>
                     <Input id="email" value={tempProfile.email} onChange={(e) => setTempProfile(prev => ({ ...prev, email: e.target.value }))} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                     <Label htmlFor="phone" className="text-sm font-bold text-gray-500 ml-1">전화번호</Label>
                     <Input id="phone" value={tempProfile.phone} onChange={(e) => setTempProfile(prev => ({ ...prev, phone: e.target.value }))} className="h-12 rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button onClick={handleUpdateProfile} className="w-full h-12 rounded-xl bg-blue-600">변경사항 저장</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/5 rounded-2xl p-4 transition-colors hover:bg-slate-900/10">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-0.5">이용 횟수</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-slate-800">{totalParkingCount}</p>
                <p className="text-sm font-bold text-slate-400">회</p>
              </div>
            </div>
            <div className="bg-blue-600/5 rounded-2xl p-4 transition-colors hover:bg-blue-600/10 border border-blue-600/5">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1.5 px-0.5">누적 지출</p>
              <p className="text-2xl font-black text-blue-600 tracking-tight">
                {formatMoney(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Info Card */}
        <Sheet>
          <SheetTrigger asChild>
            <div className="bg-white rounded-3xl p-5 border border-gray-100 cursor-pointer group active:scale-[0.98] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-gray-900">내 차량 관리</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Car className="w-7 h-7" />
                </div>
                <div className="flex-1 overflow-hidden">
                  {defaultVehicle ? (
                      <>
                        <p className="mb-0.5 font-black text-gray-900 text-lg">{defaultVehicle.licensePlate}</p>
                        <p className="text-sm text-gray-500 font-medium">{defaultVehicle.model} {defaultVehicle.color}</p>
                      </>
                  ) : (
                      <p className="text-gray-400 font-bold">등록된 차량이 없습니다</p>
                  )}
                </div>
                {defaultVehicle && <Badge className="bg-blue-600 text-white border-none py-1.5 rounded-lg text-[10px]">대표</Badge>}
              </div>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[80vh] border-none p-0 overflow-hidden">
            <div className="p-8 bg-white h-full flex flex-col">
              <SheetHeader className="mb-8 text-left">
                 <SheetTitle className="text-2xl font-black tracking-tight">차량 관리</SheetTitle>
                 <SheetDescription>등록된 차량 정보를 조회하고 관리합니다.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-4 overflow-y-auto">
                  {vehicles.map((v) => (
                    <div key={v.id} className={`flex items-center gap-4 p-5 border rounded-[2rem] transition-all ${v.isDefault ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50'}`}>
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                         <Car className={`w-6 h-6 ${v.isDefault ? 'text-blue-600' : 'text-slate-400'}`} />
                       </div>
                       <div className="flex-1">
                          <p className="font-black text-slate-800 text-xl tracking-tight">{v.licensePlate}</p>
                          <p className="text-sm text-slate-400 font-bold">{v.model} | {v.color}</p>
                       </div>
                       <div className="flex items-center gap-2">
                        {v.isDefault ? (
                          <Badge className="bg-blue-600 text-white border-none h-8 px-4 rounded-xl">대표차량</Badge>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setDefaultVehicle(v.id)} className="text-blue-600 font-bold">기본설정</Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteVehicle(v.id)} className="text-rose-500 hover:bg-rose-50 rounded-full h-10 w-10">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </>
                        )}
                       </div>
                    </div>
                  ))}
                  
                  <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-20 border-dashed border-2 border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:bg-slate-50 transition-colors">
                        <Plus className="w-6 h-6 mr-3" />
                        새 차량 추가하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">새 차량 등록</DialogTitle>
                        <DialogDescription>차량 정보를 정확히 입력해주세요.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label className="text-sm font-bold text-gray-500 ml-1">차량 번호</Label>
                          <Input placeholder="예: 12가 3456" value={newVehicle.licensePlate} onChange={e => setNewVehicle(prev => ({ ...prev, licensePlate: e.target.value }))} className="h-12 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-sm font-bold text-gray-500 ml-1">차종/모델</Label>
                          <Input placeholder="예: 쏘나타" value={newVehicle.model} onChange={e => setNewVehicle(prev => ({ ...prev, model: e.target.value }))} className="h-12 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-sm font-bold text-gray-500 ml-1">색상</Label>
                          <Input placeholder="예: 화이트" value={newVehicle.color} onChange={e => setNewVehicle(prev => ({ ...prev, color: e.target.value }))} className="h-12 rounded-xl" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddVehicle} className="w-full h-12 bg-blue-600 rounded-xl">등록하기</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
               </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Menu List */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            {/* 이용 내역 */}
            <button
              onClick={onHistoryClick}
              className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 group"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <Clock className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </div>
              <span className="flex-1 text-left font-bold text-gray-700">이용 내역</span>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all" />
            </button>

            {/* 공지사항 */}
            <Sheet>
               <SheetTrigger asChild>
                <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Bell className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-700">공지사항</span>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all" />
                </button>
               </SheetTrigger>
               <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[70vh] border-none p-8 overflow-y-auto">
                 <SheetHeader className="mb-8 text-left">
                    <SheetTitle className="text-2xl font-black">공지사항</SheetTitle>
                 </SheetHeader>
                 <div className="space-y-4">
                    {[
                      { title: '설 연휴 공영주차장 무료 개방 안내', date: '2025.01.10' },
                      { title: '시스템 정기 점검 안내 (1/15 02:00 ~ 04:00)', date: '2025.01.05' },
                      { title: '천안시 AI 파킹패스 1.0 정식 버전 업데이트 노트', date: '2025.01.01' }
                    ].map((notice, i) => (
                      <div key={i} className="p-5 border-b border-gray-50 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer">
                        <p className="font-bold text-gray-800 mb-1">{notice.title}</p>
                        <p className="text-xs text-gray-400">{notice.date}</p>
                      </div>
                    ))}
                 </div>
               </SheetContent>
            </Sheet>

            {/* 자주 묻는 질문 */}
            <Sheet>
               <SheetTrigger asChild>
                <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <CircleHelp className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-700">자주 묻는 질문</span>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all" />
                </button>
               </SheetTrigger>
               <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[70vh] border-none p-8 overflow-y-auto">
                 <SheetHeader className="mb-8 text-left">
                    <SheetTitle className="text-2xl font-black">자주 묻는 질문</SheetTitle>
                 </SheetHeader>
                 <div className="space-y-6">
                    {[
                      { q: '결제 수단은 어떻게 변경하나요?', a: '마이페이지 > 결제 수단 관리에서 새로운 카드를 등록하거나 기본 결제 수단을 변경하실 수 있습니다.' },
                      { q: '영수증 발급은 어디서 하나요?', a: '이용 내역 상세 보기에서 각 결제건별 영수증을 확인 및 저장하실 수 있습니다.' },
                      { q: '주차장 할인은 어떻게 적용되나요?', a: '경차, 저공해 차량 등 감면 대상 차량은 출차 시 자동으로 할인 요금이 적용됩니다.' }
                    ].map((faq, i) => (
                      <div key={i} className="space-y-2">
                        <p className="font-black text-gray-900 flex gap-2">
                          <span className="text-blue-600">Q.</span> {faq.q}
                        </p>
                        <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-600 leading-relaxed">
                          {faq.a}
                        </div>
                      </div>
                    ))}
                 </div>
               </SheetContent>
            </Sheet>

            {/* 결제 수단 관리 */}
            <Sheet>
               <SheetTrigger asChild>
                <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-700">결제 수단 관리</span>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all" />
                </button>
               </SheetTrigger>
               <SheetContent side="bottom" className="rounded-t-[2.5rem] h-auto min-h-[50vh] border-none p-8">
                 <SheetHeader className="mb-8 text-left">
                    <SheetTitle className="text-2xl font-black">결제 수단</SheetTitle>
                 </SheetHeader>
                 <div className="space-y-4">
                   {paymentMethods.map(pm => (
                      <div key={pm.id} className={`flex items-center justify-between p-5 border rounded-3xl transition-all ${pm.isDefault ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50'}`}>
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${pm.id === 1 ? 'bg-blue-600' : 'bg-yellow-400'}`}>
                              <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-lg leading-tight">{pm.name}</p>
                               <p className="text-xs text-slate-400 font-bold mt-1 tracking-wider">{pm.number}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                           {pm.isDefault ? (
                             <Badge className="bg-blue-600 text-white border-none h-7 px-3 rounded-lg font-bold">기본</Badge>
                           ) : (
                             <>
                               <Button variant="ghost" size="sm" onClick={() => setDefaultPayment(pm.id)} className="text-blue-600 font-bold">기본설정</Button>
                               <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(pm.id)} className="text-rose-500 hover:bg-rose-50 rounded-full h-10 w-10">
                                 <Trash2 className="w-5 h-5" />
                               </Button>
                             </>
                           )}
                         </div>
                      </div>
                   ))}
                    <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full h-16 rounded-2xl bg-slate-900 font-bold text-lg mt-4">새 카드 추가</Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">새 결제수단 등록</DialogTitle>
                          <DialogDescription>카드 정보를 입력해주세요.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-bold text-gray-500 ml-1">카드명</Label>
                            <Input placeholder="예: 신한카드" value={newPayment.name} onChange={e => setNewPayment(prev => ({ ...prev, name: e.target.value }))} className="h-12 rounded-xl" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-bold text-gray-500 ml-1">카드번호</Label>
                            <Input placeholder="예: 1234-****-****-5678" value={newPayment.number} onChange={e => setNewPayment(prev => ({ ...prev, number: e.target.value }))} className="h-12 rounded-xl" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddPayment} className="w-full h-12 bg-blue-600 rounded-xl">등록하기</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
               </SheetContent>
            </Sheet>

            {/* 알림 설정 */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Bell className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-700">알림 설정</span>
                  <Badge className="bg-blue-50 text-blue-600 border-none px-3 font-black text-[10px]">ON</Badge>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all ml-1" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[2.5rem] h-auto border-none p-8">
                 <SheetHeader className="mb-0 text-left">
                   <SheetTitle className="text-2xl font-black">알림 설정</SheetTitle>
                 </SheetHeader>
                 <div className="py-8 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <Label className="text-lg font-black text-slate-800">마케팅 혜택 알림</Label>
                          <p className="text-sm text-slate-400 font-medium">다양한 할인 및 제휴 정보 소식 받기</p>
                       </div>
                       <div 
                         className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${notifications.marketing ? 'bg-blue-600' : 'bg-gray-200'}`}
                         onClick={() => toggleNotification('marketing')}
                       >
                          <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${notifications.marketing ? 'translate-x-6' : 'translate-x-0'}`} />
                       </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <Label className="text-lg font-black text-slate-800">실시간 주차 현황</Label>
                          <p className="text-sm text-slate-400 font-medium">입/출차 내역 및 주차 요금 변동 안내</p>
                       </div>
                       <div 
                         className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${notifications.parking ? 'bg-blue-600' : 'bg-gray-200'}`}
                         onClick={() => toggleNotification('parking')}
                       >
                          <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${notifications.parking ? 'translate-x-6' : 'translate-x-0'}`} />
                       </div>
                    </div>
                 </div>
              </SheetContent>
            </Sheet>

            {/* 쿠폰함 */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Award className="w-5 h-5 text-gray-400 group-hover:text-amber-500" />
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-700">할인 쿠폰함</span>
                  <Badge className="bg-rose-50 text-rose-500 border-none px-3 font-black text-[10px]">NEW</Badge>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all ml-1" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[60vh] border-none p-8">
                 <SheetHeader className="mb-8 text-left">
                   <SheetTitle className="text-2xl font-black">내 쿠폰함</SheetTitle>
                 </SheetHeader>
                 <div className="space-y-4">
                    {coupons.map(coupon => (
                      <div key={coupon.id} className={`border-2 rounded-3xl p-6 relative overflow-hidden group ${coupon.used ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-blue-500 bg-blue-50/50'}`}>
                         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Award size={64} className="group-hover:rotate-12 transition-transform" />
                         </div>
                         <div className="flex justify-between items-center relative z-10">
                            <div>
                               <p className={`font-black text-lg mb-0.5 ${coupon.used ? 'text-slate-700' : 'text-blue-700'}`}>{coupon.name}</p>
                               <p className={`text-sm font-bold uppercase tracking-tight ${coupon.used ? 'text-slate-500' : 'text-blue-500'}`}>
                                 {coupon.type === 'fixed' ? `${coupon.discount.toLocaleString()} KRW OFF` : `${coupon.discount}% OFF`}
                               </p>
                               <p className="text-[10px] text-gray-400 mt-3 font-medium">유효기간: {coupon.expiry} 까지</p>
                            </div>
                            {coupon.used ? (
                              <Button size="sm" variant="ghost" disabled className="font-bold">사용 완료</Button>
                            ) : (
                              <Button size="sm" className="bg-blue-600 rounded-xl px-4 h-10 font-bold">사용 가능</Button>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </SheetContent>
            </Sheet>
        </div>

        {/* Support & Others */}
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 group">
             <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
             </div>
             <span className="flex-1 text-left font-bold text-gray-700">앱 환경 설정</span>
             <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all" />
          </button>
          
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <CircleHelp className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </div>
                <span className="flex-1 text-left font-bold text-gray-700">고객 지원 센터</span>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-all" />
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none">
               <DialogHeader>
                  <DialogTitle className="text-xl font-bold">고객센터</DialogTitle>
                  <DialogDescription>
                     도움이 필요하신가요? 천안 스마트시티 팀이 해결해 드립니다.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-6">
                  <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[1.5rem] hover:bg-blue-50 transition-colors cursor-pointer group">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Phone className="w-6 h-6 text-blue-600 group-hover:animate-bounce" />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone Support</p>
                        <p className="text-xl font-black text-gray-800 tracking-tight">1588-0000</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[1.5rem] hover:bg-blue-50 transition-colors cursor-pointer group">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Mail className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Inquiry</p>
                        <p className="text-sm font-black text-gray-800">help@cheonanparking.com</p>
                     </div>
                  </div>
               </div>
               <DialogFooter>
                  <DialogClose asChild><Button className="w-full h-12 bg-blue-600 rounded-xl">창 닫기</Button></DialogClose>
               </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Footer Info */}
        <div className="px-2 pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 font-bold mb-8">
            <Sheet>
               <SheetTrigger asChild>
                <button className="hover:text-blue-600 transition-colors uppercase tracking-tight">이용약관</button>
               </SheetTrigger>
               <SheetContent side="right" className="w-[100vw] sm:w-[450px] overflow-y-auto">
                 <SheetHeader className="mb-8">
                   <SheetTitle className="text-2xl font-black">서비스 이용약관</SheetTitle>
                   <p className="text-xs text-slate-400">최종 수정일: 2025.03.01</p>
                 </SheetHeader>
                 <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                   <p><strong>제 1 조 (목적)</strong><br />본 약관은 회사가 운영하는 "천안시 AI 파킹패스"에서 제공하는 주차 관련 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>
                   {/* ...약관 생략... */}
                 </div>
               </SheetContent>
            </Sheet>

            <Sheet>
               <SheetTrigger asChild>
                <button className="hover:text-blue-600 transition-colors uppercase tracking-tight underline underline-offset-4 decoration-2">개인정보 처리방침</button>
               </SheetTrigger>
               <SheetContent side="right" className="w-[100vw] sm:w-[450px] overflow-y-auto">
                 <SheetHeader className="mb-8">
                   <SheetTitle className="text-2xl font-black">개인정보 처리방침</SheetTitle>
                 </SheetHeader>
                 <div className="space-y-6 text-sm text-slate-600">
                    <p>회사는 고객님의 소중한 개인정보를 안전하게 보호하기 위해 최선을 다하고 있습니다.</p>
                    {/* ...생략... */}
                 </div>
               </SheetContent>
            </Sheet>
            
            <span className="ml-auto opacity-30">VERSION 1.0.0-PRO</span>
          </div>

          <Button variant="ghost" className="w-full h-14 rounded-2xl text-rose-500 font-black hover:bg-rose-50 hover:text-rose-600" onClick={onLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            로그아웃
          </Button>

          <Button variant="ghost" className="w-full h-10 rounded-xl text-gray-400 text-[10px] font-bold mt-2" onClick={handleWithdrawal}>
            회원 탈퇴
          </Button>

          <div className="text-center mt-12 mb-8 space-y-2">
            <h4 className="text-[10px] font-black tracking-[0.4em] text-slate-200">CHEONAN AI PARKING PASS</h4>
            <p className="text-[9px] text-slate-300 font-medium"> 2025 SMART CITY INFRASTRUCTURE. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

