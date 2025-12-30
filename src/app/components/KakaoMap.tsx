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
  onMarkerClick?: (id: number) => void;
  hotspots?: { place: string; count: number; lat?: number; lon?: number }[];
  showHotspots?: boolean;
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

export function KakaoMap({ parkingLots, hotspots = [], showHotspots = false, height = '16rem', onMarkerClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const centerCoord = (() => {
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
          level: 6,
        });

        const markers: any[] = [];
        parkingLots
          .filter((p) => p.latitude && p.longitude)
          .forEach((lot) => {
            const position = new window.kakao.maps.LatLng(lot.latitude, lot.longitude);
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
              const marker = new window.kakao.maps.Marker({
                position,
                map,
                title: `${hotspot.place} (${hotspot.count})`,
              });
              markers.push(marker);
            });
        }

        setStatus('ready');
        return () => {
          markers.forEach((m) => m.setMap(null));
        };
      })
      .catch((err) => {
        setErrorMsg(err?.message || '지도 로드에 실패했습니다');
        setStatus('error');
      });
  }, [parkingLots, onMarkerClick, centerCoord.lat, centerCoord.lon]);

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
