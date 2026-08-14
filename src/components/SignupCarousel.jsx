import { useEffect, useRef, useState } from 'react';
import dmLogo from '../imports/Logo.png';

const SLIDES = [
  { logo: true, title: '성향 검사', desc: '성향 검사를 통해 나에게 맞는 문화생활을 알려드려요' },
  { emoji: '💞', title: '내 파트너 링크', desc: '파트너와 링크로 연결하고, 만난 날짜와 성향 궁합을 확인해요' },
  { emoji: '🎬', title: '데이트 큐레이션', desc: '내 성향에 맞는 데이트 장소와 공연을 골라봐요' },
  { emoji: '🛣️', title: '코스 빌더', desc: '마음에 드는 장소들을 이어서 우리만의 데이트 코스를 만들어요' },
  { emoji: '📅', title: '데이트 캘린더', desc: '우리의 데이트 약속과 기념일을 함께 관리해요' },
  { emoji: '🤖', title: 'AI 데이트 상담', desc: 'AI에게 데이트 코스를 물어보고 추천받아요' },
  { emoji: '📋', title: '게시판', desc: '다른 커플들과 이야기를 나눠요' },
];

const AUTO_ROTATE_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

// 회원가입 페이지 우측에 들어가는 기능 소개 캐러셀. 자동 순환 + 좌우 화살표/스와이프로 수동 전환 가능.
export function SignupCarousel() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % SLIDES.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const go = (delta) => {
    setIndex(i => (i + delta + SLIDES.length) % SLIDES.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      go(delta > 0 ? -1 : 1);
    }
    touchStartX.current = null;
  };

  const slide = SLIDES[index];

  return (
    <div className="h-full min-h-[420px] flex flex-col items-center justify-center relative px-8 py-10 text-white"
      style={{ background: 'linear-gradient(135deg, #ff6b8a 0%, #c98fd4 60%, #c4a0e8 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>

      <button onClick={() => go(-1)} aria-label="이전"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.18)' }}>‹</button>
      <button onClick={() => go(1)} aria-label="다음"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.18)' }}>›</button>

      <div key={index} className="flex flex-col items-center text-center gap-3 animate-signup-fade">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.22)' }}>
          {slide.logo ? <img src={dmLogo} alt="DM 로고" className="h-10 w-10 object-contain" /> : slide.emoji}
        </div>
        <h3 className="font-display font-bold text-xl">{slide.title}</h3>
        <p className="text-sm text-white/85 max-w-[220px]">{slide.desc}</p>
      </div>

      <div className="flex gap-1.5 mt-8">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`${i + 1}번 슬라이드`}
            className="rounded-full transition-all"
            style={{ width: i === index ? '18px' : '6px', height: '6px', background: i === index ? 'white' : 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>

      <style>{`
        @keyframes signup-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-signup-fade { animation: signup-fade 0.35s ease; }
      `}</style>
    </div>
  );
}
