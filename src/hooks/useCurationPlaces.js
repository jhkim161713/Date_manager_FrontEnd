import { useEffect, useState } from 'react';
import {
  getCurationPlaces,
  getNearbyCurationPlaces,
  getPlaceCategoryCounts,
  getPlaceSubCategoryCounts,
  getPlaceSubCategoryCatalog,
} from '../lib/api';
import { getCurrentLocation } from '../lib/weather';
import { DATE_CATEGORIES } from '../data/curationCategories';
import { useDebouncedValue } from './useDebouncedValue';

const STAY_TOP_CATEGORY = '숙박';
const PAGE_SIZE = 24;

// CurationTab의 필터 상태 + 데이트/숙박 두 목록의 데이터 로딩을 전부 감싼 훅(2026-08-24 분리).
// 원래 CurationTab.jsx 하나에 다 있던 로직이라, 탭 컴포넌트는 이 훅이 돌려주는 값만 그대로
// 렌더링에 쓰면 된다.
export function useCurationPlaces() {
  const [curationView, setCurationView] = useState('date');
  const [dateCategory, setDateCategory] = useState('all');
  // 세부칩(2026-08-22, 처음엔 맛집만 하드코딩했다가 "전체 카테고리로 확장 + DB에서 직접
  // 받아오자"는 요청으로 일반화함) - 선택된 dateCategory 하나의 세부분류 목록을 DB에서 그대로
  // 받아와서 칩으로 그린다. dateCategory가 바뀌면 의미가 없어지므로 아래 effect에서 같이 초기화.
  const [dateSubCategory, setDateSubCategory] = useState('all');
  const [dateSubCatalog, setDateSubCatalog] = useState([]);
  const [dateSubCounts, setDateSubCounts] = useState({});
  const [stayCategory, setStayCategory] = useState('all');
  // 지역 필터 - 빈 문자열이면 "전체 지역". 데이트/숙박 화면 둘 다 공유한다(2026-08-19).
  const [region, setRegion] = useState('');
  // 서울/경기를 고르면 나오는 구/시 세부 필터. 실제 API엔 subRegion이 있으면 그게 region보다
  // 더 구체적이라 subRegion을 우선해서 보낸다(아래 effectiveRegion 참고).
  const [subRegion, setSubRegion] = useState('');
  const effectiveRegion = subRegion || region;

  // 장소 이름 검색(2026-08-19) - 지역/카테고리 필터와 AND로 조합된다.
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword, 300);

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

  // 세부칩 목록+개수를 dateCategory가 바뀔 때마다 새로 받아온다(2026-08-22) - "전체"거나 세부분류가
  // 없는 대분류(예: 스포츠는 4개뿐이라도 있지만, 혹시라도 0개인 대분류)면 그냥 빈 배열로 둬서
  // 칩 자체가 안 뜨게 한다. dateCategory가 바뀌면 이전에 골라둔 세부칩 선택도 같이 초기화한다 -
  // 안 그러면 예를 들어 "캐주얼·브런치"를 고른 채로 "공연"으로 넘어갔다가 다시 "맛집"으로 돌아왔을
  // 때 뜬금없이 그 세부칩이 계속 선택된 채로 남아있는다.
  useEffect(() => {
    setDateSubCategory('all');
    if (dateCategory === 'all') {
      setDateSubCatalog([]);
      setDateSubCounts({});
      return;
    }
    let cancelled = false;
    Promise.all([
      getPlaceSubCategoryCatalog(dateCategory).catch(() => []),
      getPlaceSubCategoryCounts(dateCategory, region, subRegion).catch(() => ({})),
    ]).then(([catalog, counts]) => {
      if (cancelled) return;
      setDateSubCatalog(catalog);
      setDateSubCounts(counts);
    });
    return () => { cancelled = true; };
  }, [dateCategory]);

  // 지역을 바꾸면 세부칩 개수도 그 지역 기준으로 다시 집계한다(카탈로그 자체는 지역과 무관해서
  // 다시 안 받아온다).
  useEffect(() => {
    if (dateCategory === 'all') return;
    // 서버 응답이 객체가 아니면(재시작 중 빈 응답 등) 그대로 넣지 않는다 - dateSubCounts[key] 접근이
    // null에서 터지는 걸 막기 위함.
    getPlaceSubCategoryCounts(dateCategory, region, subRegion)
      .then((counts) => setDateSubCounts(counts && typeof counts === 'object' ? counts : {}))
      .catch(() => setDateSubCounts({}));
  }, [region, subRegion, dateCategory]);

  // 필터가 바뀌면 이전 필터 기준 페이지 번호가 더 이상 안 맞을 수 있어서 1페이지로 되돌린다(2026-08-19).
  useEffect(() => { setDatePage(1); }, [dateCategory, dateSubCategory, useNearby, effectiveRegion, debouncedKeyword]);
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
      // 세부칩(2026-08-22) - 대분류를 하나 고른 상태에서만 의미가 있어서 그 외엔 항상 빈 값.
      const subCategoryParam = dateCategory !== 'all' && dateSubCategory !== 'all' ? dateSubCategory : '';

      try {
        let places;
        if (useNearby) {
          // nearby API는 offset 페이징을 지원 안 해서(2026-08-19), 넉넉한 풀(PAGE_SIZE의 5배)을 한 번에
          // 받아온 다음 프론트에서 페이지 단위로 잘라 쓴다(홈탭 페이징과 같은 방식).
          const { lat, lon } = await getCurrentLocation();
          const pool = await getNearbyCurationPlaces({ lat, lon, category: categoryParam, subCategory: subCategoryParam, region, district: subRegion, keyword: debouncedKeyword, limit: PAGE_SIZE * 5 });
          setDateTotalPages(Math.max(1, Math.ceil(pool.length / PAGE_SIZE)));
          places = pool.slice((datePage - 1) * PAGE_SIZE, datePage * PAGE_SIZE);
        } else {
          const page = await getCurationPlaces({ category: categoryParam, subCategory: subCategoryParam, region, district: subRegion, keyword: debouncedKeyword, energyTarget, lat: weatherLat, lon: weatherLon, page: datePage, size: PAGE_SIZE });
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
  }, [dateCategory, dateSubCategory, useNearby, effectiveRegion, debouncedKeyword, datePage, energyTarget, weatherLat, weatherLon]);

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

  return {
    curationView, setCurationView,
    dateCategory, setDateCategory,
    dateSubCategory, setDateSubCategory,
    dateSubCatalog, dateSubCounts,
    stayCategory, setStayCategory,
    region, setRegion,
    subRegion, setSubRegion,
    keyword, setKeyword,
    datePlaces, dateLoading, dateError,
    datePage, setDatePage, dateTotalPages,
    stayPlaces, stayLoading, stayError,
    stayPage, setStayPage, stayTotalPages,
    categoryCounts, staySubCounts,
    nearbyError,
    energyTarget, setEnergyTarget,
    STAY_TOP_CATEGORY,
  };
}
