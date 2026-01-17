import { useState } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle2, X, Receipt, Award, ChevronRight, Check, Sparkles } from 'lucide-react';
import { mockParkingLots, mockVehicle } from '../data/mockData';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from '../components/ui/sheet';

declare global {
  interface Window {
    IMP: any;
  }
}

interface PaymentPageProps {
  onComplete: () => void;
}

export default function PaymentPage({ onComplete }: PaymentPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'account'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<{ id: string, name: string, discount: number, type: string } | null>(null);
  const [isCouponSheetOpen, setIsCouponSheetOpen] = useState(false);

  const coupons = [
    { id: 'c1', name: '웰컴 할인 쿠폰', discount: 2000, type: 'fixed' },
    { id: 'c2', name: '첫 주차 감사 쿠폰', discount: 10, type: 'percent' }
  ];

  const parking = mockParkingLots[0];
  const parkingFee = 5500;
  
  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;
    if (selectedCoupon.type === 'fixed') return selectedCoupon.discount;
    return Math.floor(parkingFee * (selectedCoupon.discount / 100));
  };

  const discountAmount = calculateDiscount();
  const totalFee = Math.max(0, parkingFee - discountAmount);

  const parkingStartTime = '14:30';
  const parkingEndTime = '16:13';
  const parkingDuration = '1시간 43분';
  const durationMinutes = 103;

  const getStoredUserId = () => {
    if (typeof window === 'undefined') return undefined;
    try {
      const stored = window.localStorage.getItem('authUser');
      if (!stored) return undefined;
      const parsed = JSON.parse(stored);
      return parsed?.id ? Number(parsed.id) : undefined;
    } catch {
      return undefined;
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setError(null);

    // 포트원(Iamport) 결제 요청
    if (!window.IMP) {
      setError('결제 SDK 로드 실패');
      setIsProcessing(false);
      return;
    }

    const { IMP } = window;
    IMP.init('imp19424728'); // 포트원 공개 테스트 ID

    // 결제 수단 매핑
    let pg = 'html5_inicis'; // 기본: 이니시스(웹표준)
    let pay_method = 'card';

    if (paymentMethod === 'mobile') {
      pg = 'kakaopay';
    } else if (paymentMethod === 'account') {
      pay_method = 'trans';
    }

    const data = {
      pg: pg,
      pay_method: pay_method,
      merchant_uid: `mid_${new Date().getTime()}`,
      name: `${parking.name} 주차요금`,
      amount: totalFee,
      buyer_email: 'test@cheonan.go.kr',
      buyer_name: '홍길동',
      buyer_tel: '010-1234-5678',
      m_redirect_url: window.location.href, // 모바일에서 리다이렉트될 URL
    };

    IMP.request_pay(data, async (rsp: any) => {
      if (rsp.success) {
        // 결제 성공 시 서버에 기록
        try {
          await api.createPayment({
            parkingLotName: parking.name,
            startTime: parkingStartTime,
            endTime: parkingEndTime,
            duration: durationMinutes,
            fee: totalFee,
            userId: getStoredUserId(),
          });
          setIsComplete(true);
        } catch (e: any) {
          setError(e?.message || '결제 기록 저장에 실패했습니다');
        }
      } else {
        // 결제 실패/취소
        setError(`결제가 취소되었거나 실패했습니다: ${rsp.error_msg}`);
      }
      setIsProcessing(false);
    });
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl mb-2">결제 완료</h2>
            <p className="text-gray-600">주차 요금이 정상적으로 결제되었습니다</p>
          </div>

          <Card className="bg-gray-50 p-4 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">결제 금액</span>
                <span className="text-lg">{totalFee.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제 수단</span>
                <span>
                  {paymentMethod === 'card' && '신용/체크카드'}
                  {paymentMethod === 'mobile' && '간편결제'}
                  {paymentMethod === 'account' && '계좌이체'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제 시각</span>
                <span>{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              <Receipt className="w-4 h-4 mr-2" />
              영수증 보기
            </Button>
            <Button className="w-full" onClick={onComplete}>
              확인
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-gray-100 backdrop-blur-md bg-white/80">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="premium-gradient p-1.5 rounded-xl shadow-lg shadow-blue-200">
               <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">결제하기</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">Secure Payment</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100" onClick={onComplete}>
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
      </div>

          <div className="max-w-lg mx-auto p-4 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        {/* Parking Summary Premium Card */}
        <div className="glass-card p-6 premium-shadow relative overflow-hidden bg-white border border-gray-100 rounded-3xl">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Parking Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
              <span className="text-gray-500 font-bold">주차장</span>
              <span className="text-gray-900 font-black">{parking.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">차량 번호</p>
                  <p className="font-black text-gray-800">{mockVehicle.licensePlate}</p>
               </div>
               <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">주차 시간</p>
                  <p className="font-black text-gray-800">{parkingDuration}</p>
               </div>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-gray-400 font-medium">이용 기간</span>
              <span className="text-sm text-gray-600 font-bold">{parkingStartTime} ~ {parkingEndTime}</span>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Premium Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Receipt size={64} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Payment Summary</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">기본 주차 요금</span>
              <span className="text-gray-900 font-bold">{parkingFee.toLocaleString()}원</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-bold">쿠폰 할인 {selectedCoupon && `(${selectedCoupon.name})`}</span>
                <span className="text-blue-600 font-black">-{discountAmount.toLocaleString()}원</span>
              </div>
            )}
            <Separator className="bg-gray-50" />
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-900 font-black text-lg">최종 결제 금액</span>
              <span className="text-3xl font-black text-blue-600 tracking-tight">{totalFee.toLocaleString()}원</span>
            </div>
          </div>

          {/* Coupon Selection Interactive */}
          <Sheet open={isCouponSheetOpen} onOpenChange={setIsCouponSheetOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center justify-between p-5 bg-blue-50/50 border border-blue-100 rounded-2xl group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-0.5">Discounts Available</p>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedCoupon ? selectedCoupon.name : '쿠폰을 선택해주세요'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-all" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2.5rem] border-none p-8 h-auto pb-12">
               <SheetHeader className="mb-8 text-left">
                  <SheetTitle className="text-2xl font-black">쿠폰 선택</SheetTitle>
                  <SheetDescription>보유하신 쿠폰 중 하나를 선택해 적용하세요.</SheetDescription>
               </SheetHeader>
               <div className="space-y-4">
                  <div 
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${!selectedCoupon ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100'}`}
                    onClick={() => { setSelectedCoupon(null); setIsCouponSheetOpen(false); }}
                  >
                     <p className="font-bold text-gray-800">선택 안 함</p>
                  </div>
                  {coupons.map(coupon => (
                    <div 
                      key={coupon.id}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedCoupon?.id === coupon.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      onClick={() => { setSelectedCoupon(coupon); setIsCouponSheetOpen(false); }}
                    >
                       <div className="flex justify-between items-center relative z-10">
                          <div>
                             <p className="font-black text-gray-900 mb-0.5">{coupon.name}</p>
                             <p className="text-xs text-blue-600 font-bold">
                               {coupon.type === 'fixed' ? `${coupon.discount.toLocaleString()}원 할인` : `${coupon.discount}% 할인`}
                             </p>
                          </div>
                          {selectedCoupon?.id === coupon.id && <Check className="w-5 h-5 text-blue-600" />}
                       </div>
                    </div>
                  ))}
               </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Payment Method */}
        <Card className="p-4">
          <h3 className="mb-4">결제 수단</h3>
          
          <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p>신용/체크카드</p>
                    <p className="text-xs text-gray-500">카드 정보 입력</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="mobile" id="mobile" />
                <Label htmlFor="mobile" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p>간편결제</p>
                    <p className="text-xs text-gray-500">카카오페이, 네이버페이 등</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                <RadioGroupItem value="account" id="account" />
                <Label htmlFor="account" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p>계좌이체</p>
                    <p className="text-xs text-gray-500">실시간 계좌이체</p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* 안내 메시지 - 카드 선택 시 */}
        {paymentMethod === 'card' && (
           <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              결제하기 버튼을 누르면 카드사 결제창이 호출됩니다. (테스트 결제)
           </div>
        )}

        {/* Terms */}
        <Card className="p-4 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <p>• 결제 완료 후 영수증은 마이페이지에서 확인하실 수 있습니다.</p>
            <p>• 결제 취소는 결제 후 30분 이내에만 가능합니다.</p>
            <p>• 문의사항은 고객센터(1588-XXXX)로 연락주세요.</p>
          </div>
        </Card>

        {/* Payment Button */}
        <Button
          className="w-full h-14 text-lg"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              결제 처리 중...
            </span>
          ) : (
            `${totalFee.toLocaleString()}원 결제하기`
          )}
        </Button>
      </div>
    </div>
  );
}
