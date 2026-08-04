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
    lowLabel: '해설·작품',
    highLabel: '감각·공간',
    color: '#ff6b8a',
  },
  {
    id: 'depth',
    label: 'Depth',
    koreanLabel: '취향 깊이',
    lowLabel: '가벼운 재미',
    highLabel: '깊은 서사',
    color: '#8f6dc2',
  },
  {
    id: 'energetic',
    label: 'Energetic',
    koreanLabel: '에너지',
    lowLabel: '잔잔함',
    highLabel: '강한 활력',
    color: '#f29b38',
  },
  {
    id: 'immersion',
    label: 'Immersion',
    koreanLabel: '몰입',
    lowLabel: '관람형',
    highLabel: '참여형',
    color: '#35a98f',
  },
  {
    id: 'pacing',
    label: 'Pacing',
    koreanLabel: '페이스',
    lowLabel: '즉흥',
    highLabel: '계획',
    color: '#62a95f',
  },
  {
    id: 'vibe',
    label: 'Vibe',
    koreanLabel: '분위기',
    lowLabel: '로컬',
    highLabel: '프리미엄',
    color: '#d85b84',
  },
]

export const ONBOARDING_CARDS = [
  {
    id: 'aesthetic-high',
    axis: 'aesthetic',
    variant: 'high',
    polarity: 1,
    image: AestheticHigh,
    alt: '초록빛 정원과 연못이 어우러진 몰입형 공간',
  },
  {
    id: 'aesthetic-low',
    axis: 'aesthetic',
    variant: 'low',
    polarity: -1,
    image: AestheticLow,
    alt: '여러 작품과 해설이 함께하는 전시 공간',
  },
  {
    id: 'depth-high',
    axis: 'depth',
    variant: 'high',
    polarity: 1,
    image: DepthHigh,
    alt: '감정과 관계를 깊게 다루는 예술 영화 포스터',
  },
  {
    id: 'depth-low',
    axis: 'depth',
    variant: 'low',
    polarity: -1,
    image: DepthLow,
    alt: '대중적인 재미와 액션이 돋보이는 영화 포스터',
  },
  {
    id: 'energetic-high',
    axis: 'energetic',
    variant: 'high',
    polarity: 1,
    image: EnergeticHigh,
    alt: '수많은 관객이 함께 즐기는 야외 음악 페스티벌',
  },
  {
    id: 'energetic-low',
    axis: 'energetic',
    variant: 'low',
    polarity: -1,
    image: EnergeticLow,
    alt: '차분한 분위기에서 즐기는 소규모 라이브 공연',
  },
  {
    id: 'immersion-high',
    axis: 'immersion',
    variant: 'high',
    polarity: 1,
    image: ImmersionHigh,
    alt: '테마 공간 안에서 적극적으로 참여하는 몰입형 체험',
  },
  {
    id: 'immersion-low',
    axis: 'immersion',
    variant: 'low',
    polarity: -1,
    image: ImmersionLow,
    alt: '좌석에서 집중해 감상하는 무대 공연',
  },
  {
    id: 'pacing-high',
    axis: 'pacing',
    variant: 'high',
    polarity: 1,
    image: PacingHigh,
    alt: '시간대별 일정이 촘촘하게 정리된 여행 계획표',
  },
  {
    id: 'pacing-low',
    axis: 'pacing',
    variant: 'low',
    polarity: -1,
    image: PacingLow,
    alt: '여유와 즉흥성을 강조한 간단한 여행 계획',
  },
  {
    id: 'vibe-high',
    axis: 'vibe',
    variant: 'high',
    polarity: 1,
    image: VibeHigh,
    alt: '화려한 조명과 정제된 외관의 프리미엄 공간',
  },
  {
    id: 'vibe-low',
    axis: 'vibe',
    variant: 'low',
    polarity: -1,
    image: VibeLow,
    alt: '작은 상점과 사람들이 어우러진 친근한 동네 거리',
  },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function buildPersonaResult(responses) {
  const details = PERSONA_AXES.reduce((result, axis) => {
    const axisResponses = responses.filter(response => response.axis === axis.id)
    const weightedScore = axisResponses.reduce(
      (sum, response) => sum + response.polarity * response.value,
      0,
    )
    const reactionSum = axisResponses.reduce((sum, response) => sum + response.value, 0)
    const answeredCount = axisResponses.filter(response => response.value !== 0).length

    result[axis.id] = {
      score: clamp(Math.round(50 + weightedScore * 25), 0, 100),
      affinity: clamp(Math.round(50 + reactionSum * 25), 0, 100),
      confidence: clamp(Math.round(Math.abs(weightedScore) * 50), 0, 100),
      answeredCount,
    }

    return result
  }, {})

  return {
    version: 1,
    scores: Object.fromEntries(
      Object.entries(details).map(([axis, detail]) => [axis, detail.score]),
    ),
    details,
    responses,
    completedAt: new Date().toISOString(),
  }
}
