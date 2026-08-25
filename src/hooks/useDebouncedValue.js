import { useEffect, useState } from 'react';

// 타이핑마다 요청을 보내면 너무 잦아서, delay 동안 값이 안 바뀔 때만 반환값을 갱신한다
// (원래 CurationTab.jsx의 검색어 디바운스 로직이었는데 여러 탭에서 재사용할 수 있게 일반화함).
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
