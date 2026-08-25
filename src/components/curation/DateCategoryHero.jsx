import { DATE_CATEGORIES } from '../../data/curationCategories';

export function DateCategoryHero({ visible, dateCategory, setDateCategory, categoryCounts, dateSubCatalog, dateSubCounts, dateSubCategory, setDateSubCategory }) {
  return (
    <section
      className="relative w-full flex-none overflow-hidden rounded-[28px] px-5 py-6 md:px-7"
      style={{
        background: 'linear-gradient(125deg, #fff0f3 0%, #fff8f4 55%, #f5effb 100%)',
        border: '1.5px solid #f0dce2',
        boxShadow: '0 10px 28px rgba(97, 66, 77, 0.06)',
      }}
      aria-hidden={!visible}
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

      {/* 세부칩(2026-08-22, 기획안 3번 "성향 매치 배지" 대응) - 대분류를 하나 골랐을 때만
          한 단계 더 좁힐 수 있는 세부분류 칩. 목록/이모지는 DB(place_categories)에서 그대로
          받아오고(getPlaceSubCategoryCatalog), 처음에 맛집만 하드코딩했다가 실제 DB(14개)와
          어긋났던 걸 겪고 나서 전체 대분류로 일반화했다. 색상은 선택된 대분류 칩과 통일. */}
      {dateCategory !== 'all' && dateSubCatalog.length > 0 && (
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-1.5">
          {dateSubCatalog.map((item) => {
            const selected = dateSubCategory === item.subCategory;
            const count = dateSubCounts[item.subCategory] ?? 0;
            const chipColor = DATE_CATEGORIES.find((c) => c.id === dateCategory)?.color ?? '#ff6b8a';
            return (
              <button
                key={item.subCategory}
                type="button"
                onClick={() => setDateSubCategory(selected ? 'all' : item.subCategory)}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
                style={{
                  background: selected ? chipColor : 'white',
                  color: selected ? 'white' : chipColor,
                  border: `1.5px solid ${chipColor}55`,
                }}
              >
                {item.emoji} {item.subCategory} <span style={{ opacity: 0.75 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
