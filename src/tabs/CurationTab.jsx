import { useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionTitle } from '../components/SectionTitle';
import { getCurationPlaces, getNearbyCurationPlaces, getPlaceCategoryCounts, getPlaceSubCategoryCounts } from '../lib/api';
import { getCurrentLocation } from '../lib/weather';
import { BUILDER_STORAGE_KEY } from '../data/curationData';
import { DATE_CATEGORIES } from '../data/curationCategories';
import { STAY_CATEGORIES, STAY_HERO } from '../data/stayData';
import { PERSONA_AXES } from '../data/onboardingData';

const STAY_TOP_CATEGORY = '숙박';
const PAGE_SIZE = 24;

// 유저 성향 축 <-> 장소 성향 점수 필드 매핑. HomeTab.jsx의 동일 매핑과 같은 기준 -
// "즉흥·계획(pacing)"은 장소 쪽에 대응 축이 없어서 매칭 대상에서 제외한다.
const AXIS_TO_PLACE_SCORE = {
  energetic: 'scoreEnergy',
  immersion: 'scoreImmersion',
  vibe: 'scoreVibe',
  aesthetic: 'scoreAesthetic',
  depth: 'scoreDepth',
};
const MATCHABLE_AXES = PERSONA_AXES.filter((axis) => AXIS_TO_PLACE_SCORE[axis.id]);

// 원본 기획서("스마트 데이트 큐레이션 - Style Sync Engine")의 핵심인 "장소 성향과 유저 성향을
// 비교해 가장 특징적인 상위 성향을 배지로 노출"을 구현한다(2026-08-19). 장소가 실제로 강조하는
// 축(50에서 많이 벗어난 축)일수록 그 축이 유저와 가까운지가 더 의미 있어서, 단순 거리가 아니라
// "장소가 그 축에서 얼마나 뚜렷한가(강조도) - 유저와의 거리"로 점수를 매겨 상위 2개를 뽑는다.
function pickMatchingAxes(place, personaProfile) {
  const scored = MATCHABLE_AXES
    .map((axis) => {
      const scoreField = AXIS_TO_PLACE_SCORE[axis.id];
      const placeScore = place[scoreField];
      if (placeScore == null) return null;
      const userScore = personaProfile?.scores?.[axis.id] ?? 50;
      const emphasis = Math.abs(placeScore - 50); // 장소가 이 축을 얼마나 뚜렷하게 강조하는지
      const distance = Math.abs(placeScore - userScore); // 유저 성향과의 거리
      return { axis, weight: emphasis - distance };
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);
  return scored.slice(0, 2).map((entry) => entry.axis);
}

// 지역 필터용 시/도 목록(2026-08-19). Place.address엔 별도 시/도 컬럼이 없어서 이 문자열이 주소에
// 포함되는지로 판단한다(예: "서울" -> "서울특별시 강남구 ..."에 포함됨) - 그래서 정식 명칭 대신
// 주소에 실제로 등장하는 짧은 형태를 쓴다.
const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

// 서울/경기는 데이터가 많아서(각각 수천~수만 건) 시/도 하나로만 걸러도 카드가 너무 안 좁혀진다 -
// 실측 결과 서울 25개 구 전부 데이터가 꽤 있어서(최소 100건대) 그대로 다 나누고, 경기는 31개 시/군
// 이라 칩이 너무 많아지므로 지리적으로 가까운 권역 5개로 묶었다(2026-08-19). 값 자체는 여전히 하나의
// 시/군 이름이라 백엔드는 손 안 대고 기존 address LIKE 방식 그대로 재사용한다.
const SUB_REGIONS = {
  서울: [
    { zone: null, items: [
      '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구',
      '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구',
      '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구',
    ] },
  ],
  경기: [
    { zone: '북부', items: ['고양시', '파주시', '김포시', '양주시', '동두천시', '포천시', '연천군', '의정부시'] },
    { zone: '동북', items: ['남양주시', '구리시', '가평군'] },
    { zone: '동부', items: ['성남시', '광주시', '하남시', '이천시', '여주시', '양평군'] },
    { zone: '서부', items: ['부천시', '시흥시', '안산시', '광명시', '안양시', '군포시', '의왕시', '과천시'] },
    { zone: '남부', items: ['수원시', '용인시', '화성시', '평택시', '안성시', '오산시'] },
  ],
};

// 카드 하나를 그릴 때 필요한 필드로 백엔드 CurationPlaceDto를 그대로 쓴다. matchScore는 온보딩 저장
// 파이프라인이 없어서(2026-08-14 기준) 항상 null - 그래서 매칭% 배지/정렬은 값이 있을 때만 켠다.
export function CuriationTab({ onOpenBuilder, personaProfile }) {
  const [curationView, setCurationView] = useState('date');
  const [dateCategory, setDateCategory] = useState('all');
  const [stayCategory, setStayCategory] = useState('all');
  // 지역 필터 - 빈 문자열이면 "전체 지역". 데이트/숙박 화면 둘 다 공유한다(2026-08-19).
  const [region, setRegion] = useState('');
  // 서울/경기를 고르면 나오는 구/시 세부 필터. 실제 API엔 subRegion이 있으면 그게 region보다
  // 더 구체적이라 subRegion을 우선해서 보낸다(아래 effectiveRegion 참고).
  const [subRegion, setSubRegion] = useState('');
  const effectiveRegion = subRegion || region;

  const [datePlaces, setDatePlaces] = useState([]);
  const [dateLoading, setDateLoading] = useState(true);
  const [dateError, setDateError] = useState('');

  const [stayPlaces, setStayPlaces] = useState([]);
  const [stayLoading, setStayLoading] = useState(true);
  const [stayError, setStayError] = useState('');

  const [categoryCounts, setCategoryCounts] = useState({});
  const [staySubCounts, setStaySubCounts] = useState({});

  // "내 주변만 보기" - 끄면 최신순, 켜면 접속 좌표 기준 거리순으로 전환된다(2026-08-14).
  // 홈탭은 토글 없이 처음부터 위치 기반으로 동작하는데 여기는 기본값이 꺼져 있어서 "위치가
  // 반영 안 된다"는 인상을 줬다 - 홈탭과 동작을 맞추기 위해 기본값을 켜짐으로 변경(2026-08-19).
  const [useNearby, setUseNearby] = useState(true);
  const [nearbyError, setNearbyError] = useState('');

  // 코스 빌더 후보로 담은 장소는 카테고리를 바꿔도 계속 보여야 해서, 지금 화면에 보이는 목록과
  // 별개로 "지금까지 받아온 장소" 전체를 id 기준으로 따로 쌓아둔다.
  const [placeCache, setPlaceCache] = useState({});

  const [expandedStayId, setExpandedStayId] = useState(null);
  const [builderItemIds, setBuilderItemIds] = useState([]);
  const [likedItemIds, setLikedItemIds] = useState([]);
  const [likedStayIds, setLikedStayIds] = useState([]);
  const [feedback, setFeedback] = useState('');

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  const cachePlaces = (places) => {
    setPlaceCache((current) => {
      const next = { ...current };
      places.forEach((place) => { next[place.id] = place; });
      return next;
    });
  };

  useEffect(() => {
    const loadCategoryCounts = async () => {
      try {
        setCategoryCounts(await getPlaceCategoryCounts());
      } catch {
        setCategoryCounts({});
      }
    };
    const loadStaySubCounts = async () => {
      try {
        setStaySubCounts(await getPlaceSubCategoryCounts(STAY_TOP_CATEGORY));
      } catch {
        setStaySubCounts({});
      }
    };
    loadCategoryCounts();
    loadStaySubCounts();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDatePlaces = async () => {
      setDateLoading(true);
      setDateError('');
      setNearbyError('');
      // "전체"일 때 카테고리 제한을 아예 안 걸면 숙박(3만여 건, 다른 카테고리보다 밀도가 훨씬 높음)이
      // 근처 결과를 다 채워버린다(2026-08-19, 실제 화면에서 확인됨) - 홈탭이 "전체" 노출에서 숙박을
      // 빼는 것과 같은 이유로, 여기서도 DATE_CATEGORIES에 있는 카테고리로만 명시적으로 제한한다
      // (숙박은 DATE_CATEGORIES에 없어서 자연히 빠짐, 숙박은 별도 curationView='stay' 화면에서 다룸).
      const selected = DATE_CATEGORIES.find((item) => item.id === dateCategory);
      const categoryParam = selected
        ? selected.categories.join(',')
        : DATE_CATEGORIES.flatMap((item) => item.categories).join(',');

      try {
        let places;
        if (useNearby) {
          const { lat, lon } = await getCurrentLocation();
          places = await getNearbyCurationPlaces({ lat, lon, category: categoryParam, region: effectiveRegion, limit: PAGE_SIZE });
        } else {
          const page = await getCurationPlaces({ category: categoryParam, region: effectiveRegion, size: PAGE_SIZE });
          places = page.content;
        }
        if (cancelled) return;
        setDatePlaces(places);
        cachePlaces(places);
      } catch {
        if (cancelled) return;
        setDateError('장소를 불러오지 못했어요');
        if (useNearby) setNearbyError('위치 정보를 가져오지 못했어요');
      } finally {
        if (!cancelled) setDateLoading(false);
      }
    };
    loadDatePlaces();
    return () => { cancelled = true; };
  }, [dateCategory, useNearby, effectiveRegion]);

  useEffect(() => {
    let cancelled = false;
    const loadStayPlaces = async () => {
      setStayLoading(true);
      setStayError('');
      setNearbyError('');
      const subCategory = stayCategory === 'all' ? '' : stayCategory;

      try {
        let places;
        if (useNearby) {
          const { lat, lon } = await getCurrentLocation();
          places = await getNearbyCurationPlaces({ lat, lon, category: STAY_TOP_CATEGORY, subCategory, region: effectiveRegion, limit: PAGE_SIZE });
        } else {
          const page = await getCurationPlaces({ category: STAY_TOP_CATEGORY, subCategory, region: effectiveRegion, size: PAGE_SIZE });
          places = page.content;
        }
        if (cancelled) return;
        setStayPlaces(places);
        cachePlaces(places);
      } catch {
        if (cancelled) return;
        setStayError('숙소를 불러오지 못했어요');
        if (useNearby) setNearbyError('위치 정보를 가져오지 못했어요');
      } finally {
        if (!cancelled) setStayLoading(false);
      }
    };
    loadStayPlaces();
    return () => { cancelled = true; };
  }, [stayCategory, useNearby, effectiveRegion]);

  const builderItems = builderItemIds
    .map((id) => placeCache[id])
    .filter(Boolean);

  const toggleBuilderItem = (place) => {
    if (builderItemIds.includes(place.id)) {
      setBuilderItemIds((current) => current.filter((id) => id !== place.id));
      showFeedback('코스 후보에서 뺐어요');
      return;
    }

    if (builderItemIds.length >= 5) {
      showFeedback('코스 후보는 최대 5곳까지 담을 수 있어요');
      return;
    }

    setBuilderItemIds((current) => [...current, place.id]);
    showFeedback('코스 빌더 후보에 담았어요');
  };

  const toggleLike = (placeId) => {
    setLikedItemIds((current) => (
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId]
    ));
  };

  const toggleStayLike = (placeId) => {
    setLikedStayIds((current) => (
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId]
    ));
  };

  const sendToBuilder = () => {
    if (!builderItems.length) {
      showFeedback('먼저 마음에 드는 장소를 담아 주세요');
      return;
    }

    const builderQueue = builderItems.map((place) => ({
      id: `curation:${place.id}`,
      source: 'curation',
      sourceId: place.id,
      title: place.name,
      description: place.subCategory || place.parentCategory,
      category: place.parentCategory,
      area: place.address,
      image: place.imageUrl,
      match: place.matchScore,
    }));

    try {
      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(builderQueue));
      window.dispatchEvent(new CustomEvent('date-manager:builder-queue-updated', {
        detail: builderQueue,
      }));
      showFeedback(`코스 빌더용으로 ${builderQueue.length}곳을 저장했어요`);
      onOpenBuilder?.(builderQueue);
    } catch {
      showFeedback('장소를 저장하지 못했어요. 다시 시도해 주세요');
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <SectionTitle sub="데이트 장소와 숙박을 한곳에서 이어서 골라보세요">
        데이트 큐레이션
      </SectionTitle>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-2xl bg-white p-1.5 shadow-sm"
          style={{ border: '1.5px solid #f0dce2' }}
          role="tablist"
          aria-label="큐레이션 화면 선택"
        >
          <button
            type="button"
            role="tab"
            aria-selected={curationView === 'date'}
            onClick={() => setCurationView('date')}
            className="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all"
            style={{
              color: curationView === 'date' ? 'white' : '#927d86',
              background: curationView === 'date' ? 'linear-gradient(135deg, #e36d87, #d78aae)' : 'transparent',
              boxShadow: curationView === 'date' ? '0 5px 14px rgba(211, 102, 133, 0.22)' : undefined,
            }}
          >
            💕 데이트
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={curationView === 'stay'}
            onClick={() => setCurationView('stay')}
            className="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all"
            style={{
              color: curationView === 'stay' ? 'white' : '#927d86',
              background: curationView === 'stay' ? 'linear-gradient(135deg, #806bb4, #69a3b8)' : 'transparent',
              boxShadow: curationView === 'stay' ? '0 5px 14px rgba(112, 98, 167, 0.22)' : undefined,
            }}
          >
            🌙 숙박
          </button>
        </div>
        <button
          type="button"
          onClick={() => setUseNearby((current) => !current)}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-extrabold transition-all"
          style={{
            background: useNearby ? '#4f3d46' : 'white',
            color: useNearby ? 'white' : '#7c6a72',
            border: '1.5px solid #f0dce2',
          }}
          aria-pressed={useNearby}
        >
          📍 내 주변만 보기
        </button>
      </div>
      {nearbyError && (
        <p className="text-[10px] font-bold" style={{ color: '#e8486b' }}>{nearbyError}</p>
      )}

      {/* 지역 필터 - 특정 지역을 고르면 "내 주변만 보기"와 개념이 충돌해서(지금 위치와 무관하게 그
          지역을 보고 싶은 거라서) 같이 꺼준다(2026-08-19). */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => {
            setRegion('');
            setSubRegion('');
            setUseNearby(true); // 특정 지역 선택하면서 꺼진 "내 주변만 보기"를 전체로 돌아오면 복원
          }}
          className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
          style={{
            background: region === '' ? '#4f3d46' : 'white',
            color: region === '' ? 'white' : '#7c6a72',
            border: '1.5px solid #f0dce2',
          }}
        >
          🗺️ 전체 지역
        </button>
        {REGIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setRegion(region === item ? '' : item);
              setSubRegion(''); // 시/도를 바꾸면 이전에 골라둔 구/시는 더 이상 안 맞을 수 있어서 초기화
              setUseNearby(false);
            }}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
            style={{
              background: region === item ? '#4f3d46' : 'white',
              color: region === item ? 'white' : '#7c6a72',
              border: '1.5px solid #f0dce2',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* 서울/경기 구/시 세부 필터 - 데이터가 많은 두 지역만 한 단계 더 좁혀볼 수 있게 함(2026-08-19).
          경기는 시/군이 31개라 너무 많아서 권역(북부/동북/동부/서부/남부) 라벨로 나눠 보여준다. */}
      {SUB_REGIONS[region] && (
        <div className="flex flex-col gap-1.5">
          {SUB_REGIONS[region].map((group) => (
            <div key={group.zone ?? 'all'} className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {group.zone && (
                <span className="flex-shrink-0 text-[10px] font-extrabold" style={{ color: '#b19fa6', width: '30px' }}>
                  {group.zone}
                </span>
              )}
              {group.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubRegion(subRegion === item ? '' : item)}
                  className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
                  style={{
                    background: subRegion === item ? '#e8486b' : '#fff7f8',
                    color: subRegion === item ? 'white' : '#a9838d',
                    border: `1px solid ${subRegion === item ? '#e8486b' : '#f6dde2'}`,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px]">
        <div
          className="flex items-start transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${curationView === 'date' ? '0%' : '-100%'})` }}
        >
          <section
            className="relative w-full flex-none overflow-hidden rounded-[28px] px-5 py-6 md:px-7"
            style={{
              background: 'linear-gradient(125deg, #fff0f3 0%, #fff8f4 55%, #f5effb 100%)',
              border: '1.5px solid #f0dce2',
              boxShadow: '0 10px 28px rgba(97, 66, 77, 0.06)',
            }}
            aria-hidden={curationView !== 'date'}
          >
            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35" />
            <div className="relative z-10">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-extrabold"
                style={{ color: '#e36d87' }}
              >
                💕 DATE CURATION
              </span>
              <h3 className="font-display mt-3 text-2xl font-bold" style={{ color: '#45343d' }}>
                취향에 맞는 데이트 장소를 골라보세요
              </h3>
              <p className="mt-1.5 max-w-xl text-xs leading-5" style={{ color: '#8e7882' }}>
                카테고리를 눌러 원하는 장소만 모아볼 수 있어요.
              </p>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {DATE_CATEGORIES.map((item) => {
                const selected = dateCategory === item.id;
                const count = item.categories.reduce((sum, key) => sum + (categoryCounts[key] ?? 0), 0);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDateCategory(selected ? 'all' : item.id)}
                    className="group flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 md:p-4"
                    style={{
                      background: selected ? 'white' : 'rgba(255,255,255,0.62)',
                      border: `1.5px solid ${selected ? `${item.color}75` : 'rgba(255,255,255,0.9)'}`,
                      boxShadow: selected ? `0 7px 18px ${item.color}1f` : undefined,
                    }}
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-lg transition-transform group-hover:scale-110"
                      style={{ background: item.background }}
                    >
                      {item.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-1">
                        <strong className="text-xs" style={{ color: selected ? item.color : '#4d3b44' }}>{item.label}</strong>
                        <small className="text-[9px] font-bold" style={{ color: '#b19fa6' }}>{count}곳</small>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className="relative w-full flex-none overflow-hidden rounded-[28px] px-5 py-6 md:px-7"
            style={{
              background: STAY_HERO.gradient,
              border: '1.5px solid #e3ddef',
              boxShadow: '0 10px 28px rgba(75, 65, 112, 0.08)',
            }}
            aria-hidden={curationView !== 'stay'}
          >
            <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full bg-white/45" />
            <div className="pointer-events-none absolute -bottom-16 left-[42%] h-36 w-36 rounded-full" style={{ background: 'rgba(189, 220, 235, 0.28)' }} />
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-extrabold"
                  style={{ color: STAY_HERO.accent }}
                >
                  {STAY_HERO.emoji} {STAY_HERO.label}
                </span>
                <h3 className="font-display mt-3 text-2xl font-bold" style={{ color: '#403747' }}>
                  {STAY_HERO.title}
                </h3>
                <p className="mt-1.5 max-w-xl text-xs leading-5" style={{ color: '#83788a' }}>
                  {STAY_HERO.description}
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-right shadow-sm">
                <p className="text-[10px] font-bold" style={{ color: '#9b8ca5' }}>추천 숙소</p>
                <strong className="mt-0.5 block text-xl" style={{ color: STAY_HERO.accent }}>
                  {categoryCounts[STAY_TOP_CATEGORY] ?? stayPlaces.length}곳
                </strong>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {STAY_CATEGORIES.map((item) => {
                const selected = stayCategory === item.id;
                const count = staySubCounts[item.id] ?? 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStayCategory(selected ? 'all' : item.id)}
                    className="group flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 md:p-4"
                    style={{
                      background: selected ? 'white' : 'rgba(255,255,255,0.65)',
                      border: `1.5px solid ${selected ? `${item.color}72` : 'rgba(255,255,255,0.92)'}`,
                      boxShadow: selected ? `0 7px 18px ${item.color}1f` : undefined,
                    }}
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-lg transition-transform group-hover:scale-110"
                      style={{ background: item.background }}
                    >
                      {item.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-1">
                        <strong className="text-xs" style={{ color: selected ? item.color : '#4d434f' }}>{item.label}</strong>
                        <small className="text-[9px] font-bold" style={{ color: '#aa9eb0' }}>{count}곳</small>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {curationView === 'date' ? (
        <>
          {builderItems.length > 0 && (
            <section
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: '#fff7f7', border: '1.5px solid #f6d4dc' }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-sm">🗺️</span>
                <div>
                  <p className="text-xs font-extrabold" style={{ color: '#513e47' }}>
                    코스 후보 {builderItems.length}곳을 골랐어요
                  </p>
                  <p className="mt-0.5 max-w-md truncate text-[10px]" style={{ color: '#a08b94' }}>
                    {builderItems.map((place) => place.name).join(' · ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={sendToBuilder}
                className="rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)', boxShadow: '0 5px 14px rgba(255,107,138,0.2)' }}
              >
                코스 빌더로 보내기 →
              </button>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold" style={{ color: '#45343d' }}>
                  {dateCategory === 'all' ? '전체' : DATE_CATEGORIES.find((item) => item.id === dateCategory)?.label}
                </h3>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: '#fff0f3', color: '#e8486b' }}>
                  {datePlaces.length}곳
                </span>
                {dateCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setDateCategory('all')}
                    className="text-[10px] font-bold underline underline-offset-2"
                    style={{ color: '#9f8b94' }}
                  >
                    전체 보기
                  </button>
                )}
              </div>
            </div>

            {dateLoading && (
              <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>불러오는 중...</p>
            )}
            {!dateLoading && dateError && (
              <p className="py-10 text-center text-xs font-bold" style={{ color: '#e8486b' }}>{dateError}</p>
            )}
            {!dateLoading && !dateError && datePlaces.length === 0 && (
              <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>아직 등록된 장소가 없어요</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {datePlaces.map((place) => {
                const inBuilder = builderItemIds.includes(place.id);
                const liked = likedItemIds.includes(place.id);
                const tag = place.subCategory || place.parentCategory;
                const matchingAxes = pickMatchingAxes(place, personaProfile);

                return (
                  <article
                    key={place.id}
                    className="group overflow-hidden rounded-[24px] bg-white transition-all hover:-translate-y-1"
                    style={{ border: '1.5px solid #f0dce2', boxShadow: '0 5px 18px rgba(89, 58, 70, 0.06)' }}
                  >
                    <div className="relative h-40 overflow-hidden bg-rose-50">
                      {place.imageUrl ? (
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          {place.emoji || '📍'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      {place.matchScore != null && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold" style={{ color: '#e8486b', backdropFilter: 'blur(6px)' }}>
                          ♥ {place.matchScore}% 매칭
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleLike(place.id)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
                        style={{ color: liked ? '#e8486b' : '#a9979e' }}
                        aria-label={`${place.name} 찜하기`}
                      >
                        {liked ? '♥' : '♡'}
                      </button>
                    </div>

                    <div className="p-4">
                      {/* 성향 매치 배지 - 원본 기획서("스마트 데이트 큐레이션") ①의 "장소 성향과 유저
                          성향 비교, 상위 특징 배지" 재현. 매칭%가 없어도(matchScore 파이프라인 미완성)
                          "어떤 성향에 왜 맞는지"는 보여줄 수 있어서 큐레이션만의 정보로 남긴다(2026-08-19). */}
                      {matchingAxes.length > 0 && (
                        <div className="mb-1.5 flex items-center gap-1.5">
                          {matchingAxes.map((axis) => (
                            <span key={axis.id} className="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                              style={{ background: `${axis.color}18`, color: axis.color, border: `1px solid ${axis.color}55` }}>
                              ✨ {axis.koreanLabel}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge color="#e8486b" bg="#fff0f3">{place.emoji ? `${place.emoji} ${tag}` : tag}</Badge>
                          {place.boxOfficeRank != null && (
                            <Badge color="#df9235" bg="#fff6e7">🔥 예매율 {place.boxOfficeRank}위</Badge>
                          )}
                        </div>
                        {place.runtimeText && (
                          <span className="text-[9px] font-bold" style={{ color: '#aa969e' }}>{place.runtimeText}</span>
                        )}
                      </div>
                      <h4 className="mt-2.5 truncate text-sm font-extrabold" style={{ color: '#43323a' }}>{place.name}</h4>

                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate" style={{ color: '#8f7b84' }}>📍 {place.address || '주소 정보 없음'}</span>
                      </div>
                      {/* 현실 체킹 태그 - 기획서 ②(웨이팅/가격/주차)를 데이트 카드에도 노출(2026-08-19).
                          지금까지는 숙박 카드에만 붙어있었음. */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {place.priceText && (
                          <span className="text-[10px] font-bold" style={{ color: '#66515a' }}>{place.priceText}</span>
                        )}
                        {place.waitingStatus && (
                          <Badge color="#3d9b86" bg="#eaf8f4">
                            ⏱ {place.waitingStatus}{place.waitingTeams ? ` · ${place.waitingTeams}팀` : ''}
                          </Badge>
                        )}
                        {place.parkingInfo && (
                          <Badge color="#806bb4" bg="#f1edff">🅿 {place.parkingInfo}</Badge>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleBuilderItem(place)}
                        className="mt-4 w-full rounded-xl py-2.5 text-[11px] font-extrabold transition-all"
                        style={{
                          background: inBuilder ? '#f3edef' : '#fff0f3',
                          color: inBuilder ? '#846f78' : '#e8486b',
                          border: `1px solid ${inBuilder ? '#e8dde1' : '#f6cdd7'}`,
                        }}
                      >
                        {inBuilder ? '✓ 코스 후보에 담김' : '+ 코스 빌더에 담기'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-bold" style={{ color: '#403747' }}>
                {stayCategory === 'all' ? '숙박 추천 전체' : STAY_CATEGORIES.find((item) => item.id === stayCategory)?.label}
              </h3>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: '#f1edff', color: '#806bb4' }}>
                {stayPlaces.length}곳
              </span>
              {stayCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setStayCategory('all')}
                  className="text-[10px] font-bold underline underline-offset-2"
                  style={{ color: '#968a9c' }}
                >
                  전체 보기
                </button>
              )}
            </div>
          </div>

          {stayLoading && (
            <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>불러오는 중...</p>
          )}
          {!stayLoading && stayError && (
            <p className="py-10 text-center text-xs font-bold" style={{ color: '#e8486b' }}>{stayError}</p>
          )}
          {!stayLoading && !stayError && stayPlaces.length === 0 && (
            <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>아직 등록된 숙소가 없어요</p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {stayPlaces.map((place) => {
              const liked = likedStayIds.includes(place.id);
              const expanded = expandedStayId === place.id;
              const hasExtra = place.parkingInfo || (place.amenities && place.amenities.length > 0) || place.waitingStatus;

              return (
                <article
                  key={place.id}
                  className="group overflow-hidden rounded-[24px] bg-white transition-all hover:-translate-y-1"
                  style={{ border: '1.5px solid #e6dfed', boxShadow: '0 6px 20px rgba(70, 57, 89, 0.07)' }}
                >
                  <div className="relative h-48 overflow-hidden bg-violet-50">
                    {place.imageUrl ? (
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">
                        {place.emoji || '🌙'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    {place.matchScore != null && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold" style={{ color: '#806bb4', backdropFilter: 'blur(6px)' }}>
                        ♥ {place.matchScore}% 매칭
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleStayLike(place.id)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
                      style={{ color: liked ? '#806bb4' : '#a79dab' }}
                      aria-label={`${place.name} 찜하기`}
                    >
                      {liked ? '♥' : '♡'}
                    </button>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: 'rgba(49,39,58,0.58)', backdropFilter: 'blur(7px)' }}>
                        {place.emoji || '🌙'} {place.subCategory || '숙박'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="truncate text-base font-extrabold" style={{ color: '#403747' }}>{place.name}</h4>
                    <p className="mt-1 truncate text-[10px]" style={{ color: '#95899b' }}>📍 {place.address || '주소 정보 없음'}</p>
                    {place.priceText && (
                      <p className="mt-1 text-[10px] font-bold" style={{ color: '#594c63' }}>{place.priceText}</p>
                    )}

                    {expanded && (
                      <div className="mt-3 space-y-1.5 rounded-xl px-3 py-2.5 text-[10px] leading-5" style={{ background: '#fffaf7', color: '#877982' }}>
                        {place.waitingStatus && <p>웨이팅: {place.waitingStatus}{place.waitingTeams ? ` · ${place.waitingTeams}팀 대기` : ''}</p>}
                        {place.parkingInfo && <p>주차: {place.parkingInfo}</p>}
                        {place.amenities?.length > 0 && <p>편의시설: {place.amenities.join(', ')}</p>}
                        {!hasExtra && <p>아직 등록된 추가 정보가 없어요</p>}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedStayId(expanded ? null : place.id)}
                        className="rounded-xl py-2.5 text-[11px] font-extrabold transition-colors"
                        style={{ background: '#f5f1f8', color: '#75677f', border: '1px solid #e6dfeb' }}
                        aria-expanded={expanded}
                      >
                        {expanded ? '상세 닫기' : '상세 보기'}
                      </button>
                      {place.bookingUrl ? (
                        <a
                          href={place.bookingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl py-2.5 text-center text-[11px] font-extrabold text-white transition-all hover:-translate-y-0.5"
                          style={{ background: 'linear-gradient(135deg, #806bb4, #66a4b7)', boxShadow: '0 5px 14px rgba(103, 91, 153, 0.2)' }}
                        >
                          예약 링크 ↗
                        </a>
                      ) : (
                        <span
                          className="flex items-center justify-center rounded-xl py-2.5 text-center text-[10px] font-bold"
                          style={{ background: '#f5f1f8', color: '#a79dab' }}
                        >
                          예약 링크 준비중
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div
        aria-live="polite"
        className={`fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all ${feedback ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        style={{ background: '#4f3d46' }}
      >
        ✓ {feedback}
      </div>
    </div>
  );
}
