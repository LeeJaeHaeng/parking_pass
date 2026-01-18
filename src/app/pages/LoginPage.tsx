import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../api';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLogin: (user: { id: string; name: string; email?: string; token?: string }) => void;
  onNavigateVerify: () => void; // 회원가입으로 이동
}

export default function LoginPage({ onLogin, onNavigateVerify }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      if (!res || !res.access_token) throw new Error('로그인 응답이 올바르지 않습니다.');
      onLogin({ id: String(res.user_id), name: res.name || email, email: res.email, token: res.access_token });
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSuccess = async (provider: string, user: any) => {
      // 소셜 로그인 성공 시 바로 로그인 처리
      // 실제로는 백엔드에 소셜 토큰을 검증하고 JWT를 받아오는 과정이 필요함
      // 현재는 MVP로 클라이언트 정보를 기반으로 로그인 처리
      console.log(`[${provider}] Social Login Success`, user);
      
      // 사용자 등록/업데이트 시도 (백엔드 연동 전 임시)
      try {
          await api.register({ email: user.email, password: `social_${user.id}`, name: user.name });
      } catch (e) {
          // 이미 존재할 수 있음 -> 로그인 시도
          try {
             await api.login({ email: user.email, password: `social_${user.id}` });
          } catch(loginErr) {
             console.warn('Social auto-login/register failed', loginErr);
          }
      }
      
      onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/30 rounded-full blur-[100px] animate-pulse delay-1000" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                    <span className="text-2xl">🅿️</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">천안시 AI 파킹패스</h1>
                <p className="text-gray-500">스마트한 주차 경험을 시작해보세요</p>
            </div>

            <SocialLoginButtons 
                onLoginSuccess={handleSocialSuccess} 
                onError={(msg) => setError(msg)} 
            />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/50 backdrop-blur px-2 text-gray-500">또는 이메일로 로그인</span>
                </div>
            </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                className="h-12 bg-white/50 border-gray-200 focus:bg-white transition-all rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                className="h-12 bg-white/50 border-gray-200 focus:bg-white transition-all rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg shadow-gray-900/10" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
          
          <div className="text-center">
              <p className="text-sm text-gray-500">
                  아직 계정이 없으신가요?{' '}
                  <button onClick={onNavigateVerify} className="text-blue-600 font-bold hover:underline">
                      회원가입
                  </button>
              </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

