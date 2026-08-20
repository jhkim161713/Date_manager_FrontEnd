// 숙박 히어로 배너 문구/색상.
export const STAY_HERO = {
  label: 'STAY CURATION',
  emoji: '🌙',
  title: '데이트의 여운을 이어가는 숙박',
  description: '우리의 일정과 취향에 맞는 숙소를 골라 편안한 하루의 마무리를 준비해 보세요.',
  accent: '#c4a0e8', // 브랜드 퍼플
  gradient: 'linear-gradient(125deg, #f7f1ff 0%, #fff8f4 52%, #eef7ff 100%)',
};

// 숙박 탭 세부분류 칩 - place_categories에 오늘 만든 6개 숙박 세부분류 그대로 사용(2026-08-14).
// 자동 연결(PlaceCategoryLinker)이 안 된 장소는 어느 칩에도 안 걸리는데, 그건 "전체" 칩(선택 없음)에서는
// 계속 보인다 - 세부분류가 없다고 숨기지 않는다.
export const STAY_CATEGORIES = [
  { id: '호텔', emoji: '🏨', label: '호텔', color: '#c4a0e8', background: '#f5eefb' },
  { id: '리조트', emoji: '🏝️', label: '리조트', color: '#c4a0e8', background: '#f5eefb' },
  { id: '펜션', emoji: '🏡', label: '펜션', color: '#c4a0e8', background: '#f5eefb' },
  { id: '한옥', emoji: '🏯', label: '한옥', color: '#c4a0e8', background: '#f5eefb' },
  { id: '게스트하우스', emoji: '🛏️', label: '게스트하우스', color: '#c4a0e8', background: '#f5eefb' },
  { id: '모텔', emoji: '🛌', label: '모텔', color: '#c4a0e8', background: '#f5eefb' },
];
