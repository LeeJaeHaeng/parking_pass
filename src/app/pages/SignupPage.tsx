import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../api';
import { motion } from 'framer-motion';

interface SignupPageProps {
  onSignupSuccess: (user: { id: string; name: string; email?: string; token?: string }) => void;
  onNavigateLogin: () => void;
}

export default function SignupPage({ onSignupSuccess, onNavigateLogin }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.register({ email, password, name });
      if (!res || !res.access_token) throw new Error('회원가입 응답이 올바르지 않습니다.');
      onSignupSuccess({ id: String(res.user_id), name: res.name || email, email: res.email, token: res.access_token });
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/30 rounded-full blur-[100px] animate-pulse delay-1000" />

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">회원가입</h1>
                <p className="text-gray-500">천안시 AI 파킹패스의 모든 기능을 이용해보세요</p>
            </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 (닉네임)</Label>
              <Input
                id="name"
                type="text"
                className="h-12 bg-white/50 border-gray-200 focus:bg-white transition-all rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
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
                placeholder="8자 이상 입력"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20" disabled={isLoading}>
              {isLoading ? '가입 중...' : '회원가입 완료'}
            </Button>
          </form>
          
          <div className="text-center">
              <p className="text-sm text-gray-500">
                  이미 계정이 있으신가요?{' '}
                  <button onClick={onNavigateLogin} className="text-blue-600 font-bold hover:underline">
                      로그인
                  </button>
              </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

