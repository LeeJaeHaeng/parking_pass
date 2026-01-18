import { useState } from 'react';
import { vehicleApi, VehicleInfo } from '../api/vehicle';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: (data?: { vehicles: any[], paymentMethods: any[] }) => void;
  userName: string;
}

export default function OnboardingPage({ onComplete, userName }: OnboardingPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agreed, setAgreed] = useState(false);
  const [vehicleNo, setVehicleNo] = useState('');
  const [cardNo, setCardNo] = useState('');
  
  // 차량 조회 State
  const [isSearching, setIsSearching] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [discountType, setDiscountType] = useState<'none' | 'light' | 'eco' | 'merit'>('none');

  const nextStep = () => setStep((p) => (p < 3 ? p + 1 : p) as any);

  // 실제(Mock 구조) 차량 조회
  const simulateVehicleLookup = async () => {
      if (vehicleNo.length < 4) return;
      setIsSearching(true);
      setVehicleInfo(null); 

      try {
          const info = await vehicleApi.lookup(vehicleNo);
          setVehicleInfo(info);
          // 차종에 따라 할인 유형 자동 제안 (옵션)
          if (info?.fuel === '전기' || info?.fuel === '수소') setDiscountType('eco');
          else if (info?.type === '경형' || info?.type === '경차') setDiscountType('light');
          else setDiscountType('none');
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearching(false);
      }
  };

  const handleComplete = () => {
    // 실제 데이터 구조 생성
    const newVehicle = vehicleInfo ? {
        id: `v_${Date.now()}`,
        licensePlate: vehicleInfo.licensePlate,
        model: vehicleInfo.model,
        color: vehicleInfo.color,
        isDefault: true,
        discountType: discountType
    } : null;

    const newPayment = cardNo.length > 10 ? {
        id: Date.now(),
        name: '내 카드', // 카드사 식별 로직은 생략(BIN 번호 등)
        number: cardNo,
        isDefault: true
    } : null;

    // 상위 컴포넌트(App.tsx)로 데이터 전달
    onComplete({
        vehicles: newVehicle ? [newVehicle] : [],
        paymentMethods: newPayment ? [newPayment] : []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 relative">
           <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full" />
           <div 
             className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500" 
             style={{ width: `${((step - 1) / 2) * 100}%` }} 
           />
           
           {[1, 2, 3].map((s) => (
             <div 
               key={s} 
               className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                 s <= step 
                   ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110' 
                   : 'bg-gray-200 text-gray-400'
               }`}
             >
               {s === 1 && <ShieldCheck className="w-5 h-5" />}
               {s === 2 && <Car className="w-5 h-5" />}
               {s === 3 && <CreditCard className="w-5 h-5" />}
             </div>
           ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle>환영합니다, {userName}님!</CardTitle>
                  <CardDescription>서비스 이용을 위해 약관에 동의해주세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 h-40 overflow-y-auto border border-gray-100">
                    <p className="font-bold mb-2">[필수] 서비스 이용 약관</p>
                    <p>본 서비스는 AI 기반 주차 편의 서비스입니다...</p>
                    <p className="mt-2 font-bold mb-2">[필수] 개인정보 처리방침</p>
                    <p>수집하는 개인정보 항목: 차량번호, 결제정보...</p>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
                    <Label htmlFor="terms" className="cursor-pointer font-medium">모든 약관에 동의합니다</Label>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-bold" disabled={!agreed} onClick={nextStep}>
                    다음으로 <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle>차량 등록</CardTitle>
                  <CardDescription>
                    차량 번호를 입력하면 자동으로 정보를 조회합니다.<br/>
                    <span className="text-xs text-blue-500">* 휘슬(Whistle) 방식 실시간 조회 시뮬레이션</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>차량 번호</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input 
                                placeholder="예: 12가 3456" 
                                className="bg-gray-50 h-14 text-center text-xl font-bold tracking-widest border-2 focus:border-blue-500 rounded-xl"
                                value={vehicleNo}
                                onChange={(e) => {
                                    setVehicleNo(e.target.value);
                                    setVehicleInfo(null); // 입력 변경 시 정보 초기화
                                }}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Car className="w-6 h-6" />
                            </div>
                        </div>
                        <Button 
                            className="h-14 w-20 bg-gray-900 text-white rounded-xl"
                            disabled={vehicleNo.length < 4 || isSearching}
                            onClick={simulateVehicleLookup}
                        >
                            {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '조회'}
                        </Button>
                    </div>
                  </div>

                  {/* 조회된 차량 정보 카드 */}
                  <AnimatePresence>
                    {vehicleInfo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <span className="text-2xl">🚗</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">{vehicleInfo.model}</p>
                                        <p className="text-sm text-gray-500">{vehicleInfo.detail}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-white p-2 rounded-lg">
                                        <span className="text-gray-400 block text-xs">연료</span>
                                        <span className="font-medium">{vehicleInfo.fuel}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg">
                                        <span className="text-gray-400 block text-xs">색상</span>
                                        <span className="font-medium">{vehicleInfo.color}</span>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Label className="text-xs font-bold text-gray-500 mb-2 block">주차 요금 감면 대상 (선택)</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div 
                                          onClick={() => setDiscountType('none')}
                                          className={`p-2 rounded-lg border text-center text-sm cursor-pointer transition-all ${discountType === 'none' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                                        >
                                          해당 없음
                                        </div>
                                        <div 
                                          onClick={() => setDiscountType('light')}
                                          className={`p-2 rounded-lg border text-center text-sm cursor-pointer transition-all ${discountType === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                                        >
                                          경차 (50%)
                                        </div>
                                        <div 
                                          onClick={() => setDiscountType('eco')}
                                          className={`p-2 rounded-lg border text-center text-sm cursor-pointer transition-all ${discountType === 'eco' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                                        >
                                          친환경차 (50%)
                                        </div>
                                        <div 
                                          onClick={() => setDiscountType('merit')}
                                          className={`p-2 rounded-lg border text-center text-sm cursor-pointer transition-all ${discountType === 'merit' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'}`}
                                        >
                                          국가유공자 (면제)
                                        </div>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-10 rounded-lg text-sm font-bold mt-2"
                                    onClick={nextStep}
                                >
                                    내 차량이 맞아요 <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  {!vehicleInfo && (
                      <Button variant="ghost" className="w-full text-gray-400" onClick={nextStep}>
                        나중에 등록하기
                      </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle>결제 수단 등록</CardTitle>
                  <CardDescription>자동 결제를 위한 카드를 등록해주세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg mb-4">
                      <div className="flex justify-between items-start mb-8">
                          <div className="bg-white/20 w-12 h-8 rounded" />
                          <CreditCard className="w-6 h-6 text-white/50" />
                      </div>
                      <div className="space-y-4">
                          <Input 
                            placeholder="0000 0000 0000 0000"
                            className="bg-transparent border-none text-white placeholder:text-gray-500 text-xl tracking-widest p-0 focus-visible:ring-0"
                            value={cardNo}
                            onChange={(e) => setCardNo(e.target.value)}
                            maxLength={19}
                          />
                          <div className="flex gap-4">
                              <div className="flex-1">
                                  <p className="text-xs text-gray-400 mb-1">VALID THRU</p>
                                  <p className="text-sm">MM/YY</p>
                              </div>
                              <div className="flex-1">
                                  <p className="text-xs text-gray-400 mb-1">CVC</p>
                                  <p className="text-sm">***</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-bold" onClick={handleComplete}>
                    {cardNo ? '등록하고 시작하기' : '나중에 하기'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
