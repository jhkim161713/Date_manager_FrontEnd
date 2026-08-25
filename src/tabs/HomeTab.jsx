import { useEffect, useState } from 'react';
import { QUICK_TABS } from '../data/tabsData';
import { useWeather } from '../hooks/useWeather';
import { useLikedPlaces } from '../hooks/useLikedPlaces';
import { useHomeRecommendations } from '../hooks/useHomeRecommendations';
import { getCoupleStatus } from '../lib/api';
import { PlaceDetailModal } from '../components/PlaceDetailModal';
import { HeroBanner } from '../components/home/HeroBanner';
import { HomeCategoryChips } from '../components/home/HomeCategoryChips';
import { RecommendationCard } from '../components/home/RecommendationCard';

export function HomeTab({ onTabChange, personaProfile, onStyleChanged }) {
  // 배너 문구를 실제 커플 연결 상태에 따라 다르게 보여준다 - 예전엔 목업 커플타입과 가짜 코스
  // 개수를 썼는데, 실제 데이터 기반으로 교체(2026-08-13).
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
  const { likedItemIds, toggleLike } = useLikedPlaces({ onStyleChanged });
  const handleToggleLike = (e, placeId) => {
    e.stopPropagation(); // 카드 자체의 onClick(상세 모달 열기)으로 안 번지게
    toggleLike(placeId);
  };

  // 2026-08-22 - 카드를 클릭하면 큐레이션 탭으로 넘기기만 하던 걸(사실상 아무 정보도 안 보여줌),
  // 상세 모달을 바로 띄우도록 바꿨다.
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const {
    homeCategory, setHomeCategory, refresh,
    visibleCards, pageCount, currentPage, goPrev, goNext, goToPage,
  } = useHomeRecommendations(personaProfile);

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ━━━ ① 히어로 배너 ━━━ */}
      <HeroBanner coupleLinked={coupleLinked} weather={weather} onOpenBuilder={() => onTabChange('builder')} />

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
          <button type="button" onClick={refresh}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
            style={{ background: '#fff0f3', color: '#ff6b8a' }}>
            🔄 새로고침
          </button>
        </div>

        <HomeCategoryChips homeCategory={homeCategory} setHomeCategory={setHomeCategory} />

        {/* 한 페이지에 성향 카드 5축×2개(10) + 인기 공연 2개 = 최대 12개를 한꺼번에 보여주고,
            페이징하면 다음 12개(다른 후보)로 바뀐다 - useHomeRecommendations 참고(2026-08-19).
            공연은 useHomeRecommendations 내부 필터에서 이미 빠져 있어서 성향 카드와 인기 공연은
            서로 안 겹친다. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5">
          {visibleCards.map((entry) => (
            <RecommendationCard
              key={`${entry.kind}-${entry.place.id}`}
              entry={entry}
              liked={likedItemIds.includes(entry.place.id)}
              onSelect={setSelectedPlaceId}
              onToggleLike={handleToggleLike}
            />
          ))}
        </div>

        {/* 페이지 이동 - 다음 페이지를 누르면 지금과 겹치지 않는 다음 12개 후보 묶음을 보여준다 */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <button onClick={goPrev} disabled={currentPage === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-30"
              style={{ background: '#fff0f3', color: '#e8486b' }}>
              ‹
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button key={i} onClick={() => goToPage(i)}
                  aria-label={`${i + 1}페이지`}
                  className="rounded-full transition-all"
                  style={{
                    width: i === currentPage ? '18px' : '6px',
                    height: '6px',
                    background: i === currentPage ? '#e8486b' : '#ffd6e0',
                  }} />
              ))}
            </div>
            <button onClick={goNext} disabled={currentPage === pageCount - 1}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-30"
              style={{ background: '#fff0f3', color: '#e8486b' }}>
              ›
            </button>
          </div>
        )}
      </div>

      {selectedPlaceId && (
        <PlaceDetailModal placeId={selectedPlaceId} onClose={() => setSelectedPlaceId(null)} />
      )}
    </div>
  );
}
