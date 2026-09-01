import { STAY_CATEGORIES, STAY_HERO } from '../../data/stayData';
import { IS_ANDROID_APP } from '../../lib/platform';

export function StayCategoryHero({ visible, stayCategory, setStayCategory, staySubCounts, stayCount }) {
  return (
    <section
      className="relative w-full flex-none overflow-hidden rounded-[28px] px-5 py-6 md:px-7"
      style={{
        background: STAY_HERO.gradient,
        border: '1.5px solid #e3ddef',
        boxShadow: '0 10px 28px rgba(75, 65, 112, 0.08)',
      }}
      aria-hidden={!visible}
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
          {/* text-wrap:balance(2026-09-01, 안드로이드 앱 전용) - DateCategoryHero와 같은 이유. */}
          <h3 className={`font-display mt-3 font-bold ${IS_ANDROID_APP ? 'text-xl' : 'text-2xl'} md:text-2xl`}
            style={{ color: '#403747', ...(IS_ANDROID_APP ? { textWrap: 'balance' } : {}) }}>
            {STAY_HERO.title}
          </h3>
          <p className="mt-1.5 max-w-xl text-xs leading-5" style={{ color: '#83788a' }}>
            {STAY_HERO.description}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 px-4 py-3 text-right shadow-sm">
          <p className="text-[10px] font-bold" style={{ color: '#9b8ca5' }}>추천 숙소</p>
          <strong className="mt-0.5 block text-xl" style={{ color: STAY_HERO.accent }}>
            {stayCount}곳
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
                  <strong className="text-xs" style={{ color: selected ? item.color : '#4d434f', ...(IS_ANDROID_APP ? { textWrap: 'balance' } : {}) }}>{item.label}</strong>
                  <small className={`text-[9px] font-bold ${IS_ANDROID_APP ? 'shrink-0' : ''}`} style={{ color: '#aa9eb0' }}>{count}곳</small>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
