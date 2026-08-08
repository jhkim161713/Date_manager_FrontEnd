import { useState } from 'react';
import { TENDENCY_TYPES, ALL_CARDS} from '../data/dummyData';
import { QUICK_TABS } from '../data/tabsData';
import { Badge } from '../components/Badge';
import { PERSONA_AXES, getPersonaImage } from '../data/onboardingData';
import { useWeather } from '../hooks/useWeather';

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

  const { weather } = useWeather();

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

{/* ━━━ ③ 우리 성향 — 4열 3행 그리드 (이미지 극대화, 전체 높이 확장) ━━━ */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 pr-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base" style={{ color: '#3d2c35' }}>💡 우리 성향 분석</h2>
            <span className="text-xs font-bold rounded-full px-2.5 py-0.5" style={{ background: '#fff0f3', color: '#ff6b8a' }}>
              {personaCards.length}개 축
            </span>
          </div>
          <button onClick={() => onTabChange('onboarding')} className="text-xs text-stone-400 hover:text-[#ff6b8a] font-medium">
            테스트 다시하기
          </button>
        </div>

        {/* 4열 3행 그리드 구조 */}
        <div className="grid grid-cols-4 gap-3.5">
          {personaCards.map((axis) => (
            <div key={axis.id} className="rounded-3xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform bg-white flex flex-col shadow-sm"
              style={{ border: '1.5px solid #ffd6e0', minHeight: '230px' }}> {/* 전체 카드 높이 대폭 확장 */}
              
              {/* 이미지 영역 극대화 (높이 170px로 설정) */}
              <div className="relative overflow-hidden bg-pink-100 flex-shrink-0" style={{ height: '170px' }}>
                <img src={axis.image} alt={`${axis.koreanLabel} ${axis.resultLabel}`} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  ♥ {axis.score}점
                </div>
              </div>
              
              {/* 텍스트 영역은 컴팩트하게 유지하여 이미지 강조 */}
              <div className="p-3 flex flex-col justify-center flex-1 text-center">
                <div>
                  <Badge color={axis.color} bg={`${axis.color}15`}>{axis.label}</Badge>
                  <p className="font-bold text-sm mt-1.5 leading-tight" style={{ color: '#3d2c35' }}>
                    {axis.koreanLabel} · {axis.resultLabel}
                  </p>
                </div>
                {/* 설명 텍스트는 한 줄로 줄임표 처리 */}
                <p className="text-[11px] text-stone-400 mt-1 truncate">{axis.lowLabel} ↔ {axis.highLabel}</p>
              </div>
            </div>
          ))}

          {/* 바로가기 카드들도 동일한 높이(minHeight: 230px) 및 스타일 적용 */}
          <div onClick={() => onTabChange('tendency')} className="rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-pink-100/50 transition-colors text-center shadow-sm" style={{ minHeight: '230px' }}>
            <span className="text-3xl mb-3">✨</span>
            <p className="text-sm font-bold text-[#ff6b8a] leading-tight">상세 리포트</p>
            <p className="text-xs text-stone-400 mt-1.5">성향 분석 보기</p>
          </div>

          <div onClick={() => onTabChange('builder')} className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-purple-100/50 transition-colors text-center shadow-sm" style={{ minHeight: '230px' }}>
            <span className="text-3xl mb-3">🗺️</span>
            <p className="text-sm font-bold text-purple-600 leading-tight">코스 빌더</p>
            <p className="text-xs text-stone-400 mt-1.5">데이트 코스 짜기</p>
          </div>

          <div onClick={() => onTabChange('calendar')} className="rounded-3xl border-2 border-dashed border-sky-200 bg-sky-50/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-sky-100/50 transition-colors text-center shadow-sm" style={{ minHeight: '230px' }}>
            <span className="text-3xl mb-3">📅</span>
            <p className="text-sm font-bold text-sky-600 leading-tight">데이트 캘린더</p>
            <p className="text-xs text-stone-400 mt-1.5">일정 관리</p>
          </div>

          <div onClick={() => onTabChange('mypage')} className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-amber-100/50 transition-colors text-center shadow-sm" style={{ minHeight: '230px' }}>
            <span className="text-3xl mb-3">👤</span>
            <p className="text-sm font-bold text-amber-600 leading-tight">마이페이지</p>
            <p className="text-xs text-stone-400 mt-1.5">내 정보 설정</p>
          </div>

          <div onClick={() => onTabChange('couple')} className="rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-rose-100/50 transition-colors text-center shadow-sm" style={{ minHeight: '230px' }}>
            <span className="text-3xl mb-3">👩‍❤️‍👨</span>
            <p className="text-sm font-bold text-rose-600 leading-tight">커플 싱크</p>
            <p className="text-xs text-stone-400 mt-1.5">싱크로율 확인</p>
          </div>

          <div onClick={() => onTabChange('curation')} className="rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-emerald-100/50 transition-colors text-center shadow-sm" style={{ minHeight: '230px' }}>
            <span className="text-3xl mb-3">🍽️</span>
            <p className="text-sm font-bold text-emerald-600 leading-tight">큐레이션</p>
            <p className="text-xs text-stone-400 mt-1.5">맞춤 장소 추천</p>
          </div>
        </div>
      </div>
    </div>
  );
}