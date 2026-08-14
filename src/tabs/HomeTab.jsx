import { useEffect, useMemo, useState } from 'react';
import { QUICK_TABS } from '../data/tabsData';
import { Badge } from '../components/Badge';
import { PERSONA_AXES } from '../data/onboardingData';
import { useWeather } from '../hooks/useWeather';
import { getCoupleStatus, getNearbyPlaces } from '../lib/api';
import { getCurrentLocation } from '../lib/weather';

// 공연류 카테고리는 place.address에 공연장(시설) 주소가 이미 들어있어서(KOPIS 동기화 시
// facility.adres()로 채움, 백엔드 변경 불필요) 카드에 "공연장소"로 표시한다(2026-08-13).
const PERFORMANCE_CATEGORIES = new Set([
  '공연', '뮤지컬', '대중음악', '서양음악(클래식)', '연극', '한국음악(국악)', '서커스/마술', '무용(서양/한국무용)', '대중무용', '축제',
]);

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
  // 배너 문구를 실제 커플 연결 상태에 따라 다르게 보여준다 - 예전엔 목업 커플타입(TENDENCY_TYPES)과
  // 가짜 코스 개수(ALL_CARDS.length)를 썼는데, 실제 데이터 기반으로 교체(2026-08-13).
  const [coupleLinked, setCoupleLinked] = useState(false);
  useEffect(() => {
    getCoupleStatus()
      .then((status) => setCoupleLinked(!!status.linked))
      .catch(() => setCoupleLinked(false));
  }, []);


  const { weather } = useWeather();

  // 성향 기반 추천 장소: 유저 성향(personaProfile, 목업)은 그대로 두고, 매칭할 장소만 실제
  // 백엔드에서 접속 좌표 기준으로 가까운 순 300건을 가져온다(거리 계산은 백엔드가 SQL로 처리,
  // 82,128건 전체가 아니라 이미 지역이 좁혀진 상태로 내려와서 대전·안동처럼 먼 곳이 안 섞임).
  const [nearbyPlacePool, setNearbyPlacePool] = useState([]);
  useEffect(() => {
    getCurrentLocation().then(({ lat, lon }) => {
      getNearbyPlaces(lat, lon, 300)
        .then(setNearbyPlacePool)
        .catch(() => setNearbyPlacePool([]));
    });
  }, []);

  // 올리브영처럼 지점이 많은 체인점이 이름만 다르고 사실상 같은 브랜드라 후보를 도배하는 문제
  // 완화용 - 같은 이름(브랜드)은 대표로 1곳만 후보에 남긴다. nearbyPlacePool이 이미 가까운
  // 순으로 정렬돼 와서, 첫 등장(=가장 가까운 지점)을 대표로 씀(2026-08-13, 임시 완화책 -
  // 근본 해결은 4번 작업(성향값 부여 방식 정교화)에서 다룰 예정).
  const dedupedNearbyPool = useMemo(() => {
    const seenNames = new Set();
    return nearbyPlacePool.filter((p) => {
      if (seenNames.has(p.name)) return false;
      seenNames.add(p.name);
      return true;
    });
  }, [nearbyPlacePool]);

  // "새로고침" 누르면 이 값을 증가시켜서 아래 useMemo가 다시 계산되게 함(같은 입력이라도
  // 랜덤 추출 결과가 새로 섞이도록 하는 트리거 용도, 2026-08-13).
  const [refreshSeed, setRefreshSeed] = useState(0);
  const CANDIDATE_POOL_SIZE = 8; // 거리 가까운 상위 N개 중에서 랜덤으로 2개를 뽑는다

  const recommendationsByAxis = useMemo(() => {
    // 한 장소가 여러 축에서 동시에 가깝게 매칭될 수 있어서(예: 에너지·분위기 둘 다 잘 맞는 곳),
    // 축을 순서대로 훑으면서 이미 다른 축에서 뽑힌 장소는 다음 축 후보에서 제외한다 - 카드가
    // 겹쳐 보이는 문제 방지(2026-08-13).
    const usedPlaceIds = new Set();
    return PERSONA_AXES
      .filter((axis) => AXIS_TO_PLACE_SCORE[axis.id])
      .map((axis) => {
        const scoreField = AXIS_TO_PLACE_SCORE[axis.id];
        const userScore = personaProfile?.scores?.[axis.id] ?? 50;
        // 정확히 가장 가까운 2개로 고정하지 않고, 가까운 상위 8개 후보 중 랜덤으로 2개를 뽑아서
        // "새로고침" 버튼을 눌렀을 때 결과가 다양하게 바뀌도록 함. 후보 자체는 접속 위치 기준으로
        // 좁히고 체인점 중복까지 제거해둔 dedupedNearbyPool에서만 고른다.
        const candidates = dedupedNearbyPool
          .filter((p) => p[scoreField] != null && !usedPlaceIds.has(p.id))
          .map((p) => ({ ...p, distance: Math.abs(p[scoreField] - userScore) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, CANDIDATE_POOL_SIZE);
        const ranked = [...candidates].sort(() => Math.random() - 0.5).slice(0, 2);
        ranked.forEach((p) => usedPlaceIds.add(p.id));
        return { axis, places: ranked };
      })
      .filter((entry) => entry.places.length > 0);
  }, [dedupedNearbyPool, personaProfile, refreshSeed]);

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
              {coupleLinked ? '💕 내 파트너 맞춤 큐레이션' : '🎭 문화생활 맞춤 큐레이션'}
            </span>
            <h2 className="font-display font-bold text-white leading-tight text-xl md:text-[1.6rem]">
              {coupleLinked ? '오늘은 이런 데이트 어때요?' : '이번 주엔 이런 문화생활 어때요?'}
            </h2>
            <p className="text-white/75 text-xs mt-1">
              {coupleLinked ? '💑 당신을 위한 데이트 코스를 준비했어요' : '🎨 당신을 위한 문화생활을 준비했어요'}
            </p>
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

      {/* 상단 헤더의 구분선(app-topbar border-bottom)과 같은 스타일로, 퀵 필터 탭과 아래 추천
          섹션 사이를 구분함(2026-08-13) */}
      <div style={{ borderBottom: '1.5px solid #ffd6e0' }} />

{/* ━━━ ③ 우리 성향 — 4열 3행 그리드 (이미지 극대화, 전체 높이 확장) ━━━ */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 pr-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base" style={{ color: '#3d2c35' }}>🎨 오늘의 추천 문화생활</h2>
          </div>
          <button type="button" onClick={() => setRefreshSeed((n) => n + 1)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
            style={{ background: '#fff0f3', color: '#ff6b8a' }}>
            🔄 새로고침
          </button>
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
                  <Badge color={axis.color} bg={`${axis.color}15`}>{axis.koreanLabel} 매칭</Badge>
                  <p className="font-bold text-sm mt-1.5 leading-tight truncate" style={{ color: '#3d2c35' }}>
                    {place.name}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 truncate">
                    {PERFORMANCE_CATEGORIES.has(place.category) && place.address
                      ? `📍 ${place.address}`
                      : `${axis.koreanLabel} 성향에 맞는 장소`}
                  </p>
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
                <Badge color={pacingAxis.color} bg={`${pacingAxis.color}15`}>{pacingAxis.koreanLabel} 매칭</Badge>
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