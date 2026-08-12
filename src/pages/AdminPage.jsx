import { useEffect, useState } from 'react';
import { adminCheck, getMockUser } from '@/lib/api';
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
        <nav className="flex flex-col gap-1 px-3">
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
          <h1 className="font-display font-bold text-2xl mb-6" style={{ color: '#3d2c35' }}>{PAGE_TITLE[nav]}</h1>
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
