import { Home, Search, Car, User } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'search' | 'my-parking' | 'my-page') => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'home' as const, icon: Home, label: '홈' },
    { id: 'search' as const, icon: Search, label: '검색' },
    { id: 'my-parking' as const, icon: Car, label: '내 주차' },
    { id: 'my-page' as const, icon: User, label: 'MY' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1"
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
