import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ParkingDetailPage from './pages/ParkingDetailPage';
import MyParkingPage from './pages/MyParkingPage';
import PaymentPage from './pages/PaymentPage';
import MyPage from './pages/MyPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import BottomNav from './components/BottomNav';

type Page = 'home' | 'search' | 'detail' | 'my-parking' | 'payment' | 'my-page' | 'history';

type User = {
  id: string;
  name: string;
  email?: string;
  token?: string;
} | null;

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [user, setUser] = useState<User>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null;
    return stored ? JSON.parse(stored) : null;
  });

  // 페이지 전환 시 항상 최상단으로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedParkingId]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser) {
      window.localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem('authUser');
    setCurrentPage('home');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onParkingSelect={(id) => {
          setSelectedParkingId(id);
          setCurrentPage('detail');
        }} onSearchClick={() => setCurrentPage('search')} />;
      case 'search':
        return <SearchPage onBack={() => setCurrentPage('home')} onParkingSelect={(id) => {
          setSelectedParkingId(id);
          setCurrentPage('detail');
        }} />;
      case 'detail':
        return <ParkingDetailPage 
          parkingId={selectedParkingId || 'P0001'} 
          onBack={() => setCurrentPage('home')}
          onStartParking={() => setCurrentPage('my-parking')}
        />;
      case 'my-parking':
        return <MyParkingPage onPayment={() => setCurrentPage('payment')} />;
      case 'payment':
        return <PaymentPage onComplete={() => setCurrentPage('home')} />;
      case 'my-page':
        return <MyPage onHistoryClick={() => setCurrentPage('history')} onLogout={handleLogout} />;
      case 'history':
        return <HistoryPage onBack={() => setCurrentPage('my-page')} />;
      default:
        return <HomePage onParkingSelect={(id) => {
          setSelectedParkingId(id);
          setCurrentPage('detail');
        }} onSearchClick={() => setCurrentPage('search')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        {renderPage()}
      </main>
      <BottomNav currentPage={currentPage} onNavigate={(page) => setCurrentPage(page)} />
    </div>
  );
}
