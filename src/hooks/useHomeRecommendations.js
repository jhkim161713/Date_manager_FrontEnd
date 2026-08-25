import { useEffect, useMemo, useState } from 'react';
import { PERSONA_AXES } from '../data/onboardingData';
import { HOME_CATEGORIES } from '../data/curationCategories';
import { getNearbyPlaces } from '../lib/api';
import { getCurrentLocation } from '../lib/weather';

// 공연류 카테고리는 place.address에 공연장(시설) 주소가 이미 들어있어서(KOPIS 동기화 시
// facility.adres()로 채움, 백엔드 변경 불필요) 카드에 "공연장소"로 표시한다(2026-08-13).
const PERFORMANCE_CATEGORIES = new Set([
  '공연', '뮤지컬', '대중음악', '서양음악(클래식)', '연극', '한국음악(국악)', '서커스/마술', '무용(서양/한국무용)', '대중무용', '축제',
]);

// 유저 성향 축(personaProfile, 2026-08-20부터 GET /api/me/styles로 실제 백엔드에서 불러옴) <->
// 장소 성향 점수(PlaceStyle, 실제 백엔드) 필드 매핑. CurationTab.jsx의 lib/placeMatching.js와 같은 기준.
const AXIS_TO_PLACE_SCORE = {
  energetic: 'scoreEnergy',
  immersion: 'scoreImmersion',
  vibe: 'scoreVibe',
  aesthetic: 'scoreAesthetic',
  depth: 'scoreDepth',
  pacing: 'scorePacing',
};

// 장소 점수가 정확히 50이면 "실 데이터 없어서 중립값을 채워둔 것"이라는 뜻이라(place_categories
// 시더 참고) 그 축으로는 매칭 대상에서 제외해야 한다 - 안 그러면 유저 성향도 50 근처일 때 "완벽히
// 일치"로 잘못 뜬다(2026-08-20, CurationTab.jsx의 pickMatchingAxes와 동일 원칙).
const isNeutralPlaceScore = (score) => score == null || score === 50;

const CANDIDATE_POOL_SIZE = 12; // 거리 가까운 상위 N개 후보 중에서 페이지당 뽑아 쓴다
const AXIS_PAGE_SIZE = 2; // 페이지당 축 하나에서 보여줄 카드 수
const POPULAR_PAGE_SIZE = 2; // 페이지당 인기 공연 카드 수
const MAX_PAGES = 3; // "페이징하면 다음 12개를 보여준다"는 요청 - 최대 3페이지(36개)까지 후보 확보
const MAX_PER_CATEGORY = 2 * MAX_PAGES;

// 홈탭 "오늘의 추천 문화생활" 섹션 전체(성향 매칭 + 인기 공연 + 카테고리 필터 + 페이징)를 감싼 훅
// (2026-08-24 분리). 원래 HomeTab.jsx 하나에 다 있던 데이터 페칭 + 추천 알고리즘을 그대로 옮겼고,
// 탭 컴포넌트는 이 훅이 돌려주는 visibleCards/페이지 상태만 그대로 렌더링에 쓰면 된다.
export function useHomeRecommendations(personaProfile) {
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
  const refresh = () => setRefreshSeed((n) => n + 1);

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

  return {
    homeCategory, setHomeCategory,
    refresh,
    visibleCards,
    pageCount, currentPage,
    goPrev: () => setPage((p) => Math.max(0, p - 1)),
    goNext: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
    goToPage: setPage,
  };
}
