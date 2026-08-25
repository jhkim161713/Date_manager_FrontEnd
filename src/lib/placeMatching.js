import { PERSONA_AXES } from '../data/onboardingData';

// 유저 성향 축 <-> 장소 성향 점수 필드 매핑. HomeTab.jsx의 동일 매핑과 같은 기준.
const AXIS_TO_PLACE_SCORE = {
  energetic: 'scoreEnergy',
  immersion: 'scoreImmersion',
  vibe: 'scoreVibe',
  aesthetic: 'scoreAesthetic',
  depth: 'scoreDepth',
  // 즉흥·계획(2026-08-20 추가) - 웨이팅 등 실제 데이터가 아직 없어 대부분 중립(50)이지만, 세부분류별로
  // 근거가 채워지는 대로(맛집부터) 매칭에 반영되도록 축 자체는 다른 5개와 동일하게 연결해둔다.
  pacing: 'scorePacing',
};
const MATCHABLE_AXES = PERSONA_AXES.filter((axis) => AXIS_TO_PLACE_SCORE[axis.id]);

// 원본 기획서("스마트 데이트 큐레이션 - Style Sync Engine")의 핵심인 "장소 성향과 유저 성향을
// 비교해 가장 특징적인 상위 성향을 배지로 노출"을 구현한다(2026-08-19). 장소가 실제로 강조하는
// 축(50에서 많이 벗어난 축)일수록 그 축이 유저와 가까운지가 더 의미 있어서, 단순 거리가 아니라
// "장소가 그 축에서 얼마나 뚜렷한가(강조도) - 유저와의 거리"로 점수를 매겨 상위 2개를 뽑는다.
export function pickMatchingAxes(place, personaProfile) {
  const scored = MATCHABLE_AXES
    .map((axis) => {
      const scoreField = AXIS_TO_PLACE_SCORE[axis.id];
      const placeScore = place[scoreField];
      if (placeScore == null) return null;
      const emphasis = Math.abs(placeScore - 50); // 장소가 이 축을 얼마나 뚜렷하게 강조하는지
      // 정확히 50(중립)이면 그 축에서 특별히 내세울 성향이 없다는 뜻이라 배지 후보에서 아예 제외한다
      // (2026-08-20) - 안 그러면 전부 중립인 장소에도 억지로 배지 2개가 뜨는 문제가 있었음.
      if (emphasis === 0) return null;
      const userScore = personaProfile?.scores?.[axis.id] ?? 50;
      const distance = Math.abs(placeScore - userScore); // 유저 성향과의 거리
      return { axis, weight: emphasis - distance };
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);
  return scored.slice(0, 2).map((entry) => entry.axis);
}
