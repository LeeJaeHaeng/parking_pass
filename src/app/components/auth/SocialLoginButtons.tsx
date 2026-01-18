import { useEffect } from 'react';
import { Button } from '../ui/button';
import { config } from '../../config';

declare global {
  interface Window {
    Kakao: any;
    naver: any;
  }
}

interface SocialLoginButtonsProps {
  onLoginSuccess: (provider: 'kakao' | 'naver', user: any) => void;
  onError: (error: string) => void;
}

export function SocialLoginButtons({ onLoginSuccess, onError }: SocialLoginButtonsProps) {

  useEffect(() => {
    // Kakao Init
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(config.kakaoJsKey);
      console.log('Kakao SDK Initialized:', window.Kakao.isInitialized());
    }

    // Naver Init (Future)
    // 네이버는 Client ID가 필요하므로 현재는 버튼만 렌더링하고 클릭 시 안내
  }, []);

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      onError('카카오 SDK가 로드되지 않았습니다.');
      return;
    }

    if (!config.kakaoJsKey) {
        onError('카카오 API 키가 설정되지 않았습니다.');
        return;
    }

    window.Kakao.Auth.login({
      success: function (authObj: any) {
        // 토큰 받기 성공 -> 사용자 정보 요청
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: function (res: any) {
            const user = {
                id: `kakao_${res.id}`,
                name: res.properties?.nickname || '카카오 사용자',
                email: res.kakao_account?.email || `kakao_${res.id}@example.com`,
                avatar: res.properties?.profile_image,
                token: authObj.access_token,
                provider: 'kakao'
            };
            onLoginSuccess('kakao', user);
          },
          fail: function (error: any) {
            console.error('Kakao User Info Error:', error);
            onError('사용자 정보를 가져오는데 실패했습니다.');
          },
        });
      },
      fail: function (err: any) {
        console.error('Kakao Login Error:', err);
        onError('카카오 로그인에 실패했습니다.');
      },
    });
  };

  const handleNaverLogin = () => {
    onError('네이버 로그인은 Client ID 발급 후 이용 가능합니다.');
    // 추후 구현:
    // const naverLogin = new window.naver.LoginWithNaverId({ ... });
    // naverLogin.init();
    // naverLogin.reprompt();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] border-none text-[#000000] font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        onClick={handleKakaoLogin}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 3C5.373 3 0 7.373 0 12.768c0 3.326 2.067 6.223 5.228 8.026-.22.806-.8 2.924-.916 3.374-.15.586.216.577.453.42 1.884-1.252 3.82-2.584 4.965-3.328.75.109 1.52.167 2.305.167 6.627 0 12-4.373 12-9.768C24 7.373 18.627 3 12 3z"/>
        </svg>
        카카오로 3초만에 시작하기
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-[#03C75A] hover:bg-[#02B150] border-none text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        onClick={handleNaverLogin}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
           <path d="M16.49 17.5V6.5H12.98L7.51 14.33V6.5H4V17.5H7.51L12.98 9.67V17.5H16.49Z"/>
        </svg>
        네이버로 시작하기
      </Button>
    </div>
  );
}
