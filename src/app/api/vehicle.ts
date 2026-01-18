import { config } from '../config';

export interface VehicleInfo {
  licensePlate: string;
  model: string; // 차명 (예: 쏘나타)
  detail: string; // 세부모델 (예: The Edge)
  fuel: string; // 연료 (가솔린, 디젤, 전기, 수소)
  color: string; // 색상
  type: string; // 차종 (승용, 승합, 화물, 특수)
  regDate: string; // 최초등록일
}

// 공공데이터포털 자동차종합정보 API 응답 구조를 모방
export const vehicleApi = {
  lookup: async (plateNumber: string): Promise<VehicleInfo | null> => {
    // 실제 API 키가 있다면 여기서 fetch 호출
    // const response = await fetch(`.../getCarInfo?key=${KEY}&no=${plateNumber}`);
    
    // 현재는 키가 없으므로 "구조적 Mock" 반환 (랜덤 아님, 입력값에 따라 고정된 결과)
    // 실제 서비스에서는 백엔드 프록시를 통해 호출해야 함 (CORS 및 키 보안)
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // 규칙: 뒤 4자리가 짝수면 승용차, 홀수면 SUV
            // 규칙: 앞 2자리가 80~99면 화물차
            const lastDigit = parseInt(plateNumber.slice(-1)) || 0;
            const prefix = parseInt(plateNumber.substring(0, 2)) || 0;

            if (prefix >= 80 && prefix <= 97) {
                 resolve({
                    licensePlate: plateNumber,
                    model: '봉고3',
                    detail: '킹캡 초장축',
                    fuel: '디젤',
                    color: '흰색',
                    type: '화물',
                    regDate: '2023-05-10'
                });
                return;
            }

            if (lastDigit % 2 === 0) {
                // 짝수: 승용/전기
                resolve({
                    licensePlate: plateNumber,
                    model: '아이오닉5',
                    detail: '프레스티지',
                    fuel: '전기',
                    color: '아틀라스 화이트',
                    type: '승용',
                    regDate: '2024-01-15'
                });
            } else {
                // 홀수: SUV/가솔린
                resolve({
                    licensePlate: plateNumber,
                    model: 'GV80',
                    detail: '3.5 터보',
                    fuel: '가솔린',
                    color: '우유니 화이트',
                    type: '승용',
                    regDate: '2023-11-20'
                });
            }
        }, 1000); // 1초 딜레이
    });
  }
};
