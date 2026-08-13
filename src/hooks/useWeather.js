import { useEffect, useState } from 'react';
import { getCurrentWeather, getCurrentLocation } from '../lib/weather';

const DEFAULT_WEATHER = { icon: '⛅', temp: '—', desc: '날씨 불러오는 중' };

export function useWeather() {
  const [weather, setWeather] = useState(DEFAULT_WEATHER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { lat, lon } = await getCurrentLocation();
        const data = await getCurrentWeather(lat, lon);
        // 로그인 전이라 /api/weather가 인증 실패로 빈 응답을 줄 때도 있어서 null 방어
        if (!cancelled) setWeather(data ?? { icon: '⛅', temp: '—', desc: '날씨 정보를 불러오지 못했어요' });
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setWeather({ icon: '⛅', temp: '—', desc: '날씨 정보를 불러오지 못했어요' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, loading, error };
}
