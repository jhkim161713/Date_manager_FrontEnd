export const TABS = [
  { id: 'home',         label: '홈',             emoji: '🏠' },
  { id: 'couple',       label: '내 파트너 링크',  emoji: '💞' },
  { id: 'curiation',     label: '데이트 큐레이션', emoji: '🎬' },
  { id: 'builder',      label: '데이트 코스 빌더', emoji: '🛣️' },
  { id: 'calendar',     label: '데이트 캘린더',   emoji: '📅' },
  { id: 'aichat',       label: 'AI 데이트 상담', emoji: '🤖' },
  { id: 'board',        label: '게시판',         emoji: '📋' },
];

// 2026-08-22 - 예전엔 홈/파트너링크/큐레이션이 전부 같은 핑크(#ff6b8a)에 빌더만 보라, 캘린더만
// 주황이라 "왜 이 둘만 다른색이지" 싶은 어중간한 배색이었고, TABS 7개 중 5개만 칩으로 있어서
// AI 데이트 상담/게시판은 여기서 못 갔다. curationCategories.js(오늘의 추천 문화생활 칩)에서
// 이미 쓰고 있는 팔레트를 그대로 가져와 TABS와 동일한 이모지·문구로, 7개 전부 서로 다른 색을
// 주되 새 색을 만들지 않고 기존 앱 팔레트 안에서만 골라 통일감을 유지했다.
export const QUICK_TABS = [
  { tab: 'home', label: '홈', emoji: '🏠', color: '#ff6b8a' },
  { tab: 'couple', label: '내 파트너 링크', emoji: '💞', color: '#e96f78' },
  { tab: 'curiation', label: '데이트 큐레이션', emoji: '🎬', color: '#3d9b86' },
  { tab: 'builder', label: '데이트 코스 빌더', emoji: '🛣️', color: '#c4a0e8' },
  { tab: 'calendar', label: '데이트 캘린더', emoji: '📅', color: '#3b82c4' },
  { tab: 'aichat', label: 'AI 데이트 상담', emoji: '🤖', color: '#df9235' },
  { tab: 'board', label: '게시판', emoji: '📋', color: '#9870bd' },
];