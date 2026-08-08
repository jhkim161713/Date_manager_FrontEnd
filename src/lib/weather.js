import { getWeather } from './api';

// 위치 정보를 못 받을 때 대체할 기본 좌표 (서울 종로구)
export const FALLBACK_LOCATION = { lat: 37.5729, lon: 126.9794 };

export function getCurrentWeather(lat, lon) {
  return getWeather(lat, lon);
}
