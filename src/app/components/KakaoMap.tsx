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
  const userMarkerRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const parkingMarkersRef = useRef<any[]>([]);
  const hotspotCirclesRef = useRef<any[]>([]);
  const [lastAddrLoc, setLastAddrLoc] = useState<{lat: number, lon: number} | null>(null);

  const centerCoord = (() => {
    if (targetLocation) return targetLocation;
    if (userLocation) return userLocation;
    const first = parkingLots.find((p) => p.latitude && p.longitude);
    return {
      lat: first?.latitude ?? 36.815,
      lon: first?.longitude ?? 127.113,
    };
  })();

  // 1. 지도 초기화 (최초 1회)
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || mapRef.current) return;
    setStatus('loading');
    kakaoLoader()
      .then(() => {
        if (!containerRef.current) return;
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(centerCoord.lat, centerCoord.lon),
          level: 4,
        });
        mapRef.current = map;
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMsg(err?.message || '지도 로드에 실패했습니다');
        setStatus('error');
      });
  }, []);

  // 2. 주차장 마커 및 핫스팟 업데이트
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    // 기존 마커 제거
    parkingMarkersRef.current.forEach(m => m.setMap(null));
    hotspotCirclesRef.current.forEach(c => c.setMap(null));
    parkingMarkersRef.current = [];
    hotspotCirclesRef.current = [];

    // 주차장 마커 생성
    parkingLots.filter(p => p.latitude && p.longitude).forEach(lot => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lot.latitude, lot.longitude),
        map
      });
      if (onMarkerClick) {
        window.kakao.maps.event.addListener(marker, 'click', () => onMarkerClick(lot.id));
      }
      parkingMarkersRef.current.push(marker);
    });

    // 핫스팟 원 생성
    if (showHotspots) {
      hotspots.filter(h => h.lat && h.lon).forEach(hotspot => {
        const radius = Math.min(Math.max(hotspot.count * 5, 50), 200);
        const circle = new window.kakao.maps.Circle({
          center: new window.kakao.maps.LatLng(hotspot.lat, hotspot.lon),
          radius,
          strokeWeight: 0,
          fillColor: '#FF0000',
          fillOpacity: 0.4,
          map
        });
        hotspotCirclesRef.current.push(circle);
      });
    }
  }, [status, parkingLots, showHotspots]); // hotspots omitted if coming with showHotspots

  // 3. 사용자 위치 및 목적지 업데이트
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    // 사용자 위치 마커 (Overlay 타입 재사용 보다는 간단히 매번 갱신하되 Overlay만)
    if (userLocation) {
        if (userMarkerRef.current) userMarkerRef.current.setMap(null);
        const locPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lon);
        userMarkerRef.current = new window.kakao.maps.CustomOverlay({
            position: locPosition,
            content: '<div style="width:14px;height:14px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>',
            map
        });

        // 주소 변환 (디바운싱: 10m 이상 이동 시에만 호출)
        if (onAddressFound) {
            const dist = lastAddrLoc ? Math.abs(lastAddrLoc.lat - userLocation.lat) + Math.abs(lastAddrLoc.lon - userLocation.lon) : 1;
            if (dist > 0.0001) { // 약 10m 이상
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.coord2Address(userLocation.lon, userLocation.lat, (result: any, st: any) => {
                   if (st === window.kakao.maps.services.Status.OK) {
                       onAddressFound(result[0]?.address?.address_name || '주소 정보 없음');
                       setLastAddrLoc(userLocation);
                   }
                });
            }
        }
    }

    // 목적지 마커
    if (targetLocation) {
        if (targetMarkerRef.current) {
            // 기존 마커 및 오버레이 제거 (배열이면 좋으나 여기선 단일 목적지)
            if (Array.isArray(targetMarkerRef.current)) {
                targetMarkerRef.current.forEach((i:any) => i.setMap(null));
            } else {
                targetMarkerRef.current.setMap(null);
            }
        }
        const locPosition = new window.kakao.maps.LatLng(targetLocation.lat, targetLocation.lon);
        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
        const marker = new window.kakao.maps.Marker({
            position: locPosition,
            map,
            image: new window.kakao.maps.MarkerImage(imageSrc, new window.kakao.maps.Size(24, 35)),
            zIndex: 10 
        });
        const overlay = new window.kakao.maps.CustomOverlay({
            position: locPosition,
            content: `<div style="padding:4px 10px;background-color:#2563eb;color:white;font-size:12px;font-weight:bold;border-radius:20px;box-shadow:0 2px 4px rgba(0,0,0,0.2);transform:translateY(-48px);white-space:nowrap;">📍 ${targetLocation.name}</div>`,
            map,
            zIndex: 10
        });
        targetMarkerRef.current = [marker, overlay];
    }
  }, [status, userLocation, targetLocation]); // targetLocation added

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
