// yyyy-MM-dd 형태로 날짜를 맞춰주는 헬퍼
export function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 일정마다 살짝 다른 색을 순환해서 입혀주는 팔레트 (카테고리 데이터가 없어서 id 기반으로 배정)
const PALETTE = [
  { bg: '#ffe3ea', text: '#ff6b8a' },
  { bg: '#efe3fb', text: '#a76bd6' },
  { bg: '#e3edfb', text: '#5b8dd6' },
  { bg: '#fff0d9', text: '#e2a23b' },
];
export function colorFor(id) {
  return PALETTE[Math.abs(id) % PALETTE.length];
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 주간 뷰에서 해당 주의 일요일 ~ 토요일 날짜를 구해주는 헬퍼
export function getWeekDates(baseDate) {
  const date = new Date(baseDate);
  const day = date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
