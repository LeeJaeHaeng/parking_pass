export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  kakaoRestApiKey: import.meta.env.VITE_KAKAO_REST_API_KEY || '',
  kakaoJsKey: import.meta.env.VITE_KAKAO_JS_KEY || '',
  kmaApiKey: import.meta.env.VITE_KMA_API_KEY || '',
  sbdcApiKey: import.meta.env.VITE_SBDC_API_KEY || '',
  holidayApiKey: import.meta.env.VITE_HOLIDAY_API_KEY || '',
};
