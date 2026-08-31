import { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { PlaceDetailModal } from '../components/PlaceDetailModal';
import { Pager } from '../components/curation/Pager';
import { DatePlaceCard } from '../components/curation/DatePlaceCard';
import { StayPlaceCard } from '../components/curation/StayPlaceCard';
import { RegionFilterBar } from '../components/curation/RegionFilterBar';
import { DateCategoryHero } from '../components/curation/DateCategoryHero';
import { StayCategoryHero } from '../components/curation/StayCategoryHero';
import { BuilderCartPanel } from '../components/curation/BuilderCartPanel';
import { getPlace } from '../lib/api';
import { DATE_CATEGORIES } from '../data/curationCategories';
import { STAY_CATEGORIES } from '../data/stayData';
import { useCurationPlaces } from '../hooks/useCurationPlaces';
import { useBuilderCart } from '../hooks/useBuilderCart';
import { useLikedPlaces } from '../hooks/useLikedPlaces';

// 카드 하나를 그릴 때 필요한 필드로 백엔드 CurationPlaceDto를 그대로 쓴다. matchScore는 온보딩 저장
// 파이프라인이 없어서(2026-08-14 기준) 항상 null - 그래서 매칭% 배지/정렬은 값이 있을 때만 켠다.
export function CuriationTab({ onOpenBuilder, personaProfile, onStyleChanged, onAddToCalendar }) {
  const curation = useCurationPlaces();
  const [expandedStayId, setExpandedStayId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  const { builderItems, showCart, setShowCart, toggleBuilderItem, removeFromCart, sendToBuilder } =
    useBuilderCart({ onStyleChanged, onOpenBuilder, showFeedback });
  const { likedItemIds, likedStayIds, toggleLike, toggleStayLike } = useLikedPlaces({ onStyleChanged });

  // "캘린더에 담기"(2026-08-22) - 공연류는 실제 공연일을 알 수 있어 자동으로 채우고(상세 API를
  // 한 번 더 불러야 함 - CurationPlaceDto엔 날짜가 없어서), 그 외 카테고리는 카테고리마다 날짜
  // 유무 기준이 제각각이라 정확히 판단하기 어려우므로 그냥 비워두고 사용자가 직접 입력하게 한다.
  const addToCalendar = async (place) => {
    let targetDate = null;
    if (place.parentCategory === '공연') {
      try {
        const detail = await getPlace(place.id);
        targetDate = detail.startDate || null;
      } catch {
        // 상세 조회 실패해도 캘린더 프리필 자체는 계속 진행 - 날짜만 비워둔 채로.
      }
    }
    onAddToCalendar?.({ title: place.name, targetDate });
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
            aria-selected={curation.curationView === 'date'}
            onClick={() => curation.setCurationView('date')}
            className="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all"
            style={{
              color: curation.curationView === 'date' ? 'white' : '#927d86',
              background: curation.curationView === 'date' ? 'linear-gradient(135deg, #e36d87, #d78aae)' : 'transparent',
              boxShadow: curation.curationView === 'date' ? '0 5px 14px rgba(211, 102, 133, 0.22)' : undefined,
            }}
          >
            💕 데이트
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={curation.curationView === 'stay'}
            onClick={() => curation.setCurationView('stay')}
            className="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all"
            style={{
              color: curation.curationView === 'stay' ? 'white' : '#927d86',
              background: curation.curationView === 'stay' ? 'linear-gradient(135deg, #806bb4, #69a3b8)' : 'transparent',
              boxShadow: curation.curationView === 'stay' ? '0 5px 14px rgba(112, 98, 167, 0.22)' : undefined,
            }}
          >
            🌙 숙박
          </button>
        </div>
      </div>

      {curation.nearbyError && (
        <p className="text-[10px] font-bold" style={{ color: '#e8486b' }}>{curation.nearbyError}</p>
      )}

      {/* 장소 이름 검색 - 지역 칩이 선택돼 있으면 그 지역 안에서만 검색된다(effectiveRegion과
          AND로 조합, 2026-08-19). */}
      <div className="relative">
        <input
          type="text"
          value={curation.keyword}
          onChange={(e) => curation.setKeyword(e.target.value)}
          placeholder={curation.region ? `${curation.subRegion || curation.region} 안에서 이름으로 검색` : '장소 이름으로 검색'}
          className="w-full rounded-full pl-4 pr-9 py-2 text-[12px] font-bold outline-none"
          style={{ border: '1.5px solid #f0dce2', color: '#4f3d46' }}
        />
        {curation.keyword && (
          <button
            type="button"
            onClick={() => curation.setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold"
            style={{ color: '#b19fa6' }}
          >
            ✕
          </button>
        )}
      </div>

      <RegionFilterBar
        region={curation.region}
        setRegion={curation.setRegion}
        subRegion={curation.subRegion}
        setSubRegion={curation.setSubRegion}
        energyTarget={curation.energyTarget}
        setEnergyTarget={curation.setEnergyTarget}
      />

      <div className="overflow-hidden rounded-[28px]">
        <div
          className="flex items-start transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${curation.curationView === 'date' ? '0%' : '-100%'})` }}
        >
          <DateCategoryHero
            visible={curation.curationView === 'date'}
            dateCategory={curation.dateCategory}
            setDateCategory={curation.setDateCategory}
            categoryCounts={curation.categoryCounts}
            dateSubCatalog={curation.dateSubCatalog}
            dateSubCounts={curation.dateSubCounts}
            dateSubCategory={curation.dateSubCategory}
            setDateSubCategory={curation.setDateSubCategory}
          />
          <StayCategoryHero
            visible={curation.curationView === 'stay'}
            stayCategory={curation.stayCategory}
            setStayCategory={curation.setStayCategory}
            staySubCounts={curation.staySubCounts}
            stayCount={curation.categoryCounts[curation.STAY_TOP_CATEGORY] ?? curation.stayPlaces.length}
          />
        </div>
      </div>

      {curation.curationView === 'date' ? (
        <>
          <BuilderCartPanel
            builderItems={builderItems}
            showCart={showCart}
            setShowCart={setShowCart}
            removeFromCart={removeFromCart}
            sendToBuilder={sendToBuilder}
          />

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold" style={{ color: '#45343d' }}>
                  {curation.dateCategory === 'all' ? '전체' : DATE_CATEGORIES.find((item) => item.id === curation.dateCategory)?.label}
                </h3>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: '#fff0f3', color: '#e8486b' }}>
                  {curation.datePlaces.length}곳
                </span>
                {curation.dateCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => curation.setDateCategory('all')}
                    className="text-[10px] font-bold underline underline-offset-2"
                    style={{ color: '#9f8b94' }}
                  >
                    전체 보기
                  </button>
                )}
              </div>

              {/* 공연 랭킹(KOPIS 박스오피스)순 정렬 토글(2026-08-27) - "내 주변만 보기"는 별도 API라
                  아직 랭킹 정렬을 못 받아서, 지역을 하나라도 골랐을 때만 켤 수 있다. */}
              <button
                type="button"
                disabled={curation.useNearby}
                onClick={() => curation.setSortByRank((v) => !v)}
                title={curation.useNearby ? '지역을 먼저 선택하면 랭킹순 정렬을 쓸 수 있어요' : undefined}
                className="rounded-full px-3 py-1.5 text-[10px] font-extrabold transition-all"
                style={{
                  background: curation.sortByRank ? 'linear-gradient(135deg, #df9235, #e8b45f)' : '#fff6e7',
                  color: curation.sortByRank ? 'white' : '#c98a3d',
                  border: '1px solid #f3ddb8',
                  opacity: curation.useNearby ? 0.45 : 1,
                  cursor: curation.useNearby ? 'not-allowed' : 'pointer',
                }}
              >
                🔥 예매율 랭킹순{curation.sortByRank ? ' ✓' : ''}
              </button>
            </div>

            {curation.dateLoading && (
              <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>불러오는 중...</p>
            )}
            {!curation.dateLoading && curation.dateError && (
              <p className="py-10 text-center text-xs font-bold" style={{ color: '#e8486b' }}>{curation.dateError}</p>
            )}
            {!curation.dateLoading && !curation.dateError && curation.datePlaces.length === 0 && (
              <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>아직 등록된 장소가 없어요</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {curation.datePlaces.map((place) => (
                <DatePlaceCard
                  key={place.id}
                  place={place}
                  personaProfile={personaProfile}
                  liked={likedItemIds.includes(place.id)}
                  inBuilder={builderItems.some((item) => item.id === place.id)}
                  onSelect={setSelectedPlaceId}
                  onToggleLike={toggleLike}
                  onToggleBuilder={toggleBuilderItem}
                  onAddToCalendar={addToCalendar}
                />
              ))}
            </div>

            {!curation.dateLoading && !curation.dateError && curation.datePlaces.length > 0 && (
              <Pager
                page={curation.datePage}
                totalPages={curation.dateTotalPages}
                onPrev={() => curation.setDatePage((p) => Math.max(1, p - 1))}
                onNext={() => curation.setDatePage((p) => Math.min(curation.dateTotalPages, p + 1))}
                activeBg="#fff0f3"
                activeColor="#e8486b"
                textColor="#8f7b84"
              />
            )}
          </section>
        </>
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-bold" style={{ color: '#403747' }}>
                {curation.stayCategory === 'all' ? '숙박 추천 전체' : STAY_CATEGORIES.find((item) => item.id === curation.stayCategory)?.label}
              </h3>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: '#f1edff', color: '#806bb4' }}>
                {curation.stayPlaces.length}곳
              </span>
              {curation.stayCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => curation.setStayCategory('all')}
                  className="text-[10px] font-bold underline underline-offset-2"
                  style={{ color: '#968a9c' }}
                >
                  전체 보기
                </button>
              )}
            </div>
          </div>

          {curation.stayLoading && (
            <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>불러오는 중...</p>
          )}
          {!curation.stayLoading && curation.stayError && (
            <p className="py-10 text-center text-xs font-bold" style={{ color: '#e8486b' }}>{curation.stayError}</p>
          )}
          {!curation.stayLoading && !curation.stayError && curation.stayPlaces.length === 0 && (
            <p className="py-10 text-center text-xs font-bold" style={{ color: '#b19fa6' }}>아직 등록된 숙소가 없어요</p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {curation.stayPlaces.map((place) => (
              <StayPlaceCard
                key={place.id}
                place={place}
                liked={likedStayIds.includes(place.id)}
                expanded={expandedStayId === place.id}
                onToggleExpand={() => setExpandedStayId(expandedStayId === place.id ? null : place.id)}
                onToggleLike={toggleStayLike}
              />
            ))}
          </div>

          {!curation.stayLoading && !curation.stayError && curation.stayPlaces.length > 0 && (
            <Pager
              page={curation.stayPage}
              totalPages={curation.stayTotalPages}
              onPrev={() => curation.setStayPage((p) => Math.max(1, p - 1))}
              onNext={() => curation.setStayPage((p) => Math.min(curation.stayTotalPages, p + 1))}
              activeBg="#f1edff"
              activeColor="#806bb4"
              textColor="#95899b"
            />
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

      {selectedPlaceId && (
        <PlaceDetailModal placeId={selectedPlaceId} onClose={() => setSelectedPlaceId(null)}
          onToggleBuilder={toggleBuilderItem}
          inBuilder={builderItems.some((item) => item.id === selectedPlaceId)}
          onAddToCalendar={addToCalendar} />
      )}
    </div>
  );
}
