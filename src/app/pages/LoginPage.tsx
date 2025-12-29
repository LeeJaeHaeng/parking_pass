import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../api';

interface LoginPageProps {
  onLogin: (user: { id: string; name: string; email?: string; token?: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const res = await api.register({ email, password, name });
        onLogin({ id: String(res.user_id), name: res.name || email, email: res.email, token: res.access_token });
      } else {
        const res = await api.login({ email, password });
        onLogin({ id: String(res.user_id), name: res.name || email, email: res.email, token: res.access_token });
      }
    } catch (err: any) {
      setError(err?.message || '요청에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>천안 AI 파킹 패스</CardTitle>
          <CardDescription>
            {mode === 'login' ? '로그인하여 서비스를 이용하세요' : '이메일로 회원가입 후 시작하세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4 gap-2">
            <Button variant={mode === 'login' ? 'default' : 'outline'} className="flex-1" onClick={() => setMode('login')} disabled={isLoading}>
              로그인
            </Button>
            <Button variant={mode === 'register' ? 'default' : 'outline'} className="flex-1" onClick={() => setMode('register')} disabled={isLoading}>
              회원가입
            </Button>
          </div>

          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 또는 닉네임"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? mode === 'login' ? '로그인 중...' : '가입 중...'
                : mode === 'login' ? '로그인' : '회원가입'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
