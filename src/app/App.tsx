import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ParkingDetailPage from './pages/ParkingDetailPage';
import MyParkingPage from './pages/MyParkingPage';
import PaymentPage from './pages/PaymentPage';
import MyPage from './pages/MyPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import BottomNav from './components/BottomNav';

type Page = 'home' | 'search' | 'detail' | 'my-parking' | 'payment' | 'my-page' | 'history' | 'onboarding';

export type Vehicle = {
  id: string;
  licensePlate: string;
  model: string;
  color: string;
  isDefault: boolean;
  discountType?: 'none' | 'light' | 'eco' | 'merit'; // 감면 대상
};

export type PaymentMethod = {
  id: number;
  name: string;
  number: string;
  isDefault: boolean;
};

type User = {
  id: string;
  name: string;
  email?: string;
  token?: string;
  isOnboarded?: boolean;
  vehicles?: Vehicle[];
  paymentMethods?: PaymentMethod[];
} | null;

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  
  const [user, setUser] = useState<User>(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null;
      if (!stored || stored === 'undefined' || stored === 'null') return null;
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse authUser from localStorage:', e);
      return null;
    }
  });

  // 페이지 전환 시 항상 최상단으로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedParkingId]);

  const handleLogin = (loggedInUser: User) => {
    // 실제로는 백엔드에서 isOnboarded 플래그를 받아와야 함
    // 여기서는 가입 직후라면 false라고 가정하거나, 별도 로직 필요
    // MVP: 모든 로그인은 일단 홈으로, 회원가입 직후만 온보딩으로
    setUser(loggedInUser);
    window.localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    setIsSignup(false);
  };

  const handleSignupSuccess = (signedUpUser: User) => {
      if (!signedUpUser) return;
      // 회원가입 성공 시 -> 온보딩으로 이동
      const userWithFlag: NonNullable<User> = { ...signedUpUser, isOnboarded: false };
      setUser(userWithFlag);
      window.localStorage.setItem('authUser', JSON.stringify(userWithFlag));
      setIsSignup(false);
      // 온보딩 페이지는 로그인 상태에서 렌더링됨
  };

  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem('authUser');
    setCurrentPage('home');
  };

  const handleOnboardingComplete = (data?: { vehicles: any[], paymentMethods: any[] }) => {
      if (user) {
          // Tip: user가 null이 아님을 보장하지만, TS는 ...user 확장에서 타입 추론 이슈가 있을 수 있음.
          // 명시적으로 타입을 맞추거나 User 타입 정의에 맞게 구성.
          const updatedUser: User = { 
              id: user.id,
              name: user.name,
              email: user.email,
              token: user.token,
              isOnboarded: true,
              vehicles: data?.vehicles || [],
              paymentMethods: data?.paymentMethods || []
          };
          setUser(updatedUser);
          window.localStorage.setItem('authUser', JSON.stringify(updatedUser)); // 차량/카드 정보 포함 저장
      }
  };

  if (!user) {
    if (isSignup) {
        return <SignupPage onSignupSuccess={handleSignupSuccess} onNavigateLogin={() => setIsSignup(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onNavigateVerify={() => setIsSignup(true)} />;
  }

  // 온보딩이 완료되지 않았으면 강제로 온보딩 페이지 노출 (단, 기존 유저는 예외 처리 로직 필요할 수 있음)
  if (user.isOnboarded === false) {
      return <OnboardingPage userName={user.name} onComplete={handleOnboardingComplete} />;
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
        return <MyPage user={user} onHistoryClick={() => setCurrentPage('history')} onLogout={handleLogout} />;
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
