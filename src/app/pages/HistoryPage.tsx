import { ArrowLeft, Calendar, MapPin, Clock, DollarSign, Download, Filter } from 'lucide-react';
import { mockParkingHistory } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface HistoryPageProps {
  onBack: () => void;
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  const totalCount = mockParkingHistory.length;
  const totalSpent = mockParkingHistory.reduce((sum, item) => sum + item.fee, 0);

  const getMonthlyData = () => {
    const monthly: { [key: string]: { count: number; spent: number } } = {};
    
    mockParkingHistory.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = { count: 0, spent: 0 };
      }
      
      monthly[monthKey].count++;
      monthly[monthKey].spent += item.fee;
    });
    
    return monthly;
  };

  const monthlyData = getMonthlyData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1>이용 내역</h1>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-gray-600 mb-3">이번 달 이용 현황</p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">이용 횟수</p>
              <p className="text-2xl text-blue-600">{totalCount}회</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">총 결제액</p>
              <p className="text-2xl text-blue-600">{totalSpent.toLocaleString()}원</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Filter Buttons */}
        <div className="flex items-center justify-between mb-4">
          <Tabs defaultValue="all" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="month">이번 달</TabsTrigger>
              <TabsTrigger value="year">올해</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" className="ml-2">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {mockParkingHistory.map((item) => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(item.date)}
                    </Badge>
                  </div>
                  <h3 className="mb-1">{item.parkingLotName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg text-blue-600">{item.fee.toLocaleString()}원</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{item.startTime} ~ {item.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{Math.floor(item.duration / 60)}시간 {item.duration % 60}분</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-3 h-3 mr-1" />
                  영수증
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  다시 이용
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Monthly Summary */}
        <Card className="mt-6 p-4">
          <h3 className="mb-4">월별 이용 통계</h3>
          <div className="space-y-3">
            {Object.entries(monthlyData).reverse().map(([month, data]) => {
              const [year, monthNum] = month.split('-');
              return (
                <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="mb-1">{year}년 {parseInt(monthNum)}월</p>
                    <p className="text-sm text-gray-600">{data.count}회 이용</p>
                  </div>
                  <p className="text-lg text-blue-600">{data.spent.toLocaleString()}원</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Export Button */}
        <Button variant="outline" className="w-full mt-4 mb-8">
          <Download className="w-4 h-4 mr-2" />
          이용 내역 내보내기
        </Button>
      </div>
    </div>
  );
}
