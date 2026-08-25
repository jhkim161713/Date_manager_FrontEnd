import { HOME_CATEGORIES } from '../../data/curationCategories';

// 내 주변 카테고리 칩 - 고르면 nearbyPlacePool 자체가 그 카테고리로 좁혀짐(2026-08-14).
// 숙박은 6대 성향 매칭과 안 맞아서 칩 목록에서 뺐다(2026-08-18) - 숙박은 큐레이션 탭에서 확인.
export function HomeCategoryChips({ homeCategory, setHomeCategory }) {
  return (
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
  );
}
