export const QUESTIONS = [
  {
    q: '데이트 장소를 고른다면?',
    options: [
      { label: '분위기 좋은 레스토랑', type: 'romantic' },
      { label: '클라이밍·볼링 같은 스포츠', type: 'active' },
      { label: '전시회나 뮤지컬', type: 'cultural' },
      { label: '유명 맛집 탐방', type: 'foodie' },
    ],
  },
  {
    q: '주말 오후에 하고 싶은 것은?',
    options: [
      { label: '아늑한 카페에서 대화', type: 'romantic' },
      { label: '자전거 타거나 산책', type: 'active' },
      { label: '영화·공연 관람', type: 'cultural' },
      { label: '새로운 카페·베이커리 탐방', type: 'foodie' },
    ],
  },
  {
    q: '기념일에 가장 원하는 선물은?',
    options: [
      { label: '감성적인 편지 + 꽃다발', type: 'romantic' },
      { label: '함께하는 익스트림 체험권', type: 'active' },
      { label: '공연·전시 티켓', type: 'cultural' },
      { label: '미쉐린 레스토랑 예약', type: 'foodie' },
    ],
  },
  {
    q: '여행지 선택 기준은?',
    options: [
      { label: '야경이 아름다운 곳', type: 'romantic' },
      { label: '스키·서핑 등 액티비티', type: 'active' },
      { label: '독특한 문화·역사 유적', type: 'cultural' },
      { label: '현지 맛집이 풍부한 곳', type: 'foodie' },
    ],
  },
]

export const TYPE_RESULT: Record<string, { label: string; emoji: string; desc: string; recommend: string[]; color: string; bg: string }> = {
  romantic:  { label: '로맨틱형',   emoji: '🌹', color: '#ff6b8a', bg: '#fff0f3', desc: '분위기와 감성을 중시하는 로맨티스트 커플! 따뜻한 조명과 아늑한 공간에서 서로에게 집중하는 데이트를 좋아해요.', recommend: ['야경 루프탑 레스토랑', '감성 사진관 투어', '한강 야경 크루즈', '향수 만들기 클래스'] },
  active:    { label: '액티브형',   emoji: '⚡', color: '#f9a030', bg: '#fff8e6', desc: '에너지 넘치는 액션파 커플! 함께 땀 흘리고 새로운 도전을 즐기며 더욱 돈독해져요.', recommend: ['실내 클라이밍', '서핑 레슨', '번지점프 체험', '커플 마라톤 참가'] },
  cultural:  { label: '문화탐험형', emoji: '🎭', color: '#c4a0e8', bg: '#f5eef9', desc: '예술과 문화를 사랑하는 감수성 풍부한 커플! 전시회부터 연극까지 다양한 문화생활을 즐겨요.', recommend: ['현대미술 특별전', '소극장 연극', '재즈 라이브 클럽', '독립 영화제'] },
  foodie:    { label: '미식가형',   emoji: '🍜', color: '#4dbfa8', bg: '#e6f9f5', desc: '맛있는 음식이 최고의 데이트! 새로운 맛집과 카페를 발굴하는 탐험가 커플이에요.', recommend: ['오마카세 레스토랑', '베이커리 카페 투어', '전통시장 탐방', '쿠킹 클래스'] },
}