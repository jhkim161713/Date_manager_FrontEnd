import { useEffect, useMemo, useState } from 'react';
import { TENDENCY_TYPES, ALL_CARDS} from '../data/dummyData';
import { QUICK_TABS } from '../data/tabsData';
import { Badge } from '../components/Badge';
import { PERSONA_AXES } from '../data/onboardingData';
import { useWeather } from '../hooks/useWeather';
import { getPlaces } from '../lib/api';

// 유저 성향 축(personaProfile, 목업) <-> 장소 성향 점수(PlaceStyle, 실제 백엔드) 필드 매핑.
// 유저 쪽 "pacing"(즉흥·계획)은 장소 쪽에 대응하는 축이 없어서 매칭 대상에서 제외한다.
const AXIS_TO_PLACE_SCORE = {
  energetic: 'scoreEnergy',
  immersion: 'scoreImmersion',
  vibe: 'scoreVibe',
  aesthetic: 'scoreAesthetic',
  depth: 'scoreDepth',
};

export function HomeTab({ onTabChange, personaProfile }) {
  const [coupleType] = useState('romantic');
  const matched = TENDENCY_TYPES.find(t => t.id === coupleType);

  const filtered = ALL_CARDS;

  // 축 소개 카드는 더 이상 이미지로 렌더링하지 않고(추천 장소 카드로 대체됨), 상단 "N개 축"
  // 표시에만 축 개수가 필요해서 PERSONA_AXES.length를 그대로 씀.
  const personaAxisCount = PERSONA_AXES.length;

  const { weather } = useWeather();

  // 성향 기반 추천 장소: 유저 성향(personaProfile, 목업)은 그대로 두고, 매칭할 장소만 실제
  // /api/places(PlaceStyle 포함, 82,128건 중 표본)를 가져와서 프론트에서 축별로 거리 계산.
  const [placePool, setPlacePool] = useState([]);
  useEffect(() => {
    getPlaces({ size: 200 })
      .then((page) => setPlacePool(page.content))
      .catch(() => setPlacePool([]));
  }, []);

  const recommendationsByAxis = useMemo(() => {
    return PERSONA_AXES
      .filter((axis) => AXIS_TO_PLACE_SCORE[axis.id])
      .map((axis) => {
        const scoreField = AXIS_TO_PLACE_SCORE[axis.id];
        const userScore = personaProfile?.scores?.[axis.id] ?? 50;
        const ranked = placePool
          .filter((p) => p[scoreField] != null)
          .map((p) => ({ ...p, distance: Math.abs(p[scoreField] - userScore) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2);
        return { axis, places: ranked };
      })
      .filter((entry) => entry.places.length > 0);
  }, [placePool, personaProfile]);

  // pacing(즉흥·계획)은 장소 쪽에 대응 점수가 없어 매칭 로직이 아직 없음 - 자리만 비워두고,
  // 나중에 매칭 방식이 정해지면 이 자리에 실제 추천 장소가 채워지게 될 예정.
  const pacingAxis = PERSONA_AXES.find((axis) => axis.id === 'pacing');

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ━━━ ① 히어로 배너 ━━━ */}
      <div className="rounded-3xl overflow-hidden relative flex-shrink-0" style={{ minHeight: '148px', background: 'linear-gradient(120deg, #ff6b8a 0%, #c98fd4 60%, #c4a0e8 100%)' }}>
        <img src="https://images.unsplash.com/photo-1622296571436-8d5b1c203416?w=1200&h=400&fit=crop&auto=format"
          alt="커플 데이트 배경" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25" />

      {/* Weather chip (우측 상단 날씨) */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', color: 'white' }}>
          <span>{weather.icon}</span><span>{weather.temp}</span>
          <span className="opacity-70">·</span>
          <span className="opacity-80">{weather.desc}</span>
        </div>

        {/* 배너 내부 컨텐츠 (세로 정렬로 겹침 방지) */}
        <div className="relative z-10 px-4 md:px-6 py-5 flex flex-col justify-between h-full">
          <div>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-2"
              style={{ background: 'rgba(255,255,255,0.22)', color: 'white' }}>
              💕 우리 커플 맞춤 큐레이션
            </span>
            <h2 className="font-display font-bold text-white leading-tight text-xl md:text-[1.6rem]">
              오늘 어떤 데이트 어때요?
            </h2>
            {matched && (
              <p className="text-white/75 text-xs mt-1">
                {matched.emoji} {matched.label} 커플을 위한 {filtered.length}개 코스 준비됐어요
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => onTabChange('builder')}
              className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'white', color: '#ff6b8a', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
              🧭 AI 코스 추천
            </button>
          </div>
        </div>
      </div>

      {/* ━━━ ② 카테고리 퀵 필터 탭 ━━━ */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK_TABS.map(q => (
            <button key={q.tab} onClick={() => onTabChange(q.tab)}
              className="flex-shrink-0 flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold transition-all hover:scale-105 bg-white shadow-sm"
              style={{ color: q.color, border: `1.5px solid ${q.color}40` }}>
              <span>{q.emoji}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

{/* ━━━ ③ 우리 성향 — 4열 3행 그리드 (이미지 극대화, 전체 높이 확장) ━━━ */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 pr-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base" style={{ color: '#3d2c35' }}>💡 우리 성향 분석</h2>
            <span className="text-xs font-bold rounded-full px-2.5 py-0.5" style={{ background: '#fff0f3', color: '#ff6b8a' }}>
              {personaAxisCount}개 축
            </span>
          </div>
        </div>

        {/* 축 소개 카드(감각·공간~프리미엄) 6개는 빼고, 성향 매칭 추천 장소 카드로 그리드를 채움
            - 축(성향)당 2곳씩, 총 5축×2=10개 + pacing 자리 2개(빈 카드, 매칭 로직 생기면 채움)
            = 12개 유지(2026-08-13). */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5">
          {recommendationsByAxis.flatMap(({ axis, places }) =>
            places.map((place) => (
              <div key={`${axis.id}-${place.id}`} onClick={() => onTabChange('curiation')}
                className="rounded-3xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform bg-white flex flex-col shadow-sm"
                style={{ border: '1.5px solid #ffd6e0', minHeight: '230px' }}>
                <div className="relative overflow-hidden bg-pink-100 flex-shrink-0" style={{ height: '170px' }}>
                  {place.imageUrl ? (
                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📍</div>
                  )}
                  <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    📍 {place.category}
                  </div>
                </div>
                <div className="p-3 flex flex-col justify-center flex-1 text-center">
                  <Badge color={axis.color} bg={`${axis.color}15`}>{axis.label} 매칭</Badge>
                  <p className="font-bold text-sm mt-1.5 leading-tight truncate" style={{ color: '#3d2c35' }}>
                    {place.name}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 truncate">{axis.koreanLabel} 성향에 맞는 장소</p>
                </div>
              </div>
            ))
          )}

          {/* pacing 축 자리 - 매칭 로직 없어서 일단 빈 카드 2개. 나중에 매칭 방식이 정해지면
              여기가 위 카드들과 똑같은 형태의 실제 추천 장소로 교체될 자리(2026-08-13). */}
          {pacingAxis && [0, 1].map((i) => (
            <div key={`pacing-empty-${i}`}
              className="rounded-3xl overflow-hidden bg-white flex flex-col shadow-sm"
              style={{ border: '1.5px dashed #ffd6e0', minHeight: '230px' }}>
              <div className="relative flex-shrink-0 flex items-center justify-center" style={{ height: '170px', background: `${pacingAxis.color}10` }}>
                <span className="text-3xl opacity-40">⏳</span>
              </div>
              <div className="p-3 flex flex-col justify-center flex-1 text-center">
                <Badge color={pacingAxis.color} bg={`${pacingAxis.color}15`}>{pacingAxis.label} 매칭</Badge>
                <p className="font-bold text-sm mt-1.5 leading-tight" style={{ color: '#3d2c35' }}>
                  준비 중이에요
                </p>
                <p className="text-[11px] text-stone-400 mt-1 truncate">{pacingAxis.koreanLabel} 매칭 로직 추가 예정</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}