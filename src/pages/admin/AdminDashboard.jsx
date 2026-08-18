import { useEffect, useState } from 'react';
import { adminDashboard, adminListNotices } from '@/lib/api';
import { TrendLineChart } from '@/components/admin/TrendLineChart';
import { GenderRatioDonut } from '@/components/admin/GenderRatioDonut';
import { formatDate } from '@/components/admin/AdminShared';

function StatCard({ label, value, emoji }) {
  return (
    <div className="rounded-3xl p-5 flex-1 min-w-[140px]"
      style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold" style={{ color: '#3d2c35' }}>{value}</div>
      <div className="text-xs text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}

// 대시보드 홈. 통계/추이/성별비율은 백엔드가 한 번에 계산해서 주는 /api/admin/dashboard
// 하나로 다 그리고, 공지사항 미리보기만 /api/admin/notices를 size=5로 따로 불러온다
// (공지 목록은 별도 탭에서 페이지네이션째로 다시 관리하므로 여기선 최신 것만 훑어보는 용도).
export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStats(await adminDashboard());
      } catch (e) {
        setError(e.message);
      }
    };
    const loadNotices = async () => {
      try {
        const data = await adminListNotices({ page: 1, size: 5 });
        setNotices(data.content);
      } catch {
        // 미리보기용 목록이라 실패해도 조용히 무시(기존 동작 유지)
      }
    };
    loadStats();
    loadNotices();
  }, []);

  if (error) {
    return <p className="text-sm text-center py-10" style={{ color: '#e8486b' }}>{error}</p>;
  }
  if (!stats) {
    return <p className="text-sm text-stone-400 text-center py-10">불러오는 중...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <StatCard label="총 회원수" value={stats.totalUsers} emoji="👤" />
        <StatCard label="구독 회원수" value={stats.totalSubscribers} emoji="💳" />
        <StatCard label="매칭된 커플" value={stats.totalCouples} emoji="💑" />
        <StatCard label="오늘 방문자" value={stats.todayVisitors} emoji="📈" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-3xl p-6"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#3d2c35' }}>최근 7일 방문자 추이</h2>
          <TrendLineChart data={stats.visitorTrend} color="#ff6b8a" />
        </section>

        <section className="rounded-3xl p-6"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#3d2c35' }}>최근 7일 구독 증가 추이</h2>
          <TrendLineChart data={stats.subscriptionTrend} color="#c4a0e8" />
        </section>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-3xl p-6"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#3d2c35' }}>회원 남녀 비율</h2>
          <GenderRatioDonut male={stats.genderBreakdown.male} female={stats.genderBreakdown.female}
            unknown={stats.genderBreakdown.unknown} />
        </section>

        <section className="rounded-3xl p-6"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#3d2c35' }}>최근 공지사항</h2>
          <div className="space-y-2.5">
            {notices.map(n => (
              <div key={n.id} className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-bold truncate" style={{ color: '#3d2c35' }}>{n.title}</span>
                <span className="text-[10px] text-stone-400 flex-shrink-0">{formatDate(n.createdAt)}</span>
              </div>
            ))}
            {notices.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-4">등록된 공지가 없어요</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
