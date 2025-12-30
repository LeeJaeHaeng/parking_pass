import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, DollarSign, Download, Filter, MapPin } from 'lucide-react';
import { mockParkingHistory } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { api } from '../api';
import { ParkingHistory } from '../types';

interface HistoryPageProps {
  onBack: () => void;
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const [history, setHistory] = useState<ParkingHistory[]>(mockParkingHistory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null;
        const userId = stored ? Number(JSON.parse(stored).id) : undefined;
        const data = await api.getHistory(userId);
        
        // 타입 매핑
        const mappedData: ParkingHistory[] = data.map((item: any) => ({
          id: item.id ? Number(item.id) : Math.floor(Math.random() * 10000),
          parkingLotName: item.parkingLotName,
          date: item.createdAt || new Date().toISOString(), 
          startTime: item.startTime || '00:00',
          endTime: item.endTime || '00:00',
          duration: item.duration || 0,
          fee: item.fee
        }));
        
        setHistory(mappedData);
      } catch (e) {
        setHistory(mockParkingHistory);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  const totalCount = history.length;
  const totalSpent = history.reduce((sum, item) => sum + item.fee, 0);

  const getMonthlyData = () => {
    const monthly: { [key: string]: { count: number; spent: number } } = {};

    history.forEach(item => {
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
          {loading && (
            <Card className="p-4 text-sm text-gray-500">내역을 불러오는 중...</Card>
          )}
          {history.map((item) => (
            <Card key={item.id} className="p-5 hover:shadow-lg transition-all shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-600" />
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">{formatDate(item.date)}</span>
                        {item.duration > 0 && <span className="w-1 h-1 rounded-full bg-gray-300"></span>}
                        {item.duration > 0 && <span className="text-sm text-gray-500">{Math.floor(item.duration / 60)}시간 {item.duration % 60}분</span>}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{item.parkingLotName}</h3>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-lg font-bold text-gray-900">{item.fee.toLocaleString()}원</p>
                   <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs font-medium border-0 mt-1">
                     결제완료
                   </Badge>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex flex-col">
                   <span className="text-gray-500 text-xs mb-1">입차 시간</span>
                   <span className="font-medium">{item.startTime}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-gray-500 text-xs mb-1">출차 시간</span>
                   <span className="font-medium">{item.endTime}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 h-10 border-gray-200">
                  <Download className="w-4 h-4 mr-2 text-gray-500" />
                  영수증 저장
                </Button>
                <Button className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white">
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

        {history.length === 0 && !loading && (
          <div className="text-center py-12">
            <Download className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">내역이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">주차 후 결제하면 기록이 저장됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
