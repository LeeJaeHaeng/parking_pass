import { useState } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle2, X, Receipt } from 'lucide-react';
import { mockParkingLots, mockVehicle } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';

interface PaymentPageProps {
  onComplete: () => void;
}

export default function PaymentPage({ onComplete }: PaymentPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'account'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const parking = mockParkingLots[0];
  const parkingFee = 5500;
  const discount = 0;
  const totalFee = parkingFee - discount;

  const parkingStartTime = '14:30';
  const parkingEndTime = '16:13';
  const parkingDuration = '1시간 43분';

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 2000);
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center justify-between">
          <h1>결제</h1>
          <Button variant="ghost" size="sm" onClick={onComplete}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Parking Summary */}
        <Card className="p-4">
          <h3 className="mb-4">주차 정보</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">주차장</span>
              <span>{parking.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">차량 번호</span>
              <span>{mockVehicle.licensePlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">주차 시간</span>
              <span>{parkingStartTime} ~ {parkingEndTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">주차 시간</span>
              <span>{parkingDuration}</span>
            </div>
          </div>
        </Card>

        {/* Fee Breakdown */}
        <Card className="p-4">
          <h3 className="mb-4">요금 상세</h3>
          
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">기본 요금 (30분)</span>
              <span>{parking.fee.basic.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">추가 요금 (73분)</span>
              <span>{(parkingFee - parking.fee.basic).toLocaleString()}원</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>할인</span>
                <span>-{discount.toLocaleString()}원</span>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span>총 결제 금액</span>
            <span className="text-2xl text-blue-600">{totalFee.toLocaleString()}원</span>
          </div>
        </Card>

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

        {/* Payment Card Details (when card is selected) */}
        {paymentMethod === 'card' && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="space-y-3">
              <div>
                <Label className="mb-2 block text-sm">카드 번호</Label>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" maxLength={4} placeholder="1234" className="px-3 py-2 rounded border text-center" />
                  <input type="text" maxLength={4} placeholder="5678" className="px-3 py-2 rounded border text-center" />
                  <input type="text" maxLength={4} placeholder="9012" className="px-3 py-2 rounded border text-center" />
                  <input type="text" maxLength={4} placeholder="3456" className="px-3 py-2 rounded border text-center" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-2 block text-sm">유효기간</Label>
                  <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 rounded border text-center" />
                </div>
                <div>
                  <Label className="mb-2 block text-sm">CVC</Label>
                  <input type="text" maxLength={3} placeholder="123" className="w-full px-3 py-2 rounded border text-center" />
                </div>
              </div>
            </div>
          </Card>
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
