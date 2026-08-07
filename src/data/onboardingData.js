import AestheticHigh from '../imports/Aesthetic_high.jpg'
import AestheticLow from '../imports/Aesthetic_low.jpg'
import DepthHigh from '../imports/Depth_high.jpg'
import DepthLow from '../imports/Depth_low.jpg'
import EnergeticHigh from '../imports/Energitic_high.jpg'
import EnergeticLow from '../imports/Energitic_low.jpg'
import ImmersionHigh from '../imports/Immersion_high.jpg'
import ImmersionLow from '../imports/Immersion_low.jpg'
import PacingHigh from '../imports/Pacing_high.jpg'
import PacingLow from '../imports/Pacing_low.jpg'
import VibeHigh from '../imports/Vibe_high.jpg'
import VibeLow from '../imports/Vibe_low.jpg'

export const PERSONA_AXES = [
  {
    id: 'aesthetic',
    label: 'Aesthetic',
    koreanLabel: '미감',
    question: '어떤 종류의 전시회를 더 선호하시나요?',
    lowLabel: '해설·작품',
    highLabel: '감각·공간',
    color: '#ff6b8a',
  },
  {
    id: 'depth',
    label: 'Depth',
    koreanLabel: '취향 깊이',
    question: '어떤 종류의 영화를 더 선호하시나요?',
    lowLabel: '가벼운 재미',
    highLabel: '깊은 서사',
    color: '#8f6dc2',
  },
  {
    id: 'energetic',
    label: 'Energetic',
    koreanLabel: '에너지',
    question: ' 어떤 종류의 공연을 더 선호하시나요?',
    lowLabel: '잔잔함',
    highLabel: '강한 활력',
    color: '#f29b38',
  },
  {
    id: 'immersion',
    label: 'Immersion',
    koreanLabel: '몰입',
    question: '어떤 종류의 연극을 더 선호하시나요?',
    lowLabel: '관람형',
    highLabel: '참여형',
    color: '#35a98f',
  },
  {
    id: 'pacing',
    label: 'Pacing',
    koreanLabel: '페이스',
    question: '당신의 데이트 혹은 여행 성향을 어떤가요?',
    lowLabel: '즉흥',
    highLabel: '계획',
    color: '#62a95f',
  },
  {
    id: 'vibe',
    label: 'Vibe',
    koreanLabel: '분위기',
    question: '휴일에 어떤 데이트 장소를 선호하시나요?',
    lowLabel: '로컬',
    highLabel: '프리미엄',
    color: '#d85b84',
  },
]

export const ONBOARDING_MATCHUPS = [
  {
    id: 'aesthetic-matchup',
    axis: 'aesthetic',
    options: [
      {
        id: 'aesthetic-low',
        variant: 'low',
        polarity: -1,
        image: AestheticLow,
        label: '해설과 작품 중심',
        label2:'작품의 배경과 도슨트의 설명을 따라가며 깊이 있게 이해하는 관람',
        alt: '여러 작품과 해설이 함께하는 전시 공간',
      },
      {
        id: 'aesthetic-high',
        variant: 'high',
        polarity: 1,
        image: AestheticHigh,
        label: '감각적인 공간 중심',
        label2:'화려한 시각적 연출과 감각적인 공간 자체를 즐기는 관람',
        alt: '초록빛 정원과 연못이 어우러진 몰입형 공간',
      },
    ],
  },
  {
    id: 'depth-matchup',
    axis: 'depth',
    options: [
      {
        id: 'depth-low',
        variant: 'low',
        polarity: -1,
        image: DepthLow,
        label: '가볍고 대중적인 재미',
        label2:'재미있게 즐길 수 있는 대중적인 작품',
        alt: '대중적인 재미와 액션이 돋보이는 영화 포스터',
      },
      {
        id: 'depth-high',
        variant: 'high',
        polarity: 1,
        image: DepthHigh,
        label: '감정과 서사의 깊이',
        label2:' 작품성 중심, 깊이 있는 딥다이브',
        alt: '감정과 관계를 깊게 다루는 예술 영화 포스터',
      },
    ],
  },
  {
    id: 'energetic-matchup',
    axis: 'energetic',
    options: [
      {
        id: 'energetic-low',
        variant: 'low',
        polarity: -1,
        image: EnergeticLow,
        label: '잔잔한 라이브',
        label2:'소극장 등 조용하고 여유롭게 에너지를 채우는 공연',
        alt: '차분한 분위기에서 즐기는 소규모 라이브 공연',
      },
      {
        id: 'energetic-high',
        variant: 'high',
        polarity: 1,
        image: EnergeticHigh,
        label: '뜨거운 페스티벌',
        label2:'뜨거운 페스티벌, 에너지 넘치는 대형 페스티벌',
        alt: '수많은 관객이 함께 즐기는 야외 음악 페스티벌',
      },
    ],
  },
  {
    id: 'immersion-matchup',
    axis: 'immersion',
    options: [
      {
        id: 'immersion-low',
        variant: 'low',
        polarity: -1,
        image: ImmersionLow,
        label: '집중해서 관람하기',
        label2:'무대와 객석이 구분되어 차분하게 극의 흐름에 집중하는 일반적인 연극',
        alt: '좌석에서 집중해 감상하는 무대 공연',
      },
      {
        id: 'immersion-high',
        variant: 'high',
        polarity: 1,
        image: ImmersionHigh,
        label: '공간에 직접 참여하기',
        label2:'공간과 연출의 일부가 되어 직접 체험하고 즐기는 방식',
        alt: '테마 공간 안에서 적극적으로 참여하는 몰입형 체험',
      },
    ],
  },
  {
    id: 'pacing-matchup',
    axis: 'pacing',
    options: [
      {
        id: 'pacing-low',
        variant: 'low',
        polarity: -1,
        image: PacingLow,
        label: '여유롭게 즉흥적으로',
        label2:'정해진 규칙 없이 순간의 이끌림과 여유를 즐기는 낭만',
        alt: '여유와 즉흥성을 강조한 간단한 여행 계획',
      },
      {
        id: 'pacing-high',
        variant: 'high',
        polarity: 1,
        image: PacingHigh,
        label: '꼼꼼하게 계획해서',
        label2:'일정을 꼼꼼하게 짜고 동선에 맞춰 알차게 움직이는 스타일',
        alt: '시간대별 일정이 촘촘하게 정리된 여행 계획표',
      },
    ],
  },
  {
    id: 'vibe-matchup',
    axis: 'vibe',
    options: [
      {
        id: 'vibe-low',
        variant: 'low',
        polarity: -1,
        image: VibeLow,
        label: '친근한 로컬 감성',
        label2:'정겨운 동네나 차분하게 머물 수 있는 친근한 공간',
        alt: '작은 상점과 사람들이 어우러진 친근한 동네 거리',
      },
      {
        id: 'vibe-high',
        variant: 'high',
        polarity: 1,
        image: VibeHigh,
        label: '팝업 스토어나 프리미엄 감성',
        label2:'트렌드를 가장 먼저 체감할 수 있는 힙하고 세련된 공간',
        alt: '화려한 조명과 정제된 외관의 프리미엄 공간',
      },
    ],
  },
]

// 축(id)별 high/low 사진을 한 번에 찾기 위한 매핑 테이블입니다.
export const PERSONA_AXIS_IMAGES = {
  aesthetic: { high: AestheticHigh, low: AestheticLow },
  depth: { high: DepthHigh, low: DepthLow },
  energetic: { high: EnergeticHigh, low: EnergeticLow },
  immersion: { high: ImmersionHigh, low: ImmersionLow },
  pacing: { high: PacingHigh, low: PacingLow },
  vibe: { high: VibeHigh, low: VibeLow },
}

// score(0~100 가정)가 50 이상이면 high 사진, 미만이면 low 사진을 돌려줍니다.
export function getPersonaImage(axisId, score) {
  const images = PERSONA_AXIS_IMAGES[axisId]
  if (!images) return null
  return score >= 50 ? images.high : images.low
}

export function buildPersonaResult(responses) {
  const details = PERSONA_AXES.reduce((result, axis) => {
    const response = responses.find(item => item.axis === axis.id)
    const preference = response?.selectedVariant ?? null
    const score = preference === 'high' ? 75 : preference === 'low' ? 25 : 50

    result[axis.id] = {
      score,
      preference,
      selectedOptionId: response?.selectedOptionId ?? null,
      selectedLabel: response?.selectedLabel ?? null,
      answerType: response?.answerType ?? null,
      answeredCount: response ? 1 : 0,
      confidence: response ? 100 : 0,
    }

    return result
  }, {})

  return {
    version: 2,
    mode: 'pair-comparison',
    scores: Object.fromEntries(
      Object.entries(details).map(([axis, detail]) => [axis, detail.score]),
    ),
    preferences: Object.fromEntries(
      Object.entries(details).map(([axis, detail]) => [axis, detail.preference]),
    ),
    details,
    responses,
    completedAt: new Date().toISOString(),
  }
}
