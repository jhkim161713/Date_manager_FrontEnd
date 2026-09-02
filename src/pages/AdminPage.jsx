import { useEffect, useState } from 'react';
import { adminCheck, clearToken } from '@/lib/api';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUserDirectory } from '@/pages/admin/AdminUserDirectory';
import { AdminCoupleDirectory } from '@/pages/admin/AdminCoupleDirectory';
import { AdminSubscriptionDirectory } from '@/pages/admin/AdminSubscriptionDirectory';
import { AdminNoticeBoard } from '@/pages/admin/AdminNoticeBoard';
import { AdminReportDirectory } from '@/pages/admin/AdminReportDirectory';

const NAV_ITEMS = [
  { id: 'dashboard', label: '대시보드', emoji: '📊' },
  { id: 'users', label: '회원 관리', emoji: '👤' },
  { id: 'couples', label: '커플 관리', emoji: '💑' },
  { id: 'subscriptions', label: '구독 관리', emoji: '💳' },
  { id: 'reports', label: '신고 관리', emoji: '🚨' },
  { id: 'notices', label: '공지사항', emoji: '📢' },
];

const PAGE_TITLE = {
  dashboard: '대시보드', users: '회원 디렉토리', couples: '커플 디렉토리',
  subscriptions: '구독 관리', reports: '신고 관리', notices: '공지사항',
};

// 로그인 모달/회원가입과 별개의 독립 페이지(/admin). 관리자 계정(ADMIN_EMAIL)으로 로그인한 경우에만
// 사이드바로 대시보드/회원/커플 관리 화면을 오갈 수 있다. role 체계 없이 백엔드에서 이메일 하나만
// 비교하는 방식이라 프론트에서도 별도 권한 분기 없이 API 응답(403/성공)에 따라 화면만 다르게 보여준다.
export function AdminPage() {
  const [status, setStatus] = useState('checking'); // checking | denied | ready
  const [error, setError] = useState(null);
  const [nav, setNav] = useState('dashboard');
  // 모바일 사이드바 대응(2026-09-02) - 사이드바가 210px 고정폭이라 좁은 화면에서 본문이
  // 심하게 눌리고 "회원 디렉토리" 같은 제목이 한 글자씩 세로로 줄바꿈됐다. 데스크톱 사이드바는
  // md 이상에서만 보이고, 그 아래에서는 상단 바 + 햄버거 드로어로 대체한다.
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { isAdmin } = await adminCheck();
        if (!isAdmin) {
          setStatus('denied');
          setError('관리자 권한이 없어요');
          return;
        }
        setStatus('ready');
      } catch (e) {
        setStatus('denied');
        setError(e.message || '로그인이 필요해요');
      }
    })();
  }, []);

  // 뒤로가기로는 로그아웃되지 않고, 이 버튼을 눌러야만 실제로 로그아웃된다(토큰 삭제 후 메인으로 이동).
  // href 대신 replace를 쓰는 이유: href로 남겨두면 뒤로가기를 눌렀을 때 로그아웃 전(관리자
  // 화면이 정상 표시되던) '/admin' 스냅샷이 bfcache로 되살아나, 실제로는 토큰이 지워졌는데도
  // 화면만 로그인된 것처럼 보이는 반대 방향의 혼동이 생길 수 있다.
  const handleLogout = () => {
    clearToken();
    window.location.replace('/');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff8f4' }}>
        <p className="text-sm text-stone-400">불러오는 중...</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>
        <div className="rounded-3xl p-6 text-center max-w-xs w-full"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <p className="text-sm" style={{ color: '#e8486b' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>
      {/* Sidebar (데스크톱 전용, 좁은 화면에서는 하단의 모바일 상단바+드로어로 대체) */}
      <aside className="hidden md:flex flex-shrink-0 flex-col" style={{ width: '210px', background: 'white', borderRight: '1.5px solid #ffd6e0' }}>
        <div className="flex items-center gap-2 px-5 pt-6 pb-5">
          <span className="text-xl">💕</span>
          <span className="font-display font-bold text-sm" style={{ color: '#3d2c35' }}>DM 관리자</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setNav(item.id)}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-left transition-all"
              style={{
                background: nav === item.id ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'transparent',
                color: nav === item.id ? 'white' : '#3d2c35',
              }}>
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 모바일 전용 상단바(2026-09-02) - 로고 + 햄버거 버튼. md 이상에서는 데스크톱 사이드바가
          이미 있으니 숨긴다. */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'white', borderBottom: '1.5px solid #ffd6e0' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">💕</span>
          <span className="font-display font-bold text-sm" style={{ color: '#3d2c35' }}>DM 관리자</span>
        </div>
        <button type="button" onClick={() => setShowMobileNav(true)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ color: '#3d2c35', border: '1.5px solid #f0dce2' }}>
          <span>☰</span><span>메뉴</span>
        </button>
      </div>

      {/* 모바일 메뉴 드로어 - 메인 앱(App.jsx)의 "☰ 메뉴" 드로어와 같은 패턴 */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowMobileNav(false)}>
          <div onClick={(event) => event.stopPropagation()}
            className="h-full flex flex-col overflow-y-auto"
            style={{ width: '210px', background: 'white', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between px-4 pt-5 pb-3" style={{ borderBottom: '1.5px solid #ffd6e0' }}>
              <span className="font-display font-bold text-sm" style={{ color: '#3d2c35' }}>DM 관리자</span>
              <button type="button" onClick={() => setShowMobileNav(false)} className="text-lg leading-none" style={{ color: '#b9a7ae' }}>✕</button>
            </div>
            <nav className="flex flex-col gap-1 px-3 py-3">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => { setNav(item.id); setShowMobileNav(false); }}
                  className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-left transition-all"
                  style={{
                    background: nav === item.id ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'transparent',
                    color: nav === item.id ? 'white' : '#3d2c35',
                  }}>
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 p-4 pt-20 md:p-8 md:pt-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-3">
            <h1 className="font-display font-bold text-xl md:text-2xl break-keep" style={{ color: '#3d2c35' }}>{PAGE_TITLE[nav]}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 메인 앱 쪽에 "관리자 페이지" 버튼을 띄워야 하니, 쿼리 파라미터로 관리자임을 표시해서 이동한다. */}
              <a href="/?admin=1"
                className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-80"
                style={{ border: '1.5px solid #ffd6e0', color: '#a89aa0' }}>
                <span>🏠</span>
                <span className="hidden sm:inline">홈</span>
              </a>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-80"
                style={{ border: '1.5px solid #ffd6e0', color: '#a89aa0' }}>
                <span>🚪</span>
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
          {nav === 'dashboard' && <AdminDashboard />}
          {nav === 'users' && <AdminUserDirectory />}
          {nav === 'couples' && <AdminCoupleDirectory />}
          {nav === 'subscriptions' && <AdminSubscriptionDirectory />}
          {nav === 'reports' && <AdminReportDirectory />}
          {nav === 'notices' && <AdminNoticeBoard />}
        </div>
      </div>
    </div>
  );
}
