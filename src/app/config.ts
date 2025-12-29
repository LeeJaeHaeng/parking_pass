const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:8000',
  kakaoRestApiKey: env.VITE_KAKAO_REST_API_KEY || '',
  kakaoJsKey: env.VITE_KAKAO_JS_KEY || '',
  kmaApiKey: env.VITE_KMA_API_KEY || '',
  sbdcApiKey: env.VITE_SBDC_API_KEY || '',
  holidayApiKey: env.VITE_HOLIDAY_API_KEY || '',
};
