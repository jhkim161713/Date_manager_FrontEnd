// 담기함 요약 + 목록(2026-08-20) - "목록보기"를 눌러야 펼쳐지고, 항목마다 ✕로 잘못 담은
// 장소를 바로 뺄 수 있다.
export function BuilderCartPanel({ builderItems, showCart, setShowCart, removeFromCart, sendToBuilder }) {
  if (builderItems.length === 0) return null;

  return (
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
  );
}
