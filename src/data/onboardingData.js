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
    question: '어떤 미감의 데이트가 더 끌리나요?',
    lowLabel: '해설·작품',
    highLabel: '감각·공간',
    color: '#ff6b8a',
  },
  {
    id: 'depth',
    label: 'Depth',
    koreanLabel: '취향 깊이',
    question: '어떤 이야기의 깊이가 더 끌리나요?',
    lowLabel: '가벼운 재미',
    highLabel: '깊은 서사',
    color: '#8f6dc2',
  },
  {
    id: 'energetic',
    label: 'Energetic',
    koreanLabel: '에너지',
    question: '어떤 에너지의 데이트가 더 끌리나요?',
    lowLabel: '잔잔함',
    highLabel: '강한 활력',
    color: '#f29b38',
  },
  {
    id: 'immersion',
    label: 'Immersion',
    koreanLabel: '몰입',
    question: '어떤 방식으로 몰입하고 싶나요?',
    lowLabel: '관람형',
    highLabel: '참여형',
    color: '#35a98f',
  },
  {
    id: 'pacing',
    label: 'Pacing',
    koreanLabel: '페이스',
    question: '어떤 데이트 페이스가 더 편한가요?',
    lowLabel: '즉흥',
    highLabel: '계획',
    color: '#62a95f',
  },
  {
    id: 'vibe',
    label: 'Vibe',
    koreanLabel: '분위기',
    question: '어떤 공간의 분위기가 더 끌리나요?',
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
        alt: '여러 작품과 해설이 함께하는 전시 공간',
      },
      {
        id: 'aesthetic-high',
        variant: 'high',
        polarity: 1,
        image: AestheticHigh,
        label: '감각적인 공간 중심',
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
        alt: '대중적인 재미와 액션이 돋보이는 영화 포스터',
      },
      {
        id: 'depth-high',
        variant: 'high',
        polarity: 1,
        image: DepthHigh,
        label: '감정과 서사의 깊이',
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
        alt: '차분한 분위기에서 즐기는 소규모 라이브 공연',
      },
      {
        id: 'energetic-high',
        variant: 'high',
        polarity: 1,
        image: EnergeticHigh,
        label: '뜨거운 페스티벌',
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
        alt: '좌석에서 집중해 감상하는 무대 공연',
      },
      {
        id: 'immersion-high',
        variant: 'high',
        polarity: 1,
        image: ImmersionHigh,
        label: '공간에 직접 참여하기',
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
        alt: '여유와 즉흥성을 강조한 간단한 여행 계획',
      },
      {
        id: 'pacing-high',
        variant: 'high',
        polarity: 1,
        image: PacingHigh,
        label: '꼼꼼하게 계획해서',
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
        alt: '작은 상점과 사람들이 어우러진 친근한 동네 거리',
      },
      {
        id: 'vibe-high',
        variant: 'high',
        polarity: 1,
        image: VibeHigh,
        label: '정제된 프리미엄 감성',
        alt: '화려한 조명과 정제된 외관의 프리미엄 공간',
      },
    ],
  },
]

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
