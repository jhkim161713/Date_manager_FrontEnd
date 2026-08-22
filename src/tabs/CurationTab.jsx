import { useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionTitle } from '../components/SectionTitle';
import { getCurationPlaces, getNearbyCurationPlaces, getPlaceCategoryCounts, getPlaceSubCategoryCounts, likePlace, addPlaceToCourse } from '../lib/api';
import { getCurrentLocation } from '../lib/weather';
import { BUILDER_STORAGE_KEY, CURATION_CART_STORAGE_KEY } from '../data/curationData';
import { DATE_CATEGORIES } from '../data/curationCategories';
import { STAY_CATEGORIES, STAY_HERO } from '../data/stayData';
import { PERSONA_AXES } from '../data/onboardingData';

const STAY_TOP_CATEGORY = '숙박';
const PAGE_SIZE = 24;

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
function pickMatchingAxes(place, personaProfile) {
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

// 지역 필터용 시/도 목록(2026-08-19). Place.address엔 별도 시/도 컬럼이 없어서 이 문자열이 주소에
// 포함되는지로 판단한다(예: "서울" -> "서울특별시 강남구 ..."에 포함됨) - 그래서 정식 명칭 대신
// 주소에 실제로 등장하는 짧은 형태를 쓴다.
// 충북/충남/경북/경남은 별도 칩으로 안 둔다 - 앱 성격상 시/도를 17개나 세분화해서 보여줄 필요가
// 없다고 판단해 "대전"/"대구"를 고르면 그 지역 데이터까지 같이 보여주도록 통합했다(백엔드
// PlaceController.expandRegion 참고). 실제로는 대전/대구 자체보다 충청/경상 데이터가 훨씬 많다.
const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '전북', '전남', '제주',
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
  // 아래 5개(부산/강원/전남/대전/대구)는 숙박 실측 결과 1,500건 이상이라 구/시 단위로 한 번 더
  // 좁힐 수 있게 추가했다(2026-08-19). "중구"/"동구"/"고성군"처럼 여러 시/도가 똑같이 쓰는 구/시
  // 이름이 섞여 있어서, 이 값 하나만으로 address를 검색하면 안 되고 반드시 상위 region(대전/대구는
  // 통합된 3개 지역 중 하나)과 AND로 같이 걸어야 정확히 매치된다 - district 파라미터로 그렇게
  // 처리되도록 컨트롤러/리포지토리를 같이 손봤다.
  부산: [
    { zone: '원도심', items: ['중구', '서구', '동구', '영도구', '부산진구'] },
    { zone: '동부', items: ['해운대구', '수영구', '연제구', '동래구'] },
    { zone: '서부', items: ['사상구', '사하구', '북구', '강서구'] },
    { zone: '남부·기장', items: ['남구', '금정구', '기장군'] },
  ],
  강원: [
    { zone: '영동북부', items: ['속초시', '고성군', '양양군', '강릉시'] },
    { zone: '영동남부', items: ['동해시', '삼척시', '태백시'] },
    { zone: '영서', items: ['춘천시', '홍천군', '화천군', '양구군', '인제군', '철원군'] },
    { zone: '산간', items: ['원주시', '횡성군', '평창군', '정선군', '영월군'] },
  ],
  전남: [
    { zone: '서남', items: ['목포시', '무안군', '신안군', '영암군', '해남군', '완도군', '진도군'] },
    { zone: '동남', items: ['여수시', '순천시', '광양시', '고흥군', '보성군'] },
    { zone: '북부', items: ['나주시', '담양군', '곡성군', '구례군', '화순군', '장성군'] },
    { zone: '서북', items: ['영광군', '함평군', '강진군', '장흥군'] },
  ],
  // "대전" 칩은 실제로 대전/충북/충남 데이터를 다 합쳐서 보여준다(위 REGIONS 주석 참고) - 그래서
  // 구/시 목록도 세 지역 걸 다 같이 보여준다.
  대전: [
    { zone: '대전', items: ['중구', '동구', '서구', '유성구', '대덕구'] },
    { zone: '충북', items: [
      '청주시', '충주시', '제천시', '단양군', '괴산군', '증평군', '진천군', '음성군', '옥천군', '영동군', '보은군',
    ] },
    { zone: '충남 서해안', items: ['태안군', '서산시', '당진시', '홍성군', '보령시', '서천군'] },
    { zone: '충남 내륙', items: ['천안시', '아산시', '공주시', '논산시', '계룡시', '부여군', '예산군', '청양군', '금산군'] },
  ],
  // "대구" 칩도 대구/경북/경남을 다 합쳐서 보여준다.
  대구: [
    { zone: '대구', items: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'] },
    { zone: '경북 동해안', items: ['경주시', '포항시', '영덕군', '울진군', '울릉군'] },
    { zone: '경북 내륙', items: [
      '안동시', '구미시', '김천시', '상주시', '문경시', '영주시', '칠곡군', '성주군', '고령군',
      '군위군', '의성군', '청송군', '영양군', '예천군', '봉화군', '청도군',
    ] },
    { zone: '경남', items: [
      '창원시', '김해시', '거제시', '통영시', '진주시', '사천시', '양산시', '밀양시', '함안군',
      '창녕군', '고성군', '거창군', '합천군', '산청군', '함양군', '하동군', '남해군', '의령군',
    ] },
  ],
};

// 카드 하나를 그릴 때 필요한 필드로 백엔드 CurationPlaceDto를 그대로 쓴다. matchScore는 온보딩 저장
// 파이프라인이 없어서(2026-08-14 기준) 항상 null - 그래서 매칭% 배지/정렬은 값이 있을 때만 켠다.
export function CuriationTab({ onOpenBuilder, personaProfile, onStyleChanged }) {
  const [curationView, setCurationView] = useState('date');
  const [dateCategory, setDateCategory] = useState('all');
  const [stayCategory, setStayCategory] = useState('all');
  // 지역 필터 - 빈 문자열이면 "전체 지역". 데이트/숙박 화면 둘 다 공유한다(2026-08-19).
  const [region, setRegion] = useState('');
  // 서울/경기를 고르면 나오는 구/시 세부 필터. 실제 API엔 subRegion이 있으면 그게 region보다
  // 더 구체적이라 subRegion을 우선해서 보낸다(아래 effectiveRegion 참고).
  const [subRegion, setSubRegion] = useState('');
  const effectiveRegion = subRegion || region;

  // 장소 이름 검색(2026-08-19) - 지역/카테고리 필터와 AND로 조합된다(칩으로 지역을 좁혀둔 채로
  // 검색하면 그 지역 안에서만 이름이 매치되는 장소를 찾음). 타이핑마다 요청을 보내면 너무 잦아서
  // 300ms 동안 입력이 없을 때만 실제 검색어(debouncedKeyword)를 갱신해 API를 호출한다.
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const [datePlaces, setDatePlaces] = useState([]);
  const [dateLoading, setDateLoading] = useState(true);
  const [dateError, setDateError] = useState('');
  // 페이징(2026-08-19) - 1부터 시작(백엔드 application.yaml의 one-indexed-parameters 설정과 맞춤).
  const [datePage, setDatePage] = useState(1);
  const [dateTotalPages, setDateTotalPages] = useState(1);

  const [stayPlaces, setStayPlaces] = useState([]);
  const [stayLoading, setStayLoading] = useState(true);
  const [stayError, setStayError] = useState('');
  const [stayPage, setStayPage] = useState(1);
  const [stayTotalPages, setStayTotalPages] = useState(1);

  const [categoryCounts, setCategoryCounts] = useState({});
  const [staySubCounts, setStaySubCounts] = useState({});

  // 위치 기반(거리순) 조회 여부 - 수동 토글 없이, 지역을 특정 안 골랐을 때(effectiveRegion === '')만
  // 자동으로 켜진다. 특정 지역을 고르면 이미 위치 개념과 충돌해서 무조건 꺼야 했고, 안 고르면 항상
  // 켜야 했던 값이라 - 실제로 사용자가 수동으로 켜고 끌 일이 없어서(2026-08-19) 별도 상태 대신
  // effectiveRegion에서 그대로 파생시킨다.
  const useNearby = effectiveRegion === '';
  const [nearbyError, setNearbyError] = useState('');

  const [expandedStayId, setExpandedStayId] = useState(null);
  // 코스 빌더 담기함(2026-08-20) - place 객체를 통째로 담아서, 카테고리를 바꾸거나 이 탭을 나갔다
  // 와도(다른 탭으로 이동해 CurationTab이 언마운트됐다 다시 마운트돼도) localStorage에서 그대로
  // 복원된다. id만 들고 있다가 화면에 보이는 목록에서 다시 찾아 채우는 방식(placeCache)은 탭을
  // 나갔다 오면 그 캐시까지 초기화돼서 목록이 텅 비어 보이는 문제가 있었다 - place 통째로 저장하면
  // 그 문제가 안 생긴다. 로그아웃 시점에만 App.jsx에서 이 저장값을 지운다.
  const [builderItems, setBuilderItems] = useState(() => {
    try {
      const raw = localStorage.getItem(CURATION_CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(CURATION_CART_STORAGE_KEY, JSON.stringify(builderItems));
  }, [builderItems]);
  // 담기함 목록을 펼쳐서 개별 삭제할 수 있게 하는 토글(2026-08-20).
  const [showCart, setShowCart] = useState(false);

  const [likedItemIds, setLikedItemIds] = useState([]);
  const [likedStayIds, setLikedStayIds] = useState([]);
  const [feedback, setFeedback] = useState('');

  // 에너지 게이지(2026-08-20) - 지금 원하는 활력 정도(0~100). null이면 "안 씀" 상태라 기존 정렬 그대로.
  // 온보딩 성향값 저장 파이프라인이 아직 없어서(project-date-manager-aichat-persona-and-style-matching
  // 메모리 참고) 유저가 그 순간 직접 조정하는 임시 대안으로 만든 것.
  const [energyTarget, setEnergyTarget] = useState(null);

  // 날씨 기반 실내/실외 자동 필터용 좌표(2026-08-20) - useNearby와 별개로 항상 한 번 조회해둔다.
  // useNearby는 지역을 안 골랐을 때만 켜지는데, 날씨 필터는 지역을 골랐어도 동작해야 하기 때문(비가
  // 오면 그 지역 안에서도 실외 장소는 걸러야 하니까). 위치 권한이 없으면 조용히 실패하고 날씨
  // 필터 없이 기존처럼 동작한다.
  const [weatherLat, setWeatherLat] = useState(null);
  const [weatherLon, setWeatherLon] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getCurrentLocation()
      .then(({ lat, lon }) => { if (!cancelled) { setWeatherLat(lat); setWeatherLon(lon); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  // 카테고리 칩의 "N곳" 표시가 지역 필터랑 무관하게 항상 전국 집계만 보여주고 있던 문제 수정
  // (2026-08-19, 사용자가 실제 화면에서 발견) - effectiveRegion이 바뀔 때마다 그 지역 기준으로 다시 집계.
  useEffect(() => {
    const loadCategoryCounts = async () => {
      try {
        setCategoryCounts(await getPlaceCategoryCounts(region, subRegion));
      } catch {
        setCategoryCounts({});
      }
    };
    const loadStaySubCounts = async () => {
      try {
        setStaySubCounts(await getPlaceSubCategoryCounts(STAY_TOP_CATEGORY, region, subRegion));
      } catch {
        setStaySubCounts({});
      }
    };
    loadCategoryCounts();
    loadStaySubCounts();
  }, [region, subRegion]);

  // 필터가 바뀌면 이전 필터 기준 페이지 번호가 더 이상 안 맞을 수 있어서 1페이지로 되돌린다(2026-08-19).
  useEffect(() => { setDatePage(1); }, [dateCategory, useNearby, effectiveRegion, debouncedKeyword]);
  useEffect(() => { setStayPage(1); }, [stayCategory, useNearby, effectiveRegion, debouncedKeyword]);

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
          // nearby API는 offset 페이징을 지원 안 해서(2026-08-19), 넉넉한 풀(PAGE_SIZE의 5배)을 한 번에
          // 받아온 다음 프론트에서 페이지 단위로 잘라 쓴다(홈탭 페이징과 같은 방식).
          const { lat, lon } = await getCurrentLocation();
          const pool = await getNearbyCurationPlaces({ lat, lon, category: categoryParam, region, district: subRegion, keyword: debouncedKeyword, limit: PAGE_SIZE * 5 });
          setDateTotalPages(Math.max(1, Math.ceil(pool.length / PAGE_SIZE)));
          places = pool.slice((datePage - 1) * PAGE_SIZE, datePage * PAGE_SIZE);
        } else {
          const page = await getCurationPlaces({ category: categoryParam, region, district: subRegion, keyword: debouncedKeyword, energyTarget, lat: weatherLat, lon: weatherLon, page: datePage, size: PAGE_SIZE });
          setDateTotalPages(Math.max(1, page.totalPages ?? 1));
          places = page.content;
        }
        if (cancelled) return;
        setDatePlaces(places);
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
  }, [dateCategory, useNearby, effectiveRegion, debouncedKeyword, datePage, energyTarget, weatherLat, weatherLon]);

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
          const pool = await getNearbyCurationPlaces({ lat, lon, category: STAY_TOP_CATEGORY, subCategory, region, district: subRegion, keyword: debouncedKeyword, limit: PAGE_SIZE * 5 });
          setStayTotalPages(Math.max(1, Math.ceil(pool.length / PAGE_SIZE)));
          places = pool.slice((stayPage - 1) * PAGE_SIZE, stayPage * PAGE_SIZE);
        } else {
          const page = await getCurationPlaces({ category: STAY_TOP_CATEGORY, subCategory, region, district: subRegion, keyword: debouncedKeyword, energyTarget, lat: weatherLat, lon: weatherLon, page: stayPage, size: PAGE_SIZE });
          setStayTotalPages(Math.max(1, page.totalPages ?? 1));
          places = page.content;
        }
        if (cancelled) return;
        setStayPlaces(places);
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
  }, [stayCategory, useNearby, effectiveRegion, debouncedKeyword, stayPage, energyTarget, weatherLat, weatherLon]);

  const toggleBuilderItem = (place) => {
    if (builderItems.some((item) => item.id === place.id)) {
      setBuilderItems((current) => current.filter((item) => item.id !== place.id));
      showFeedback('코스 후보에서 뺐어요');
      return;
    }

    if (builderItems.length >= 5) {
      showFeedback('코스 후보는 최대 5곳까지 담을 수 있어요');
      return;
    }

    setBuilderItems((current) => [...current, place]);
    showFeedback('코스 빌더 후보에 담았어요');
    // 담기함 자체는 서버 저장 없이 로컬 state로만 유지하되, "담았다"는 의사표현 신호만 UserStyle
    // 실시간 갱신 엔진에 넘긴다(2026-08-22). 뺄 때는 호출 안 함 - 신호가 왜곡되지 않게.
    addPlaceToCourse(place.id).then(() => onStyleChanged?.()).catch(() => {});
  };

  // 담기함 목록에서 개별 항목을 뺄 때(2026-08-20, "잘못 담은 걸 삭제할 수 있어야 한다") 쓴다 -
  // toggleBuilderItem은 카드에서 다시 눌러 빼는 것과 같은 동작이라 재사용 가능.
  const removeFromCart = (placeId) => {
    setBuilderItems((current) => current.filter((item) => item.id !== placeId));
  };

  const toggleLike = (placeId) => {
    const isAdding = !likedItemIds.includes(placeId);
    setLikedItemIds((current) => (
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId]
    ));
    // 찜 목록도 담기함과 동일하게 로컬 state만 유지하고, 좋아요를 누르는 순간의 신호만
    // UserStyle 실시간 갱신 엔진에 넘긴다(2026-08-22). 찜 해제 시에는 호출 안 함.
    if (isAdding) likePlace(placeId).then(() => onStyleChanged?.()).catch(() => {});
  };

  const toggleStayLike = (placeId) => {
    const isAdding = !likedStayIds.includes(placeId);
    setLikedStayIds((current) => (
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId]
    ));
    if (isAdding) likePlace(placeId).then(() => onStyleChanged?.()).catch(() => {});
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
        🎬 데이트 큐레이션
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
      </div>
      {nearbyError && (
        <p className="text-[10px] font-bold" style={{ color: '#e8486b' }}>{nearbyError}</p>
      )}

      {/* 장소 이름 검색 - 지역 칩이 선택돼 있으면 그 지역 안에서만 검색된다(effectiveRegion과
          AND로 조합, 2026-08-19). */}
      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={region ? `${subRegion || region} 안에서 이름으로 검색` : '장소 이름으로 검색'}
          className="w-full rounded-full pl-4 pr-9 py-2 text-[12px] font-bold outline-none"
          style={{ border: '1.5px solid #f0dce2', color: '#4f3d46' }}
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold"
            style={{ color: '#b19fa6' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 지역 필터 - 특정 지역을 고르면 위치 기반 정렬(useNearby)은 자동으로 꺼진다(지금 위치와
          무관하게 그 지역을 보고 싶은 거라서, 위 useNearby 파생 로직 참고). 에너지 게이지(2026-08-20)는
          사용자 요청으로 이 지역 칩 줄 바로 옆에 배치했다 - 건전지 이모지 + 초록 계열 색상. */}
      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => {
              setRegion('');
              setSubRegion('');
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

        {/* 에너지 게이지 - 유저 성향값 저장 파이프라인이 아직 없어서(온보딩 미완성) 지금 당장은 그
            순간 원하는 활력 정도를 직접 조정하는 임시 방식으로 만듦. 값을 만지면 scoreEnergy가 가까운
            장소 순으로 정렬되고(필터가 아니라 정렬이라 결과 수는 그대로), 안 만지면(null) 기존
            정렬(최신순) 그대로 동작한다. */}
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5" style={{ border: '1.5px solid #cdeacd' }}>
          <span className="whitespace-nowrap text-[10px] font-bold" style={{ color: '#5a8a5f' }}>
            당신의 에너지를 입력하세요
          </span>
          <span className="text-xs">🔋</span>
          <input
            type="range"
            min={0}
            max={100}
            value={energyTarget ?? 50}
            onChange={(event) => setEnergyTarget(Number(event.target.value))}
            className="w-20 accent-[#4caf6e]"
          />
          {energyTarget != null && (
            <button
              type="button"
              onClick={() => setEnergyTarget(null)}
              className="text-[10px] font-bold"
              style={{ color: '#8fae8f' }}
              title="에너지 게이지 초기화"
            >
              ✕
            </button>
          )}
        </div>
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
              className="rounded-2xl px-4 py-3.5"
              style={{ background: '#fff7f7', border: '1.5px solid #f6d4dc' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">🗺️</span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold" style={{ color: '#513e47' }}>
                      코스 후보 {builderItems.length}곳을 골랐어요
                    </p>
                    {!showCart && (
                      <p className="mt-0.5 max-w-md truncate text-[10px]" style={{ color: '#a08b94' }}>
                        {builderItems.map((place) => place.name).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                {/* "목록보기"를 잘 눈에 띄는 독립 버튼으로(2026-08-20) */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCart((current) => !current)}
                    className="rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all hover:-translate-y-0.5"
                    style={{ background: 'white', color: '#c4818f', border: '1.5px solid #f6cdd7' }}
                    aria-expanded={showCart}
                  >
                    {showCart ? '▲ 접기' : '▼ 목록보기'}
                  </button>
                  <button
                    type="button"
                    onClick={sendToBuilder}
                    className="rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)', boxShadow: '0 5px 14px rgba(255,107,138,0.2)' }}
                  >
                    코스 빌더로 보내기 →
                  </button>
                </div>
              </div>

              {/* 담기함 목록(2026-08-20) - "목록보기"를 눌러야 펼쳐지고, 항목마다 ✕로 잘못 담은
                  장소를 바로 뺄 수 있다. */}
              {showCart && (
                <ul className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: '#f6d4dc' }}>
                  {builderItems.map((place) => (
                    <li
                      key={place.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"
                      style={{ border: '1px solid #f6dde2' }}
                    >
                      <span className="min-w-0 truncate text-[11px] font-bold" style={{ color: '#513e47' }}>
                        {place.name}
                        <span className="ml-1.5 font-medium" style={{ color: '#b19fa6' }}>
                          {place.subCategory || place.parentCategory}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(place.id)}
                        className="flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold transition-colors hover:bg-rose-50"
                        style={{ color: '#c4818f' }}
                        aria-label={`${place.name} 담기함에서 빼기`}
                      >
                        ✕ 빼기
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
                const inBuilder = builderItems.some((item) => item.id === place.id);
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

            {/* 페이징(2026-08-19) - 결과가 있을 때만 표시 */}
            {!dateLoading && !dateError && datePlaces.length > 0 && dateTotalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDatePage((p) => Math.max(1, p - 1))}
                  disabled={datePage === 1}
                  className="rounded-full px-3 py-1.5 text-xs font-extrabold transition-all disabled:opacity-30"
                  style={{ background: '#fff0f3', color: '#e8486b' }}
                >
                  ‹ 이전
                </button>
                <span className="text-xs font-bold" style={{ color: '#8f7b84' }}>
                  {datePage} / {dateTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setDatePage((p) => Math.min(dateTotalPages, p + 1))}
                  disabled={datePage === dateTotalPages}
                  className="rounded-full px-3 py-1.5 text-xs font-extrabold transition-all disabled:opacity-30"
                  style={{ background: '#fff0f3', color: '#e8486b' }}
                >
                  다음 ›
                </button>
              </div>
            )}
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

          {!stayLoading && !stayError && stayPlaces.length > 0 && stayTotalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStayPage((p) => Math.max(1, p - 1))}
                disabled={stayPage === 1}
                className="rounded-full px-3 py-1.5 text-xs font-extrabold transition-all disabled:opacity-30"
                style={{ background: '#f1edff', color: '#806bb4' }}
              >
                ‹ 이전
              </button>
              <span className="text-xs font-bold" style={{ color: '#95899b' }}>
                {stayPage} / {stayTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setStayPage((p) => Math.min(stayTotalPages, p + 1))}
                disabled={stayPage === stayTotalPages}
                className="rounded-full px-3 py-1.5 text-xs font-extrabold transition-all disabled:opacity-30"
                style={{ background: '#f1edff', color: '#806bb4' }}
              >
                다음 ›
              </button>
            </div>
          )}
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
