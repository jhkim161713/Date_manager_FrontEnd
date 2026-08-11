import { TABS } from './data/tabsData';
import { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import dmLogo from '@/imports/Logo.png';
import { getMe, getToken, setToken, clearToken, getMockUser, clearMockUser, adminCheck } from '@/lib/api';
import { HomeTab } from './tabs/HomeTab';
import { CoupleTab } from './tabs/CoupleTab';
import { TendencyTab } from './tabs/TendencyTab';
import { MiniCalendar } from './components/MiniCalendar';
import { BuilderTab } from './tabs/BuilderTab';
import { CuriationTab } from './tabs/CurationTab';
import { CalendarTab } from './tabs/CalendarTab';
import { MyPageTab } from './tabs/MyPageTab';
import { OnboardingTab } from './tabs/Onboardingtab';
import { PERSONA_AXES } from './data/onboardingData';
import { LoginModal } from './components/LoginModal';
import { GenderPromptModal } from './components/GenderPromptModal';

// 모바일 하단 네비게이션용 핵심 탭 (사이드바 전체 대신 자주 쓰는 것만 추림)
const MOBILE_NAV_TABS = [
  { id: 'home', label: '홈', emoji: '🏠' },
  { id: 'couple', label: '커플싱크', emoji: '💞' },
  { id: 'curiation', label: '큐레이션', emoji: '🎬' },
  { id: 'calendar', label: '캘린더', emoji: '📅' },
  { id: 'mypage', label: 'MY', emoji: '👤' },
];

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [personaProfile, setPersonaProfile] = useState(null);
  const personaScrollerRef = useRef(null);
  const personaDragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [isPersonaDragging, setIsPersonaDragging] = useState(false);
  const [personaScrollState, setPersonaScrollState] = useState({ left: false, right: false });

  // 탭을 변경할 때 브라우저 history 상태도 함께 push
  const changeTab = (newTab, pushHistory = true) => {
    if (newTab === tab) return;
    setTab(newTab);
    if (pushHistory) {
      window.history.pushState({ tab: newTab }, '', `#${newTab}`);
    }
  };

  // 브라우저 뒤로가기/앞으로가기(popstate) 감지
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setTab(event.state.tab);
      } else {
        setTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 초기 진입 시 현재 탭 상태를 history에 등록
    if (!window.history.state) {
      window.history.replaceState({ tab: 'home' }, '', '#home');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const loadUser = useCallback(() => {
    const mockUser = getMockUser();
    if (mockUser) {
      setUser(mockUser);
      return Promise.resolve(mockUser);
    }
    if (!getToken()) {
      setUser(null);
      return Promise.resolve(null);
    }
    return getMe()
      .then(data => { setUser(data); return data; })
      .catch(() => { clearToken(); setUser(null); return null; });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthError = params.get('error');

    (async () => {
      if (oauthToken) {
        setToken(oauthToken);
        window.history.replaceState({}, '', window.location.pathname);
        // 소셜 로그인으로 들어온 계정이 관리자 계정이면 메인 앱 대신 관리자 페이지로 이동
        const { isAdmin } = await adminCheck().catch(() => ({ isAdmin: false }));
        if (isAdmin) {
          window.location.href = '/admin';
          return;
        }
      }
      if (oauthError) {
        setAuthError(oauthError);
        setShowLogin(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
      await loadUser();
      setAuthChecked(true);
    })();
  }, [loadUser]);

  const handleLogout = () => {
    clearToken();
    clearMockUser();
    setUser(null);
  };

  const displayName = user?.nickname || user?.email || '';

  const updatePersonaScrollState = useCallback(() => {
    const scroller = personaScrollerRef.current;
    if (!scroller) return;

    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    setPersonaScrollState({
      left: scroller.scrollLeft > 2,
      right: scroller.scrollLeft < maxScrollLeft - 2,
    });
  }, []);

  useEffect(() => {
    const scroller = personaScrollerRef.current;
    if (!scroller) return undefined;

    const handleScroll = () => updatePersonaScrollState();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updatePersonaScrollState)
      : null;

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver?.observe(scroller);
    updatePersonaScrollState();

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
    };
  }, [updatePersonaScrollState]);

  const scrollPersonaAxes = (direction) => {
    const scroller = personaScrollerRef.current;
    if (!scroller) return;

    const distance = Math.max(170, Math.round(scroller.clientWidth * 0.62));
    scroller.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  const handlePersonaPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const scroller = personaScrollerRef.current;
    if (!scroller) return;

    personaDragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture?.(event.pointerId);
    setIsPersonaDragging(true);
  };

  const handlePersonaPointerMove = (event) => {
    const drag = personaDragRef.current;
    const scroller = personaScrollerRef.current;
    if (!drag.active || !scroller) return;

    scroller.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX);
  };

  const stopPersonaDrag = (event) => {
    if (!personaDragRef.current.active) return;

    personaDragRef.current.active = false;
    const scroller = personaScrollerRef.current;
    if (scroller?.hasPointerCapture?.(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    setIsPersonaDragging(false);
    updatePersonaScrollState();
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Sidebar (데스크톱 전용, 모바일에서는 하단 네비로 대체) ── */}
      <aside className="hidden md:flex flex-col h-screen flex-shrink-0 overflow-y-auto" style={{ width: '210px', background: 'white', borderRight: '1.5px solid #ffd6e0' }}>
        {/* Logo (클릭 시 홈으로 이동) */}
        <div 
          onClick={() => changeTab('home')}
          className="flex flex-col items-center px-4 pt-5 pb-3 cursor-pointer transition-transform hover:scale-105" 
          style={{ borderBottom: '1.5px solid #ffd6e0' }}
          title="홈으로 이동"
        >
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
            <button key={t.id} onClick={() => {
              if (t.id !== 'home' && t.id !== 'onboarding' && !user) {
                alert('로그인 후 이용 가능합니다! 🌸');
                setShowLogin(true);
                return;
              }
              changeTab(t.id);
            }}
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
        <header className="app-topbar">

          {/* ── 6대 성향 게이지 (PERSONA_AXES 동적 바인딩) ── */}
          <div className="app-persona-row">
            <button
              type="button"
              onClick={() => changeTab('onboarding')}
              className="app-persona-label rounded-full px-2 py-1 text-[10px] font-bold transition-all hover:scale-105"
              style={{ background: '#fff0f3', color: '#ff6b8a', border: 'none', cursor: 'pointer' }}
              title="성향 테스트 다시 하기"
            >
              💡 성향
            </button>

            <div className="app-persona-slider">
              <button
                type="button"
                className="app-persona-arrow"
                onClick={() => scrollPersonaAxes(-1)}
                disabled={!personaScrollState.left}
                aria-label="이전 성향 보기"
              >
                ‹
              </button>

              <div
                ref={personaScrollerRef}
                className={`app-persona-track ${isPersonaDragging ? 'is-dragging' : ''}`}
                onPointerDown={handlePersonaPointerDown}
                onPointerMove={handlePersonaPointerMove}
                onPointerUp={stopPersonaDrag}
                onPointerCancel={stopPersonaDrag}
                onDragStart={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') scrollPersonaAxes(-1);
                  if (event.key === 'ArrowRight') scrollPersonaAxes(1);
                }}
                tabIndex={0}
                aria-label="6대 성향 게이지. 좌우로 드래그하거나 화살표 키로 이동할 수 있습니다."
              >
                {PERSONA_AXES.map(({ id, koreanLabel, lowLabel, highLabel, color }) => {
                  const score = personaProfile?.scores?.[id] ?? 50;

                  return (
                    <div
                      key={id}
                      className="app-persona-axis flex flex-col gap-0.5 rounded-xl px-2.5 py-1.5"
                      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[9px] font-bold" style={{ color }}>{koreanLabel}</span>
                        <span className="text-[9px] font-bold text-stone-400">{score}</span>
                      </div>
                      <div className="relative h-1.5 rounded-full" style={{ background: `${color}20` }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all"
                          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
                        />
                        <div
                          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                          style={{ left: `calc(${score}% - 5px)`, background: color }}
                        />
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="truncate text-[8px] text-stone-400">{lowLabel}</span>
                        <span className="truncate text-right text-[8px] text-stone-400">{highLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="app-persona-arrow"
                onClick={() => scrollPersonaAxes(1)}
                disabled={!personaScrollState.right}
                aria-label="다음 성향 보기"
              >
                ›
              </button>
            </div>
          </div>

          {/* ── Login / Profile ── */}
          <div className="app-profile-actions">
            {!authChecked ? null : user ? (
              <>
                <button onClick={() => changeTab('mypage')}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
                  ⚙️ <span className="app-profile-secondary-label">마이페이지</span>
                </button>
                <div className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5"
                  style={{ background: '#fff0f3', border: '1.5px solid #ffd6e0' }}>
                  <span className="text-sm">🌷</span>
                  <span className="app-profile-name text-sm font-bold" style={{ color: '#3d2c35' }}>{displayName}</span>
                  <span className="text-xs text-stone-400">님</span>
                </div>
                <button onClick={handleLogout}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{ border: '1.5px solid #ffd6e0', color: '#bbb', background: 'white' }}>
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 rounded-2xl px-4 py-1.5 text-xs font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 14px rgba(255,107,138,0.3)' }}>
                <span>💕</span><span>로그인</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 md:px-8 py-4 md:py-7 pb-24 md:pb-16">
            {tab !== 'home' && tab !== 'onboarding' && !user ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-3">🔒</span>
                <h2 className="font-bold text-xl text-[#3d2c35]">로그인이 필요한 서비스입니다</h2>
                <p className="text-sm text-stone-400 mt-1 mb-6">로그인하고 모든 기능을 이용해 보세요!</p>
                <button onClick={() => setShowLogin(true)}
                  className="rounded-2xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 14px rgba(255,107,138,0.3)' }}>
                  로그인하기
                </button>
              </div>
            ) : (
              <>
                {tab === 'home' && <HomeTab onTabChange={changeTab} personaProfile={personaProfile} />}
                {tab === 'couple' && <CoupleTab user={user} />}
                {tab === 'curiation' && <CuriationTab />}
                {tab === 'builder' && <BuilderTab />}
                {tab === 'calendar' && <CalendarTab />}
                {tab === 'onboarding' && (
                  <OnboardingTab
                    embedded
                    onComplete={(profile) => {
                      setPersonaProfile(profile);
                      changeTab('home');
                    }}
                    onSkip={() => changeTab('home')}
                  />
                )}
                {tab === 'tendency' && <TendencyTab />}
                {tab === 'mypage' && <MyPageTab onUpdated={loadUser} />}
              </>
            )}
          </div>
        </main>

        {/* ── 모바일 하단 네비게이션 (데스크톱에서는 숨김) ── */}
        <nav className="flex md:hidden flex-shrink-0 items-center justify-around px-1 pt-1.5 pb-1"
          style={{ background: 'white', borderTop: '1.5px solid #ffd6e0' }}>
          {MOBILE_NAV_TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => {
                if (t.id !== 'home' && !user) {
                  alert('로그인 후 이용 가능합니다! 🌸');
                  setShowLogin(true);
                  return;
                }
                changeTab(t.id);
              }}
                className="flex flex-col items-center gap-0.5 py-1 transition-all"
                style={{ minWidth: '56px' }}>
                <span className="text-lg" style={{ opacity: active ? 1 : 0.55 }}>{t.emoji}</span>
                <span className="text-[10px] font-bold" style={{ color: active ? '#ff6b8a' : '#bbb' }}>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => { setShowLogin(false); setAuthError(null); }}
          onAuthed={loadUser}
          initialError={authError}
        />
      )}

      {/* 소셜 로그인으로 막 가입해서 성별이 아직 없는 경우, 커플 매칭을 위해 먼저 고르게 함 */}
      {authChecked && user && user.gender === 'UNKNOWN' && !getMockUser() && (
        <GenderPromptModal onDone={(updated) => setUser(updated)} />
      )}
    </div>
  );
}
