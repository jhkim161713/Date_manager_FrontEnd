import { TABS } from './data/tabsData';
import { useState } from 'react';
import dmLogo from '@/imports/22211.png';
import { HomeTab } from './tabs/HomeTab';
import { CoupleTab } from './tabs/CoupleTab';
import { TendencyTab } from './tabs/TendencyTab';
import { MiniCalendar } from './components/MiniCalendar';
import { BuilderTab } from './tabs/BuilderTab';
import { CuriationTab } from './tabs/CurationTab';   
import { CalendarTab } from './tabs/CalendarTab';  
import { LoginModal } from './components/LoginModal';

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('home')
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col h-screen flex-shrink-0 overflow-y-auto" style={{ width: '210px', background: 'white', borderRight: '1.5px solid #ffd6e0' }}>
        {/* Logo */}
        <div className="flex flex-col items-center px-4 pt-5 pb-3" style={{ borderBottom: '1.5px solid #ffd6e0' }}>
          <img src={dmLogo} alt="DM Date Manager 로고" className="w-32 h-32 object-contain" />
          <p className="text-xs text-stone-400 mt-0.5" style={{ fontStyle: 'italic' }}>Date Manager for us</p>
        </div>

        {/* Mini Calendar */}
        <MiniCalendar />

        {/* Divider */}
        <div className="mx-3 mb-2" style={{ borderTop: '1.5px solid #ffd6e0' }} />

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-left transition-all hover:scale-[1.02]"
              style={{
                background: tab === t.id ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'transparent',
                color: tab === t.id ? 'white' : '#3d2c35',
                boxShadow: tab === t.id ? '0 4px 12px rgba(255,107,138,0.25)' : undefined,
              }}>
              <span className="text-base">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <p className="text-center text-xs pb-4 pt-2" style={{ color: '#e8b4c0' }}>made with 💖</p>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center gap-4 px-6 py-2.5"
          style={{ background: 'rgba(255,248,244,0.97)', borderBottom: '1.5px solid #ffd6e0', backdropFilter: 'blur(8px)' }}>

          {/* ── 6대 성향 게이지 ── */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold flex-shrink-0 rounded-full px-2 py-1"
              style={{ background: '#fff0f3', color: '#ff6b8a' }}>💡 성향</span>
            <div className="flex gap-1.5 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {[
                { label: '에너지',   lo: '프라이빗',  hi: '활력',    score: 38, color: '#ff6b8a' },
                { label: '몰입',     lo: '능동체험',  hi: '관람',    score: 72, color: '#c4a0e8' },
                { label: '분위기',   lo: '아날로그',  hi: '핫플',    score: 55, color: '#f9a030' },
                { label: '미감',     lo: '스토리',    hi: '비주얼',  score: 80, color: '#4dbfa8' },
                { label: '페이스',   lo: '즉흥',      hi: '계획',    score: 62, color: '#60a860' },
                { label: '취향깊이', lo: '이지',      hi: '딥다이브', score: 45, color: '#e8486b' },
              ].map(({ label, lo, hi, score, color }) => (
                <div key={label} className="flex-shrink-0 flex flex-col gap-0.5 rounded-xl px-2.5 py-1.5 min-w-[88px]"
                  style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
                    <span className="text-[9px] font-bold text-stone-400">{score}</span>
                  </div>
                  {/* Track */}
                  <div className="relative h-1.5 rounded-full" style={{ background: `${color}20` }}>
                    <div className="absolute left-0 top-0 h-full rounded-full transition-all"
                      style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                    {/* Thumb */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
                      style={{ left: `calc(${score}% - 5px)`, background: color }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] text-stone-400">{lo}</span>
                    <span className="text-[8px] text-stone-400">{hi}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Login / Profile ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                {/* 로그인 상태: 마이페이지 버튼 + 유저 정보 및 로그아웃 */}
                <button onClick={() => setTab('tendency')}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
                  ⚙️ 마이페이지
                </button>
                <div className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5"
                  style={{ background: '#fff0f3', border: '1.5px solid #ffd6e0' }}>
                  <span className="text-sm">🌷</span>
                  <span className="text-sm font-bold" style={{ color: '#3d2c35' }}>{user}</span>
                  <span className="text-xs text-stone-400">님</span>
                </div>
                <button onClick={() => setUser(null)}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{ border: '1.5px solid #ffd6e0', color: '#bbb', background: 'white' }}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {/* 비로그인 상태: 회원가입 버튼 + 로그인 버튼 */}
                <button onClick={() => {
                  alert('회원가입 페이지/모달로 이동합니다.');
                }}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                  style={{ border: '1.5px solid #ffd6e0', color: '#ff6b8a', background: 'white' }}>
                  ✨ 회원가입
                </button>
                <button onClick={() => setShowLogin(true)}
                  className="flex items-center gap-1.5 rounded-2xl px-4 py-1.5 text-xs font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 14px rgba(255,107,138,0.3)' }}>
                  <span>💕</span><span>로그인</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-8 py-7 pb-16">
            {tab === 'home' && <HomeTab onTabChange={setTab} />}
            {tab === 'couple' && <CoupleTab />}
            {tab === 'curiation' && <CuriationTab />}
            {tab === 'builder' && <BuilderTab />}
            {tab === 'calendar' && <CalendarTab />}
            {tab === 'tendency' && <TendencyTab />}
          </div>
        </main>
      </div>

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={setUser} />}
    </div>
  )
}