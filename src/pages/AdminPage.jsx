import { useEffect, useState } from 'react';
import { adminCheck, clearMockUser, clearToken, getMockUser } from '@/lib/api';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUserDirectory } from '@/pages/admin/AdminUserDirectory';
import { AdminCoupleDirectory } from '@/pages/admin/AdminCoupleDirectory';
import { AdminSubscriptionDirectory } from '@/pages/admin/AdminSubscriptionDirectory';
import { AdminNoticeBoard } from '@/pages/admin/AdminNoticeBoard';

const NAV_ITEMS = [
  { id: 'dashboard', label: '대시보드', emoji: '📊' },
  { id: 'users', label: '회원 관리', emoji: '👤' },
  { id: 'couples', label: '커플 관리', emoji: '💑' },
  { id: 'subscriptions', label: '구독 관리', emoji: '💳' },
  { id: 'notices', label: '공지사항', emoji: '📢' },
];

const PAGE_TITLE = {
  dashboard: '대시보드', users: '회원 디렉토리', couples: '커플 디렉토리',
  subscriptions: '구독 관리', notices: '공지사항',
};

// 로그인 모달/회원가입과 별개의 독립 페이지(/admin). 관리자 계정(ADMIN_EMAIL)으로 로그인한 경우에만
// 사이드바로 대시보드/회원/커플 관리 화면을 오갈 수 있다. role 체계 없이 백엔드에서 이메일 하나만
// 비교하는 방식이라 프론트에서도 별도 권한 분기 없이 API 응답(403/성공)에 따라 화면만 다르게 보여준다.
export function AdminPage() {
  const [status, setStatus] = useState('checking'); // checking | denied | ready
  const [error, setError] = useState(null);
  const [nav, setNav] = useState('dashboard');

  useEffect(() => {
    if (getMockUser()) {
      setStatus('denied');
      setError('테스트 계정은 관리자 페이지를 사용할 수 없어요');
      return;
    }
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
    clearMockUser();
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
      {/* Sidebar */}
      <aside className="flex-shrink-0 flex flex-col" style={{ width: '210px', background: 'white', borderRight: '1.5px solid #ffd6e0' }}>
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

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display font-bold text-2xl" style={{ color: '#3d2c35' }}>{PAGE_TITLE[nav]}</h1>
            <div className="flex items-center gap-2">
              {/* 메인 앱 쪽에 "관리자 페이지" 버튼을 띄워야 하니, 쿼리 파라미터로 관리자임을 표시해서 이동한다. */}
              <a href="/?admin=1"
                className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-80"
                style={{ border: '1.5px solid #ffd6e0', color: '#a89aa0' }}>
                <span>🏠</span>
                <span>홈</span>
              </a>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all hover:opacity-80"
                style={{ border: '1.5px solid #ffd6e0', color: '#a89aa0' }}>
                <span>🚪</span>
                <span>로그아웃</span>
              </button>
            </div>
          </div>
          {nav === 'dashboard' && <AdminDashboard />}
          {nav === 'users' && <AdminUserDirectory />}
          {nav === 'couples' && <AdminCoupleDirectory />}
          {nav === 'subscriptions' && <AdminSubscriptionDirectory />}
          {nav === 'notices' && <AdminNoticeBoard />}
        </div>
      </div>
    </div>
  );
}
