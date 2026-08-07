import { useState } from 'react';
import { TENDENCY_TYPES, ALL_CARDS} from '../data/dummyData';
import { QUICK_TABS } from '../data/tabsData';
import { Badge } from '../components/Badge';
import { PERSONA_AXES, getPersonaImage } from '../data/onboardingData';

export function HomeTab({ onTabChange, personaProfile }) {
  const [coupleType] = useState('romantic');
  const matched = TENDENCY_TYPES.find(t => t.id === coupleType);

  const filtered = ALL_CARDS;

  // 6대 성향 점수(없으면 기본값 50 = 중립)를 기준으로 축마다 high/low 사진을 고릅니다.
  const personaCards = PERSONA_AXES.map((axis) => {
    const score = personaProfile?.scores?.[axis.id] ?? 50;
    const isHigh = score >= 50;
    return {
      ...axis,
      score,
      isHigh,
      image: getPersonaImage(axis.id, score),
      resultLabel: isHigh ? axis.highLabel : axis.lowLabel,
    };
  });

  // weather mock
  const weather = { icon: '⛅', temp: '27°C', desc: '맑고 산책하기 좋은 날' };

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ━━━ ① 히어로 배너 ━━━ */}
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
        <div className="relative z-10 px-6 py-5 flex flex-col justify-between h-full">
          <div>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-2"
              style={{ background: 'rgba(255,255,255,0.22)', color: 'white' }}>
              💕 우리 커플 맞춤 큐레이션
            </span>
            <h2 className="font-display font-bold text-white leading-tight" style={{ fontSize: '1.6rem' }}>
              오늘 어떤 데이트 어때요?
            </h2>
            {matched && (
              <p className="text-white/75 text-xs mt-1">
                {matched.emoji} {matched.label} 커플을 위한 {filtered.length}개 코스 준비됐어요
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => onTabChange('builder')}
              className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'white', color: '#ff6b8a', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
              🧭 AI 코스 추천
            </button>
            <button onClick={() => onTabChange('tendency')}
              className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
              💡 성향 재테스트
            </button>
          </div>
        </div>
      </div>

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

      {/* ━━━ ③ 우리 성향 — 2열 3행 그리드 (6대 축 high/low 사진) ━━━ */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg" style={{ color: '#3d2c35' }}>💡 우리 성향</h2>
            <span className="text-xs font-bold rounded-full px-2.5 py-0.5" style={{ background: '#fff0f3', color: '#ff6b8a' }}>
              {personaCards.length}개 축
            </span>
          </div>
          <button onClick={() => onTabChange('onboarding')} className="text-xs text-stone-400 hover:text-[#ff6b8a]">
            테스트 다시하기
          </button>
        </div>

        {/* 2열 3행 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          {personaCards.map((axis) => (
            <div key={axis.id} className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform bg-white"
              style={{ border: '1.5px solid #ffd6e0', boxShadow: '0 2px 8px rgba(255,107,138,0.06)' }}>
              <div className="relative overflow-hidden bg-pink-100" style={{ height: '110px' }}>
                <img src={axis.image} alt={`${axis.koreanLabel} ${axis.resultLabel}`} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}>
                  ♥ {axis.score}점
                </div>
              </div>
              <div className="p-2.5">
                <Badge color={axis.color} bg={`${axis.color}15`}>{axis.label}</Badge>
                <p className="font-bold text-sm mt-1.5 leading-snug" style={{ color: '#3d2c35' }}>{axis.koreanLabel} · {axis.resultLabel}</p>
                <p className="text-[10px] text-stone-400 mt-0.5 truncate">{axis.lowLabel} ↔ {axis.highLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}