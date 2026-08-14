import { useEffect, useState } from 'react';
import { adminDeleteCouple, adminListCouples, adminUpdateCouple } from '@/lib/api';
import { FilterTabButton, formatDate } from '@/components/admin/AdminShared';

// 커플 디렉토리 탭. 커플 수가 아직 적어서(회원과 달리) 서버 페이지네이션 없이 필터된
// 전체 목록을 한 번에 받아온다. "구독회원" 필터는 두 멤버 중 한 명이라도 활성 구독이
// 있으면 그 커플을 포함시키는 식으로 백엔드에서 판단한다(AdminController.matchesCoupleFilter).
export function AdminCoupleDirectory() {
  const [couples, setCouples] = useState([]);
  const [coupleFilter, setCoupleFilter] = useState('free'); // 'free' | 'subscribed'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'all' - 해제된 예전 커플 포함 여부
  const [couplesLoading, setCouplesLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadCouples = async (filter, status) => {
    setCouplesLoading(true);
    try {
      const data = await adminListCouples({ filter, status });
      setCouples(data);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setCouplesLoading(false);
    }
  };

  useEffect(() => {
    loadCouples('free', 'active');
  }, []);

  const switchCoupleFilter = (filter) => {
    setCoupleFilter(filter);
    loadCouples(filter, statusFilter);
  };

  const switchStatusFilter = (status) => {
    setStatusFilter(status);
    loadCouples(coupleFilter, status);
  };

  // 커플 상태만 ACTIVE<->DISCONNECTED로 토글한다. 실제 row나 멤버 연결은 그대로 남아있고
  // 상태 문자열만 바뀐다 - 완전히 지우고 싶으면 아래 deleteCouple을 따로 써야 한다.
  const toggleCoupleStatus = async (c) => {
    setActionError(null);
    const nextStatus = c.status === 'ACTIVE' ? 'DISCONNECTED' : 'ACTIVE';
    try {
      await adminUpdateCouple(c.id, { status: nextStatus });
      await loadCouples(coupleFilter, statusFilter);
    } catch (e) {
      setActionError(e.message);
    }
  };

  // 커플은 목록 규모가 작아서(위 loadCouples처럼) 페이지네이션이 없으므로,
  // 삭제 후에는 다시 fetch하지 않고 로컬 배열에서 바로 제거해도 안전하다.
  const deleteCouple = async (c) => {
    setActionError(null);
    if (!window.confirm(`커플 #${c.id} 매칭을 삭제할까요? 되돌릴 수 없어요.`)) return;
    try {
      await adminDeleteCouple(c.id);
      setCouples(list => list.filter(x => x.id !== c.id));
    } catch (e) {
      setActionError(e.message);
    }
  };

  return (
    <section className="rounded-3xl p-6"
      style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
      {actionError && (
        <div className="rounded-2xl px-4 py-3 text-xs font-bold mb-3"
          style={{ background: '#fff0f3', color: '#e8486b', border: '1.5px solid #ffd6e0' }}>
          {actionError}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-sm font-bold" style={{ color: '#3d2c35' }}>커플 매칭 목록 ({couples.length}쌍)</h2>
        <div className="flex gap-1">
          <FilterTabButton active={coupleFilter === 'free'} onClick={() => switchCoupleFilter('free')}>일반회원</FilterTabButton>
          <FilterTabButton active={coupleFilter === 'subscribed'} onClick={() => switchCoupleFilter('subscribed')}>구독회원</FilterTabButton>
        </div>
        {/* 연결 상태 필터 - 기본은 활성 커플만, "전체"를 눌러야 해제된 예전 커플까지 보인다
            (예전엔 필터가 없어서 해제된 커플까지 다 섞여 나와 관리자 통계가 부풀려졌었음) */}
        <div className="flex gap-1">
          <FilterTabButton active={statusFilter === 'active'} onClick={() => switchStatusFilter('active')}>연결됨만</FilterTabButton>
          <FilterTabButton active={statusFilter === 'all'} onClick={() => switchStatusFilter('all')}>전체(해제 포함)</FilterTabButton>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-stone-400 border-b" style={{ borderColor: '#ffd6e0' }}>
              <th className="py-2 pr-3">커플 ID</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">연결일</th>
              <th className="py-2 pr-3">멤버</th>
              <th className="py-2 pr-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {couples.map(c => (
              <tr key={c.id} className="border-b" style={{ borderColor: '#fff0f3', color: '#3d2c35' }}>
                <td className="py-2 pr-3">{c.id}</td>
                <td className="py-2 pr-3">{c.status}</td>
                <td className="py-2 pr-3">{formatDate(c.connectedAt)}</td>
                <td className="py-2 pr-3">
                  {c.members.map(m => `${m.nickname}(${m.email})${m.subscribed ? ' 💳' : ''}`).join(', ') || '-'}
                </td>
                <td className="py-2 pr-3 flex gap-1">
                  <button onClick={() => toggleCoupleStatus(c)}
                    className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>
                    {c.status === 'ACTIVE' ? '연결 해제' : '다시 연결'}
                  </button>
                  <button onClick={() => deleteCouple(c)}
                    className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>삭제</button>
                </td>
              </tr>
            ))}
            {!couplesLoading && couples.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-stone-400">해당하는 커플이 없어요</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
