// "AI 코스 추천" 기준 위치 칩(2026-09-01 추가) - 예전엔 GPS 위치(또는 실패 시 서울 종로) 하나로만
// 반경 10km를 잡아서, 사용자가 원하는 동네가 아닌 엉뚱한 곳 기준으로 추천되는 문제가 있었다.
// 데이트 코스로 자주 찾는 동네 프리셋을 칩으로 두고, 직접 기준 위치를 고를 수 있게 한다.
// '내 위치'는 좌표가 없고 useCurrentLocation으로 표시해서 매번 GPS를 다시 구하도록 한다.
export const AI_COURSE_AREAS = [
  { key: 'current', label: '📍 내 위치', useCurrentLocation: true },
  { key: 'gangnam', label: '강남', lat: 37.4979, lon: 127.0276 },
  { key: 'hongdae', label: '홍대', lat: 37.5563, lon: 126.9236 },
  { key: 'seongsu', label: '성수', lat: 37.5445, lon: 127.0562 },
  { key: 'itaewon', label: '이태원', lat: 37.5346, lon: 126.9946 },
  { key: 'jamsil', label: '잠실', lat: 37.5133, lon: 127.1000 },
  { key: 'yeouido', label: '여의도', lat: 37.5219, lon: 126.9245 },
  { key: 'jongno', label: '종로', lat: 37.5735, lon: 126.9788 },
];
