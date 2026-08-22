import { useEffect, useMemo, useState } from 'react';
import { QUICK_TABS } from '../data/tabsData';
import { Badge } from '../components/Badge';
import { PERSONA_AXES } from '../data/onboardingData';
import { useWeather } from '../hooks/useWeather';
import { getCoupleStatus, getNearbyPlaces, likePlace } from '../lib/api';
import { getCurrentLocation } from '../lib/weather';
import { HOME_CATEGORIES } from '../data/curationCategories';

// 공연류 카테고리는 place.address에 공연장(시설) 주소가 이미 들어있어서(KOPIS 동기화 시
// facility.adres()로 채움, 백엔드 변경 불필요) 카드에 "공연장소"로 표시한다(2026-08-13).
const PERFORMANCE_CATEGORIES = new Set([
  '공연', '뮤지컬', '대중음악', '서양음악(클래식)', '연극', '한국음악(국악)', '서커스/마술', '무용(서양/한국무용)', '대중무용', '축제',
]);

// 유저 성향 축(personaProfile, 2026-08-20부터 GET /api/me/styles로 실제 백엔드에서 불러옴 -
// 예전엔 온보딩 화면을 그 자리에서 완료할 때만 메모리에 잠깐 채워지는 목업이었다) <-> 장소 성향
// 점수(PlaceStyle, 실제 백엔드) 필드 매핑.
const AXIS_TO_PLACE_SCORE = {
  energetic: 'scoreEnergy',
  immersion: 'scoreImmersion',
  vibe: 'scoreVibe',
  aesthetic: 'scoreAesthetic',
  depth: 'scoreDepth',
  // 즉흥·계획(2026-08-20 추가) - CurationTab.jsx와 동일 기준.
  pacing: 'scorePacing',
};

// 장소 점수가 정확히 50이면 "실 데이터 없어서 중립값을 채워둔 것"이라는 뜻이라(place_categories
// 시더 참고) 그 축으로는 매칭 대상에서 제외해야 한다 - 안 그러면 유저 성향도 50 근처일 때 "완벽히
// 일치"로 잘못 뜬다(2026-08-20, CurationTab.jsx의 pickMatchingAxes와 동일 원칙).
const isNeutralPlaceScore = (score) => score == null || score === 50;

export function HomeTab({ onTabChange, personaProfile, onStyleChanged }) {
  // 배너 문구를 실제 커플 연결 상태에 따라 다르게 보여준다 - 예전엔 목업 커플타입(TENDENCY_TYPES)과
  // 가짜 코스 개수(ALL_CARDS.length)를 썼는데, 실제 데이터 기반으로 교체(2026-08-13).
  const [coupleLinked, setCoupleLinked] = useState(false);
  useEffect(() => {
    const loadCoupleStatus = async () => {
      try {
        const status = await getCoupleStatus();
        setCoupleLinked(!!status.linked);
      } catch {
        setCoupleLinked(false);
      }
    };
    loadCoupleStatus();
  }, []);


  const { weather } = useWeather();

  // 좋아요 - CurationTab.jsx와 동일하게 로컬 state만 유지하고(서버 저장 기능은 범위 밖), 누르는
  // 순간의 신호만 UserStyle 실시간 갱신 엔진에 넘긴다(2026-08-22, 메인 탭에도 확장).
  const [likedIds, setLikedIds] = useState([]);
  const toggleLike = (e, placeId) => {
    e.stopPropagation(); // 카드 자체의 onClick(큐레이션 탭 이동)으로 안 번지게
    const isAdding = !likedIds.includes(placeId);
    setLikedIds((current) => (
      current.includes(placeId) ? current.filter((id) => id !== placeId) : [...current, placeId]
    ));
    if (isAdding) likePlace(placeId).then(() => onStyleChanged?.()).catch(() => {});
  };

  // 성향 기반 추천 장소: 유저 성향(personaProfile, 실제 백엔드 데이터)은 그대로 두고, 매칭할 장소만 실제
  // 백엔드에서 접속 좌표 기준으로 가까운 순 300건을 가져온다(거리 계산은 백엔드가 SQL로 처리,
  // 82,128건 전체가 아니라 이미 지역이 좁혀진 상태로 내려와서 대전·안동처럼 먼 곳이 안 섞임).
  const [nearbyPlacePool, setNearbyPlacePool] = useState([]);
  // "내 주변" 카테고리 칩 - 전체 9개 대분류 중 하나로 근처 장소 풀 자체를 좁힌다(2026-08-14).
  // 'all'이면 카테고리 필터 없이 예전처럼 전체를 받아온다.
  const [homeCategory, setHomeCategory] = useState('all');
  useEffect(() => {
    const loadNearbyPlaces = async () => {
      const selected = HOME_CATEGORIES.find((item) => item.id === homeCategory);
      const categoryParam = selected ? selected.categories.join(',') : '';
      try {
        const { lat, lon } = await getCurrentLocation();
        const places = await getNearbyPlaces(lat, lon, 300, categoryParam);
        // 숙박은 6대 성향 매칭과 안 맞아서 "전체" 기본 노출에서는 뺀다(2026-08-18) - 다만 칩에서
        // 숙박을 직접 선택했을 땐 당연히 보여야 하므로, 그때는 거르지 않는다.
        // 공연류도 마찬가지로 "전체" 기본 노출에서만 뺀다(2026-08-19) - 공연이 place_categories에
        // 연결되면서 축 점수가 생겨 recommendationsByAxis 후보 풀에 섞여 들어오기 시작했는데,
        // 그러면 "맛집 성향 추천" 자리에 대중음악 콘서트 카드가 끼어드는 식으로 어색해진다.
        // 공연은 아래 performanceCards에서 별도 섹션으로만 보여준다.
        setNearbyPlacePool(
          homeCategory === 'all'
            ? places.filter((p) => p.category !== '숙박' && !PERFORMANCE_CATEGORIES.has(p.category))
            : places
        );
      } catch {
        setNearbyPlacePool([]);
      }
    };
    loadNearbyPlaces();
  }, [homeCategory]);

  // "즉흥·계획(pacing)" 자리용 공연 후보 풀 - homeCategory 칩 선택과 무관하게 항상 공연류만 따로
  // 가져온다(2026-08-19). pacing 축은 장소 성향 점수 자체가 없어서 원래 빈 카드로 남아있던 자리인데,
  // 공연 데이터가 place_categories에 제대로 연결되면서(같은 날 백엔드 수정) 실제 추천이 가능해짐.
  const [performancePool, setPerformancePool] = useState([]);
  useEffect(() => {
    const loadPerformances = async () => {
      try {
        const { lat, lon } = await getCurrentLocation();
        const categoryParam = [...PERFORMANCE_CATEGORIES].join(',');
        const places = await getNearbyPlaces(lat, lon, 2000, categoryParam);
        setPerformancePool(places);
      } catch {
        setPerformancePool([]);
      }
    };
    loadPerformances();
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
  const CANDIDATE_POOL_SIZE = 12; // 거리 가까운 상위 N개 후보 중에서 페이지당 뽑아 쓴다
  // 데이터가 아직 가게 위주로 쏠려 있어서(장소 정제 작업 전이라 카테고리별 편차가 큼), 같은
  // 카테고리(쇼핑 등)가 추천 그리드를 도배하지 않도록 카테고리당 최대 노출 개수를 제한한다(2026-08-18).
  // MAX_PAGES만큼 페이지를 채워야 해서 2026-08-19에 상한을 페이지 수에 비례해 올림.
  const AXIS_PAGE_SIZE = 2; // 페이지당 축 하나에서 보여줄 카드 수
  const POPULAR_PAGE_SIZE = 2; // 페이지당 인기 공연 카드 수
  const MAX_PAGES = 3; // "페이징하면 다음 12개를 보여준다"는 요청 - 최대 3페이지(36개)까지 후보 확보
  const MAX_PER_CATEGORY = 2 * MAX_PAGES;

  const recommendationsByAxis = useMemo(() => {
    // 한 장소가 여러 축에서 동시에 가깝게 매칭될 수 있어서(예: 에너지·분위기 둘 다 잘 맞는 곳),
    // 축을 순서대로 훑으면서 이미 다른 축에서 뽑힌 장소는 다음 축 후보에서 제외한다 - 카드가
    // 겹쳐 보이는 문제 방지(2026-08-13). 페이지당 2개씩 최대 MAX_PAGES페이지 분량(최대 6개)을
    // 미리 뽑아두고, 실제 렌더링 때 페이지별로 2개씩 잘라 쓴다(2026-08-19).
    const usedPlaceIds = new Set();
    const categoryCounts = {};
    return PERSONA_AXES
      .filter((axis) => AXIS_TO_PLACE_SCORE[axis.id])
      .map((axis) => {
        const scoreField = AXIS_TO_PLACE_SCORE[axis.id];
        const userScore = personaProfile?.scores?.[axis.id] ?? 50;
        const candidates = dedupedNearbyPool
          .filter((p) => !isNeutralPlaceScore(p[scoreField]) && !usedPlaceIds.has(p.id))
          .filter((p) => (categoryCounts[p.category] ?? 0) < MAX_PER_CATEGORY)
          .map((p) => ({ ...p, distance: Math.abs(p[scoreField] - userScore) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, CANDIDATE_POOL_SIZE);
        const ranked = [...candidates].sort(() => Math.random() - 0.5).slice(0, AXIS_PAGE_SIZE * MAX_PAGES);
        ranked.forEach((p) => {
          usedPlaceIds.add(p.id);
          categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
        });
        return { axis, places: ranked };
      })
      .filter((entry) => entry.places.length > 0);
  }, [dedupedNearbyPool, personaProfile, refreshSeed]);

  // 특정 카테고리 칩(전체가 아닌)을 골랐을 때 쓰는 페이지 구성 - 위 recommendationsByAxis의
  // MAX_PER_CATEGORY 캡은 "여러 카테고리가 섞인 전체 그리드에서 한 카테고리가 도배하지 못하게" 막는
  // 용도라, 칩으로 카테고리 하나만 이미 골라놓은 상태에서는 오히려 데이터를 6개로 확 줄여버리는
  // 부작용이 있었다(2026-08-19, 사용자 지적). 그래서 칩이 선택된 동안은 이 캡 없이 그 카테고리
  // 전체 후보 풀을 그대로 쓰고, 대신 페이지 크기를 데이터량에 맞춰 8~12개로 가변으로 잡는다.
  const singleCategoryPages = useMemo(() => {
    if (dedupedNearbyPool.length === 0) return [[]];

    const total = dedupedNearbyPool.length;
    const pageSize = total >= 12 ? 12 : Math.min(8, total);

    const shuffled = [...dedupedNearbyPool].sort(() => Math.random() - 0.5);
    const axes = PERSONA_AXES.filter((axis) => AXIS_TO_PLACE_SCORE[axis.id]);
    const cardsWithAxis = shuffled.map((place) => {
      let bestAxis = axes[0];
      let bestDistance = Infinity;
      for (const axis of axes) {
        const scoreField = AXIS_TO_PLACE_SCORE[axis.id];
        if (isNeutralPlaceScore(place[scoreField])) continue;
        const userScore = personaProfile?.scores?.[axis.id] ?? 50;
        const distance = Math.abs(place[scoreField] - userScore);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestAxis = axis;
        }
      }
      return { kind: 'axis', axis: bestAxis, place };
    });

    const built = [];
    for (let i = 0; i < cardsWithAxis.length; i += pageSize) {
      built.push(cardsWithAxis.slice(i, i + pageSize));
    }
    return built.length > 0 ? built : [[]];
  }, [dedupedNearbyPool, personaProfile, refreshSeed]);

  // pacing(즉흥·계획) 축은 장소 쪽에 대응 점수가 없어서 그 축 이름으로 매칭하는 건 여전히 안 되고,
  // 대신 "인기 공연"이라는 별도 자리를 둔다(2026-08-19). 페이지당 인기 공연 2개씩 쓸 수 있도록
  // 예매율 상위 MAX_PAGES*2개까지 미리 확보해둔다. 공연은 recommendationsByAxis 풀에서 이미
  // 제외했으니(nearbyPlacePool 필터 참고) 여기 인기 공연과 절대 안 겹친다.
  const popularPerformances = useMemo(() => {
    return performancePool
      .filter((p) => p.boxOfficeRank != null)
      .sort((a, b) => a.boxOfficeRank - b.boxOfficeRank)
      .slice(0, POPULAR_PAGE_SIZE * MAX_PAGES);
  }, [performancePool]);

  // "전체" 칩일 때 쓰는 페이지 구성 - 성향축당 2개 + 인기 공연 2개 = 최대 12개. 페이징하면 완전히
  // 다른 12개(다음 후보 묶음)가 나오도록, 각 축/인기 리스트에서 페이지 순서대로 다른 구간을 잘라 쓴다
  // (2026-08-19). 특정 카테고리 칩을 골랐을 때는 이거 대신 singleCategoryPages를 쓴다(아래 참고) -
  // 인기 공연 카드가 "전체"가 아닐 때도 계속 붙어서 칩과 무관한 카드가 섞여 나오던 버그가 있었어서
  // (2026-08-19, 실제 화면 캡처로 확인), 아예 칩별로 페이지 구성 자체를 분리했다.
  const allCategoryPages = useMemo(() => {
    const built = [];
    for (let i = 0; i < MAX_PAGES; i++) {
      const axisCards = recommendationsByAxis.flatMap(({ axis, places }) =>
        places.slice(i * AXIS_PAGE_SIZE, i * AXIS_PAGE_SIZE + AXIS_PAGE_SIZE)
          .map((place) => ({ kind: 'axis', axis, place }))
      );
      const popularCards = popularPerformances
        .slice(i * POPULAR_PAGE_SIZE, i * POPULAR_PAGE_SIZE + POPULAR_PAGE_SIZE)
        .map((place) => ({ kind: 'popular', place }));
      const combined = [...axisCards, ...popularCards];
      if (combined.length > 0) built.push(combined);
    }
    return built.length > 0 ? built : [[]];
  }, [recommendationsByAxis, popularPerformances]);

  // "전체"면 성향 매칭+인기 공연 구성을, 특정 칩이면 그 카테고리 전체 후보를 8~12개씩 페이징한 걸 쓴다.
  const pages = homeCategory === 'all' ? allCategoryPages : singleCategoryPages;

  const pageCount = pages.length;
  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0); // 새로고침하거나 카테고리/데이터가 바뀌면 첫 페이지로 되돌림
  }, [pageCount, refreshSeed, homeCategory]);
  const currentPage = Math.min(page, pageCount - 1);
  const visibleCards = pages[currentPage] ?? [];

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

        {/* 내 주변 카테고리 칩 - 고르면 위 nearbyPlacePool 자체가 그 카테고리로 좁혀짐(2026-08-14).
            숙박은 6대 성향 매칭과 안 맞아서 칩 목록에서 뺐다(2026-08-18) - 숙박은 큐레이션 탭에서 확인. */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setHomeCategory('all')}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
            style={{
              background: homeCategory === 'all' ? '#4f3d46' : 'white',
              color: homeCategory === 'all' ? 'white' : '#7c6a72',
              border: '1.5px solid #f0dce2',
            }}
          >
            전체
          </button>
          {HOME_CATEGORIES.map((item) => {
            const selected = homeCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setHomeCategory(selected ? 'all' : item.id)}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
                style={{
                  background: selected ? item.color : 'white',
                  color: selected ? 'white' : item.color,
                  border: `1.5px solid ${item.color}40`,
                }}
              >
                {item.emoji} {item.label}
              </button>
            );
          })}
        </div>

        {/* 한 페이지에 성향 카드 5축×2개(10) + 인기 공연 2개 = 최대 12개를 한꺼번에 보여주고,
            페이징하면 다음 12개(다른 후보)로 바뀐다 - pages 참고(2026-08-19). 공연은 위
            nearbyPlacePool 필터에서 이미 빠져 있어서 성향 카드와 인기 공연은 서로 안 겹친다. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5">
          {visibleCards.map((entry) => {
            const { place, kind } = entry;
            const badgeColor = kind === 'axis' ? entry.axis.color : '#df9235';
            const badgeBg = kind === 'axis' ? `${entry.axis.color}15` : '#fff6e7';
            const badgeLabel = kind === 'axis'
              ? `${entry.axis.koreanLabel} 매칭`
              : `🔥 ${place.genreName ?? '예매율'} ${place.boxOfficeRank}위`;
            const subLabel = place.address
              ? `📍 ${place.address}`
              : (kind === 'axis' ? `${entry.axis.koreanLabel} 성향에 맞는 장소` : '지금 인기 있는 공연이에요');
            return (
              <div key={`${kind}-${place.id}`} onClick={() => onTabChange('curiation')}
                className="rounded-3xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform bg-white flex flex-col shadow-sm"
                style={{ border: '1.5px solid #ffd6e0', minHeight: '230px' }}>
                <div className="relative overflow-hidden bg-pink-100 flex-shrink-0" style={{ height: '170px' }}>
                  {place.imageUrl ? (
                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {kind === 'popular' ? '🎭' : '📍'}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    📍 {place.category}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleLike(e, place.id)}
                    className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
                    style={{ color: likedIds.includes(place.id) ? '#e8486b' : '#a9979e' }}
                    aria-label={`${place.name} 찜하기`}
                  >
                    {likedIds.includes(place.id) ? '♥' : '♡'}
                  </button>
                </div>
                <div className="p-3 flex flex-col justify-center flex-1 text-center">
                  <Badge color={badgeColor} bg={badgeBg}>{badgeLabel}</Badge>
                  <p className="font-bold text-sm mt-1.5 leading-tight truncate" style={{ color: '#3d2c35' }}>
                    {place.name}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 truncate">{subLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 페이지 이동 - 다음 페이지를 누르면 지금과 겹치지 않는 다음 12개 후보 묶음을 보여준다 */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-30"
              style={{ background: '#fff0f3', color: '#e8486b' }}>
              ‹
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  aria-label={`${i + 1}페이지`}
                  className="rounded-full transition-all"
                  style={{
                    width: i === currentPage ? '18px' : '6px',
                    height: '6px',
                    background: i === currentPage ? '#e8486b' : '#ffd6e0',
                  }} />
              ))}
            </div>
            <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={currentPage === pageCount - 1}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-30"
              style={{ background: '#fff0f3', color: '#e8486b' }}>
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}