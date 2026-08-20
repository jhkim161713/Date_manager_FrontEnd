import { useEffect, useState } from 'react';
import {
  adminCreateSubscription, adminDeleteSubscription, adminListSubscriptions, adminUpdateSubscription,
} from '@/lib/api';
import { FilterTabButton, formatDate } from '@/components/admin/AdminShared';

// 백엔드 AdminSubscriptionController가 검증하는 값과 반드시 일치해야 한다 (문자열 그대로 비교함).
const STATUS_OPTIONS = ['ACTIVE', 'CANCELED', 'EXPIRED'];
// 플랜 코드는 백엔드가 강제하지 않는 자유 문자열이라, 여기 목록은 그냥 UI 편의용 프리셋이다.
const PLAN_OPTIONS = ['FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY'];

const STATUS_COLOR = { ACTIVE: '#4dbfa8', CANCELED: '#e8486b', EXPIRED: '#a89aa0' };

function StatusBadge({ status }) {
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: `${STATUS_COLOR[status] ?? '#a89aa0'}20`, color: STATUS_COLOR[status] ?? '#a89aa0' }}>
      {status}
    </span>
  );
}

// 구독 관리 탭. 아직 회원이 직접 구독을 신청하는 결제 플로우가 없어서, "+ 구독 추가"로
// 관리자가 회원 이메일을 입력해 수동으로 구독을 만들어주는 용도로 쓴다(테스트/임시 부여용).
export function AdminSubscriptionDirectory() {
  const [subs, setSubs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ACTIVE' | 'CANCELED' | 'EXPIRED'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editPlan, setEditPlan] = useState('FREE');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('FREE');
  const [creating, setCreating] = useState(false);

  const load = async (p, search, status) => {
    setLoading(true);
    try {
      const data = await adminListSubscriptions({ page: p, search, status });
      setSubs(data.content);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements ?? data.content.length);
      setPage(p);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, '', 'all');
  }, []);

  const switchFilter = (status) => {
    setStatusFilter(status);
    setSearchInput('');
    setSearchQuery('');
    load(1, '', status);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    load(1, searchInput, statusFilter);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    load(1, '', statusFilter);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    load(p, searchQuery, statusFilter);
  };

  const startEdit = (s) => {
    setActionError(null);
    setEditingId(s.id);
    setEditStatus(s.status);
    setEditPlan(s.planCode);
    setEditExpiresAt(s.expiresAt ? s.expiresAt.slice(0, 10) : '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    setActionError(null);
    setSaving(true);
    try {
      await adminUpdateSubscription(id, {
        status: editStatus,
        planCode: editPlan,
        // <input type="date">는 "YYYY-MM-DD"만 주므로, 백엔드가 기대하는
        // LocalDateTime 파싱 형식(ISO-8601)에 맞춰 자정 시각을 붙여서 보낸다.
        expiresAt: editExpiresAt ? `${editExpiresAt}T00:00:00` : null,
      });
      setEditingId(null);
      await load(page, searchQuery, statusFilter);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeSubscription = async (s) => {
    setActionError(null);
    if (!window.confirm(`${s.userNickname}(${s.userEmail})의 구독을 삭제할까요?`)) return;
    try {
      await adminDeleteSubscription(s.id);
      const nextPage = subs.length === 1 && page > 1 ? page - 1 : page;
      await load(nextPage, searchQuery, statusFilter);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setActionError(null);
    if (!newEmail.trim()) {
      setActionError('회원 이메일을 입력해주세요');
      return;
    }
    setCreating(true);
    try {
      await adminCreateSubscription({ userEmail: newEmail.trim(), planCode: newPlan });
      setNewEmail('');
      setShowCreate(false);
      await load(1, searchQuery, statusFilter);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setCreating(false);
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

      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold" style={{ color: '#3d2c35' }}>구독 목록 (총 {totalElements}건)</h2>
          <div className="flex gap-1">
            <FilterTabButton active={statusFilter === 'all'} onClick={() => switchFilter('all')}>전체</FilterTabButton>
            {STATUS_OPTIONS.map(s => (
              <FilterTabButton key={s} active={statusFilter === s} onClick={() => switchFilter(s)}>{s}</FilterTabButton>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <form onSubmit={submitSearch} className="flex items-center gap-1.5">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="회원 이메일 또는 닉네임 검색"
              className="text-xs px-3 py-1.5 rounded-xl w-48" style={{ border: '1.5px solid #ffd6e0' }} />
            <button type="submit"
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>검색</button>
            {searchQuery && (
              <button type="button" onClick={clearSearch}
                className="rounded-xl px-3 py-1.5 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>
                초기화
              </button>
            )}
          </form>
          <button onClick={() => setShowCreate(v => !v)}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap"
            style={{ background: '#3d2c35' }}>+ 구독 추가</button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={submitCreate} className="flex items-center gap-1.5 mb-3 rounded-2xl p-3"
          style={{ background: '#fff8f4', border: '1.5px solid #ffd6e0' }}>
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="회원 이메일" className="text-xs px-3 py-1.5 rounded-xl flex-1" style={{ border: '1.5px solid #ffd6e0' }} />
          <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-xl" style={{ border: '1.5px solid #ffd6e0' }}>
            {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="submit" disabled={creating}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>
            {creating ? '추가 중...' : '추가'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-stone-400 border-b" style={{ borderColor: '#ffd6e0' }}>
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">회원</th>
              <th className="py-2 pr-3">플랜</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">시작일</th>
              <th className="py-2 pr-3">만료일</th>
              <th className="py-2 pr-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} className="border-b" style={{ borderColor: '#fff0f3', color: '#3d2c35' }}>
                <td className="py-2 pr-3">{s.id}</td>
                <td className="py-2 pr-3">{s.userNickname}<br /><span className="text-stone-400">{s.userEmail}</span></td>
                {editingId === s.id ? (
                  <>
                    <td className="py-2 pr-3">
                      <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg" style={{ border: '1.5px solid #ffd6e0' }}>
                        {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg" style={{ border: '1.5px solid #ffd6e0' }}>
                        {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3">{formatDate(s.startedAt)}</td>
                    <td className="py-2 pr-3">
                      <input type="date" value={editExpiresAt} onChange={e => setEditExpiresAt(e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg" style={{ border: '1.5px solid #ffd6e0' }} />
                    </td>
                    <td className="py-2 pr-3 flex gap-1">
                      <button onClick={() => saveEdit(s.id)} disabled={saving}
                        className="rounded-lg px-2 py-1 font-bold text-white" style={{ background: '#ff6b8a' }}>저장</button>
                      <button onClick={cancelEdit}
                        className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0' }}>취소</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-3">{s.planCode}</td>
                    <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                    <td className="py-2 pr-3">{formatDate(s.startedAt)}</td>
                    <td className="py-2 pr-3">{formatDate(s.expiresAt)}</td>
                    <td className="py-2 pr-3 flex gap-1">
                      <button onClick={() => startEdit(s)}
                        className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>편집</button>
                      <button onClick={() => removeSubscription(s)}
                        className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>삭제</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!loading && subs.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-stone-400">
                {searchQuery ? `"${searchQuery}" 검색 결과가 없어요` : '구독 내역이 없어요'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading}
          className="rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40"
          style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>이전</button>
        <span className="text-xs text-stone-400">{page} / {totalPages} 페이지</span>
        <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading}
          className="rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40"
          style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>다음</button>
      </div>
    </section>
  );
}
