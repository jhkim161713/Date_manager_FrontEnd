export function HeroBanner({ coupleLinked, weather, onOpenBuilder, aiRecommending, areas, selectedAreaKey, onSelectArea }) {
  return (
    <div className="rounded-3xl overflow-hidden relative flex-shrink-0" style={{ minHeight: '148px', background: 'linear-gradient(120deg, #ff6b8a 0%, #c98fd4 60%, #c4a0e8 100%)' }}>
      <img src="https://images.unsplash.com/photo-1622296571436-8d5b1c203416?w=1200&h=400&fit=crop&auto=format"
        alt="커플 데이트 배경" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25" />

      {/* Weather chip (우측 상단 날씨) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
        style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', color: 'white' }}>
        <span>{weather.icon}</span><span>{weather.temp}</span>
        <span className="opacity-70">·</span>
        <span className="opacity-80">{weather.desc}</span>
      </div>

      {/* 배너 내부 컨텐츠 (세로 정렬로 겹침 방지) */}
      <div className="relative z-10 px-4 md:px-6 py-5 flex flex-col justify-between h-full">
        <div>
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-2"
            style={{ background: 'rgba(255,255,255,0.22)', color: 'white' }}>
            {coupleLinked ? '💕 내 파트너 맞춤 큐레이션' : '🎭 문화생활 맞춤 큐레이션'}
          </span>
          <h2 className="font-display font-bold text-white leading-tight text-xl md:text-[1.6rem]">
            {coupleLinked ? '오늘은 이런 데이트 어때요?' : '이번 주엔 이런 문화생활 어때요?'}
          </h2>
          <p className="text-white/75 text-xs mt-1">
            {coupleLinked ? '💑 당신을 위한 데이트 코스를 준비했어요' : '🎨 당신을 위한 문화생활을 준비했어요'}
          </p>
        </div>

        {/* 추천 기준 동네 칩(2026-09-01) - GPS만 믿고 엉뚱한 동네 기준으로 추천되는 걸 막기 위해
            직접 기준 위치를 고를 수 있게 함. 가로 스크롤로 넘치는 칩도 다 보이게 처리. */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto">
          {areas?.map((area) => (
            <button key={area.key} onClick={() => onSelectArea(area.key)}
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all"
              style={selectedAreaKey === area.key
                ? { background: 'white', color: '#ff6b8a' }
                : { background: 'rgba(255,255,255,0.22)', color: 'white' }}>
              {area.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button onClick={onOpenBuilder} disabled={aiRecommending}
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            style={{ background: 'white', color: '#ff6b8a', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
            {aiRecommending ? '✨ AI가 코스를 고르는 중...' : '🧭 AI 코스 추천'}
          </button>
        </div>
      </div>
    </div>
  );
}
