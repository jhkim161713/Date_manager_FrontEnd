// 데이트/숙박 두 목록이 색상만 다르고 완전히 같은 페이지네이션 UI를 각자 갖고 있던 걸
// 하나로 합쳤다(2026-08-24). activeBg/activeColor로 탭별 색상만 넘기면 된다.
export function Pager({ page, totalPages, onPrev, onNext, activeBg, activeColor, textColor }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 1}
        className="rounded-full px-3 py-1.5 text-xs font-extrabold transition-all disabled:opacity-30"
        style={{ background: activeBg, color: activeColor }}
      >
        ‹ 이전
      </button>
      <span className="text-xs font-bold" style={{ color: textColor }}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page === totalPages}
        className="rounded-full px-3 py-1.5 text-xs font-extrabold transition-all disabled:opacity-30"
        style={{ background: activeBg, color: activeColor }}
      >
        다음 ›
      </button>
    </div>
  );
}
