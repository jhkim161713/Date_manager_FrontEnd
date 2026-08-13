// 모드 3개(패시브/액티브/숙박)는 서로 다른 컨셉이라 각자 색을 유지하되, 전부 앱 브랜드 색상
// 체계 안에서 가져온다 - 패시브=브랜드 핑크, 액티브=데이트 캘린더 탭과 같은 오렌지, 숙박=브랜드
// 퍼플. 반면 한 모드 안의 카테고리 4개는 굳이 각자 다른 색일 필요가 없어서(이미 이모지+텍스트로
// 구분됨) 전부 그 모드의 대표색 하나로 통일했다(2026-08-13, 예전엔 카테고리마다 색이 다 달라서
// 화면에 색이 너무 많다는 지적이 있었음).
export const CURATION_MODES = {
  passive: {
    id: 'passive',
    label: '패시브 모드',
    emoji: '🌿',
    title: '천천히 머물며 즐기는 데이트',
    description: '대화와 감상을 나누며 천천히 즐기는 데이트를 준비해보세요.',
    accent: '#ff6b8a', // 브랜드 핑크
    gradient: 'linear-gradient(125deg, #fff0f3 0%, #fff8f4 55%, #f5effb 100%)',
    categories: [
      { id: 'restaurant', label: '맛집', emoji: '🍽️', description: '분위기 좋은 한 끼', color: '#ff6b8a', background: '#fff0f3' },
      { id: 'exhibition', label: '전시', emoji: '🖼️', description: '나란히 걷는 감상', color: '#ff6b8a', background: '#fff0f3' },
      { id: 'theater', label: '연극', emoji: '🎭', description: '함께 빠지는 이야기', color: '#ff6b8a', background: '#fff0f3' },
      { id: 'cafe', label: '카페', emoji: '☕', description: '오래 나누는 대화', color: '#ff6b8a', background: '#fff0f3' },
    ],
  },
  active: {
    id: 'active',
    label: '액티브 모드',
    emoji: '⚡',
    title: '함께 움직이며 채우는 데이트',
    description: '새로운 경험과 활기찬 에너지로 채우는 데이트를 준비해보세요.',
    accent: '#f9a030', // 데이트 캘린더 탭과 같은 오렌지(앱에 이미 있는 색 재사용)
    gradient: 'linear-gradient(125deg, #fff4e8 0%, #fff9f3 52%, #eef8f1 100%)',
    categories: [
      { id: 'festival', label: '페스티벌', emoji: '🎉', description: '음악과 축제의 열기', color: '#f9a030', background: '#fff4e8' },
      { id: 'exhibition', label: '전시', emoji: '🪩', description: '직접 참여하는 전시', color: '#f9a030', background: '#fff4e8' },
      { id: 'activity', label: '액티비티', emoji: '🧗', description: '함께하는 작은 도전', color: '#f9a030', background: '#fff4e8' },
      { id: 'restaurant', label: '맛집', emoji: '🔥', description: '활동 뒤 든든한 한 끼', color: '#f9a030', background: '#fff4e8' },
    ],
  },
};

export const CURATION_ITEMS = [
  {
    id: 'p-food-1', mode: 'passive', category: 'restaurant', title: '루프탑 이탈리안 라 루나',
    subtitle: '노을과 함께 천천히 즐기는 파스타 코스', tag: '이탈리안', tagColor: '#ef765f', tagBg: '#fff0eb',
    match: 96, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&h=460&fit=crop&auto=format',
    location: '한남동', price: 68000, duration: 90,
  },
  {
    id: 'p-food-2', mode: 'passive', category: 'restaurant', title: '한옥 다이닝 온담',
    subtitle: '고즈넉한 공간에서 맛보는 따뜻한 한식', tag: '한식', tagColor: '#a06f56', tagBg: '#f8f0eb',
    match: 92, img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=700&h=460&fit=crop&auto=format',
    location: '익선동', price: 52000, duration: 85,
  },
  {
    id: 'p-exhibit-1', mode: 'passive', category: 'exhibition', title: '국립현대미술관 특별전',
    subtitle: '작품 사이를 거닐며 나누는 취향 이야기', tag: '미술관', tagColor: '#9870bd', tagBg: '#f5effa',
    match: 97, img: 'https://images.unsplash.com/photo-1606819717115-9159c900370b?w=700&h=460&fit=crop&auto=format',
    location: '종로구', price: 10000, duration: 100,
  },
  {
    id: 'p-exhibit-2', mode: 'passive', category: 'exhibition', title: '석파정 서울미술관',
    subtitle: '정원과 전시를 함께 즐기는 느긋한 오후', tag: '미술관', tagColor: '#9870bd', tagBg: '#f5effa',
    match: 91, img: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=700&h=460&fit=crop&auto=format',
    location: '부암동', price: 30000, duration: 120,
  },
  {
    id: 'p-theater-1', mode: 'passive', category: 'theater', title: '대학로 로맨틱 코미디',
    subtitle: '가볍게 웃고 오래 이야기하기 좋은 공연', tag: '소극장', tagColor: '#df9235', tagBg: '#fff6e7',
    match: 94, img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=700&h=460&fit=crop&auto=format',
    location: '대학로', price: 44000, duration: 110,
  },
  {
    id: 'p-theater-2', mode: 'passive', category: 'theater', title: '정동극장 음악극',
    subtitle: '잔잔한 음악과 서사가 흐르는 저녁', tag: '음악극', tagColor: '#df9235', tagBg: '#fff6e7',
    match: 89, img: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=700&h=460&fit=crop&auto=format',
    location: '정동', price: 60000, duration: 120,
  },
  {
    id: 'p-cafe-1', mode: 'passive', category: 'cafe', title: '성수 감성 베이커리 카페',
    subtitle: '수제 디저트와 햇살 좋은 창가 자리', tag: '베이커리', tagColor: '#98694f', tagBg: '#f8f0eb',
    match: 95, img: 'https://images.unsplash.com/photo-1600353565737-2427a1ba3d3a?w=700&h=460&fit=crop&auto=format',
    location: '성수동', price: 22000, duration: 70,
  },
  {
    id: 'p-cafe-2', mode: 'passive', category: 'cafe', title: '서촌 한옥 티룸',
    subtitle: '차 향과 작은 정원이 있는 조용한 공간', tag: '티룸', tagColor: '#98694f', tagBg: '#f8f0eb',
    match: 93, img: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=700&h=460&fit=crop&auto=format',
    location: '서촌', price: 24000, duration: 80,
  },
  {
    id: 'a-festival-1', mode: 'active', category: 'festival', title: '한강 뮤직 피크닉',
    subtitle: '잔디 위에서 함께 즐기는 라이브 스테이지', tag: '뮤직 페스티벌', tagColor: '#e96f78', tagBg: '#fff0f2',
    match: 97, img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=700&h=460&fit=crop&auto=format',
    location: '여의도', price: 80000, duration: 240,
  },
  {
    id: 'a-festival-2', mode: 'active', category: 'festival', title: '서울 야간 푸드 페스타',
    subtitle: '다양한 음식과 공연이 이어지는 활기찬 밤', tag: '푸드 페스티벌', tagColor: '#e96f78', tagBg: '#fff0f2',
    match: 91, img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=700&h=460&fit=crop&auto=format',
    location: '반포', price: 40000, duration: 180,
  },
  {
    id: 'a-exhibit-1', mode: 'active', category: 'exhibition', title: '미디어아트 스페이스',
    subtitle: '빛과 사운드 속을 직접 걷는 몰입형 전시', tag: '미디어아트', tagColor: '#8b6dc0', tagBg: '#f4f0fb',
    match: 95, img: 'https://images.unsplash.com/photo-1551913902-c92207136625?w=700&h=460&fit=crop&auto=format',
    location: '성수동', price: 36000, duration: 90,
  },
  {
    id: 'a-exhibit-2', mode: 'active', category: 'exhibition', title: '인터랙티브 컬러 랩',
    subtitle: '움직임에 반응하는 색과 소리를 체험해요', tag: '체험전시', tagColor: '#8b6dc0', tagBg: '#f4f0fb',
    match: 90, img: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=700&h=460&fit=crop&auto=format',
    location: '용산', price: 32000, duration: 85,
  },
  {
    id: 'a-activity-1', mode: 'active', category: 'activity', title: '한강 카약 선셋 투어',
    subtitle: '둘이 노를 맞추며 바라보는 서울의 노을', tag: '수상 액티비티', tagColor: '#3d9b86', tagBg: '#eaf8f4',
    match: 96, img: 'https://images.unsplash.com/photo-1682985045797-0b781d0c0f7a?w=700&h=460&fit=crop&auto=format',
    location: '뚝섬', price: 50000, duration: 100,
  },
  {
    id: 'a-activity-2', mode: 'active', category: 'activity', title: '커플 클라이밍 클래스',
    subtitle: '서로 응원하며 완등하는 원데이 클래스', tag: '클라이밍', tagColor: '#3d9b86', tagBg: '#eaf8f4',
    match: 93, img: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=700&h=460&fit=crop&auto=format',
    location: '신촌', price: 48000, duration: 110,
  },
  {
    id: 'a-food-1', mode: 'active', category: 'restaurant', title: '성수 화덕 피자 키친',
    subtitle: '활동 뒤 나눠 먹기 좋은 뜨거운 화덕 피자', tag: '피자', tagColor: '#ed8252', tagBg: '#fff1e9',
    match: 94, img: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=700&h=460&fit=crop&auto=format',
    location: '성수동', price: 46000, duration: 75,
  },
  {
    id: 'a-food-2', mode: 'active', category: 'restaurant', title: '을지로 숯불 바비큐',
    subtitle: '하루를 든든하게 마무리하는 그릴 플래터', tag: '바비큐', tagColor: '#ed8252', tagBg: '#fff1e9',
    match: 90, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&h=460&fit=crop&auto=format',
    location: '을지로', price: 62000, duration: 85,
  },
];

export const BUILDER_STORAGE_KEY = 'dateManager.builderQueue.v1';

// 기존 화면에서 CURIATION을 import하던 경우를 위한 호환 export입니다.
export const CURIATION = CURATION_ITEMS;
