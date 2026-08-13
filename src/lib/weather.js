import { getWeather } from './api';

// 위치 정보를 못 받을 때 대체할 기본 좌표 (서울 종로구)
export const FALLBACK_LOCATION = { lat: 37.5729, lon: 126.9794 };

export function getCurrentWeather(lat, lon) {
  return getWeather(lat, lon);
}

// 브라우저 위치 정보 - 날씨 기능에서 쓰던 것과 같은 방식(권한 거부/실패 시 서울 기준으로 대체).
// HomeTab의 지역 기반 장소 추천에서도 그대로 재사용한다(2026-08-13).
export function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(FALLBACK_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(FALLBACK_LOCATION),
      { timeout: 5000 }
    );
  });
}
