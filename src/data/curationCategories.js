// 큐레이션 탭 "데이트" 화면의 카테고리 칩. 예전엔 "모드"(패시브/액티브)라는 목업 전용 분류로
// 감싸져 있었는데, 실제 DB엔 그런 개념이 없고 9개 대분류(Place.category)만 존재해서 모드를
// 없애고 대분류를 바로 필터로 쓰기로 했다(2026-08-14). 숙박은 큐레이션 탭에서 별도 화면(STAY_HERO)을
// 이미 갖고 있어서 여기 목록에서는 뺐다.
//
// `categories`가 배열인 이유: 실제 Place.category 값이 사람이 정한 9개 대분류와 항상 일치하지
// 않는다 - KOPIS 동기화(PlaceSyncService)가 공연은 "공연"이 아니라 장르명(genrenm) 그대로 저장하고,
// 문화행사(CultureEventSyncService)는 "전시" 대신 "문화시설"로 저장한다. 그래서 칩 하나가 실제로는
// 여러 category 값을 가리켜야 하는 경우가 있어, 라벨/이모지는 우리가 정한 대로 두고 backend 조회
// 시에만 이 배열을 콤마로 묶어 보낸다(getCurationPlaces).
export const DATE_CATEGORIES = [
  { id: '맛집', emoji: '🍽️', label: '맛집', color: '#ff6b8a', background: '#fff0f3', categories: ['맛집'] },
  {
    id: '공연', emoji: '🎭', label: '공연', color: '#df9235', background: '#fff6e7',
    categories: [
      '공연', '서양음악(클래식)', '연극', '뮤지컬', '대중음악',
      '한국음악(국악)', '서커스/마술', '무용(서양/한국무용)', '복합', '대중무용',
    ],
  },
  { id: '전시', emoji: '🖼️', label: '전시', color: '#9870bd', background: '#f5effa', categories: ['문화시설'] },
  { id: '박물관·미술관', emoji: '🎨', label: '박물관·미술관', color: '#8b6dc0', background: '#f4f0fb', categories: ['박물관/미술관'] },
  { id: '관광지', emoji: '🏞️', label: '관광지', color: '#3d9b86', background: '#eaf8f4', categories: ['관광지'] },
  { id: '액티비티', emoji: '🧗', label: '액티비티', color: '#f9a030', background: '#fff4e8', categories: ['액티비티'] },
  { id: '쇼핑', emoji: '🛍️', label: '쇼핑', color: '#e96f78', background: '#fff0f2', categories: ['쇼핑'] },
  { id: '축제', emoji: '🎉', label: '축제', color: '#ed8252', background: '#fff1e9', categories: ['축제'] },
  // 2026-08-20 신규 - SportsSyncService가 채워 넣는 국내 프로스포츠 예정 경기(야구/축구, 추후
  // 농구/배구). "액티비티"(방탈출/클라이밍 등 직접 참여형 체험)와는 성격이 달라서(관람형이라
  // "공연" 칩에 더 가까움 - 실제로 is_activity 점수도 액티비티류보다 낮게 매겨져 있음) 별도 칩으로 둠.
  { id: '스포츠', emoji: '🏟️', label: '스포츠', color: '#3b82c4', background: '#eaf3fb', categories: ['스포츠'] },
];

// 홈탭 "내 주변" 칩용 - 데이트 8개 + 숙박 칩까지 다시 노출한다(2026-08-18). 숙박을 직접 선택했을 땐
// 보여야 하니 칩 자체는 있어야 하고, 대신 "전체" 선택 시에는 HomeTab에서 숙박을 걸러낸다(6대 성향
// 매칭과 안 맞아서 전체 추천에 섞이면 어색해서) - 칩 목록과 "전체" 기본 노출을 분리하는 방식.
export const HOME_CATEGORIES = [
  ...DATE_CATEGORIES,
  { id: '숙박', emoji: '🌙', label: '숙박', color: '#c4a0e8', background: '#f5eefb', categories: ['숙박'] },
];
