import { useEffect, useRef, useState } from 'react';
import { config } from '../config';
import { ParkingLot } from '../types';

declare global {
  interface Window {
    kakao: any;
  }
}

type KakaoMapProps = {
  parkingLots: ParkingLot[];
  height?: string;
  onMarkerClick?: (id: string) => void;
  hotspots?: { place: string; count: number; lat?: number; lon?: number }[];
  showHotspots?: boolean;
  userLocation?: { lat: number; lon: number } | null;
  onAddressFound?: (address: string) => void;
  targetLocation?: { lat: number; lon: number; name: string } | null;
};

const kakaoLoader = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise<void>((resolve, reject) => {
      if (!config.kakaoJsKey) {
        reject(new Error('Kakao JS key is missing'));
        return;
      }
      if (typeof window !== 'undefined' && window.kakao?.maps) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.kakaoJsKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        if (!window.kakao) {
          reject(new Error('Kakao SDK load failed'));
          return;
        }
        window.kakao.maps.load(() => resolve());
      };
      script.onerror = () => reject(new Error('Kakao SDK script error'));
      document.head.appendChild(script);
    });
    return promise;
  };
})();

export function KakaoMap({ parkingLots, hotspots = [], showHotspots = false, height = '16rem', onMarkerClick, userLocation, onAddressFound, targetLocation }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  const centerCoord = (() => {
    if (targetLocation) return targetLocation;
    if (userLocation) return userLocation;
    const first = parkingLots.find((p) => p.latitude && p.longitude);
    return {
      lat: first?.latitude ?? 36.815,
      lon: first?.longitude ?? 127.113,
    };
  })();

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    setStatus('loading');
    kakaoLoader()
      .then(() => {
        if (!containerRef.current) return;
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(centerCoord.lat, centerCoord.lon),
          level: 4, // 줌 레벨 조정 (조금 더 확대)
        });
        mapRef.current = map;

        const markers: any[] = [];
        
        // 내 위치 마커 (빨간 원 또는 이미지)
        if (userLocation) {
             const locPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lon);
             
             // 커스텀 오버레이로 내 위치 표시 (파란 점)
             const content = '<div style="width:12px;height:12px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 5px rgba(0,0,0,0.3);"></div>';
             const customOverlay = new window.kakao.maps.CustomOverlay({
                position: locPosition,
                content: content,
                map: map
             });
             markers.push(customOverlay);

             // 주소 변환
             if (onAddressFound) {
                 const geocoder = new window.kakao.maps.services.Geocoder();
                 geocoder.coord2Address(userLocation.lon, userLocation.lat, (result: any, status: any) => {
                    if (status === window.kakao.maps.services.Status.OK) {
                        onAddressFound(result[0]?.address?.address_name || '주소 정보 없음');
                    }
                 });
             }
        }

        // 목적지(검색 장소) 마커 (노란 별 핀 + 라벨)
        if (targetLocation) {
             const locPosition = new window.kakao.maps.LatLng(targetLocation.lat, targetLocation.lon);
             
             // 1. 별 모양 마커 (목적지 강조)
             const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
             const imageSize = new window.kakao.maps.Size(24, 35); 
             const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize); 
             
             const marker = new window.kakao.maps.Marker({
                 position: locPosition,
                 map: map,
                 title: targetLocation.name,
                 image: markerImage,
                 zIndex: 10 // 다른 마커보다 위에 표시
             });
             markers.push(marker);

             // 2. 장소 이름 라벨 (CustomOverlay)
             const content = `<div style="padding:4px 10px;background-color:#2563eb;color:white;font-size:12px;font-weight:bold;border-radius:20px;box-shadow:0 2px 4px rgba(0,0,0,0.2);transform:translateY(-48px);white-space:nowrap;">📍 ${targetLocation.name}</div>`;
             
             const overlay = new window.kakao.maps.CustomOverlay({
                 position: locPosition,
                 content: content,
                 map: map,
                 zIndex: 10
             });
             markers.push(overlay);
        }

        parkingLots
          .filter((p) => p.latitude && p.longitude)
          .forEach((lot) => {
            const position = new window.kakao.maps.LatLng(lot.latitude, lot.longitude);
            // 기본 마커
            const marker = new window.kakao.maps.Marker({
              position,
              map,
            });
            if (onMarkerClick) {
              window.kakao.maps.event.addListener(marker, 'click', () => onMarkerClick(lot.id));
            }
            markers.push(marker);
          });

        if (showHotspots) {
          hotspots
            .filter((h) => h.lat && h.lon)
            .forEach((hotspot) => {
              const position = new window.kakao.maps.LatLng(hotspot.lat, hotspot.lon);
              
              // 핀 대신 붉은색 원(Circle)으로 표시하여 히트맵 효과
              // 단속 횟수(count)에 비례하여 크기 조절 (최소 50m, 최대 200m)
              const radius = Math.min(Math.max(hotspot.count * 5, 50), 200);

              const circle = new window.kakao.maps.Circle({
                center: position,
                radius: radius,
                strokeWeight: 0, // 테두리 없음
                fillColor: '#FF0000', // 빨간색
                fillOpacity: 0.4 // 반투명
              });
              
              circle.setMap(map);
              markers.push(circle); // cleanup을 위해 배열에 추가
            });
        }

        setStatus('ready');
        // Cleanup function inside useEffect might be tricky with map instances, 
        // usually we just leave it or clear markers if we re-render entirely.
        // But here we re-create map on every dependency change which is not ideal but robust.
      })
      .catch((err) => {
        setErrorMsg(err?.message || '지도 로드에 실패했습니다');
        setStatus('error');
      });
  }, [parkingLots, userLocation, showHotspots, targetLocation]); // targetLocation added

  if (!config.kakaoJsKey) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-100 rounded-lg" style={{ height }}>
        카카오 지도 키가 설정되지 않았습니다 (.env.local)
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-600">
          지도를 불러오는 중...
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-red-600">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
