import { ChevronRight, Car, CreditCard, Bell, Settings, HelpCircle, LogOut, Award, Clock } from 'lucide-react';
import { mockVehicle } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

interface MyPageProps {
  onHistoryClick: () => void;
  onLogout: () => void;
}

export default function MyPage({ onHistoryClick, onLogout }: MyPageProps) {
  const userName = '홍길동';
  const userEmail = 'hong@example.com';
  const totalParkingCount = 47;
  const totalSpent = 142500;

  const menuItems = [
    {
      icon: Clock,
      label: '이용 내역',
      onClick: onHistoryClick,
      badge: null
    },
    {
      icon: CreditCard,
      label: '결제 수단 관리',
      onClick: () => {},
      badge: null
    },
    {
      icon: Bell,
      label: '알림 설정',
      onClick: () => {},
      badge: '3'
    },
    {
      icon: Award,
      label: '할인 혜택',
      onClick: () => {},
      badge: 'NEW'
    },
  ];

  const settingsItems = [
    {
      icon: Settings,
      label: '설정',
      onClick: () => {}
    },
    {
      icon: HelpCircle,
      label: '고객센터',
      onClick: () => {}
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-8">
        <div className="max-w-lg mx-auto p-4">
          <h1 className="text-xl mb-6">마이페이지</h1>
          
          {/* User Profile */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-blue-500 text-white text-xl">
                  {userName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg mb-1">{userName}</h2>
                <p className="text-sm opacity-90">{userEmail}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-sm opacity-90 mb-1">총 이용 횟수</p>
                <p className="text-xl">{totalParkingCount}회</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-sm opacity-90 mb-1">누적 결제</p>
                <p className="text-xl">{(totalSpent / 1000).toFixed(0)}천원</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto -mt-4 px-4 space-y-4">
        {/* Vehicle Info */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>등록 차량</h3>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="mb-1">{mockVehicle.licensePlate}</p>
              <p className="text-sm text-gray-600">{mockVehicle.model} · {mockVehicle.color}</p>
            </div>
            <Badge variant="outline">주차량</Badge>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="divide-y">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </Card>

        {/* Settings */}
        <Card className="divide-y">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </Card>

        {/* App Info */}
        <Card className="p-4">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>앱 버전</span>
              <span>1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>이용약관</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            <div className="flex justify-between">
              <span>개인정보 처리방침</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full mb-8" onClick={onLogout}>
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
