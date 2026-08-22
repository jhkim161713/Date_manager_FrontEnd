import { useEffect, useState } from 'react';
import { adminListReports, adminUpdateReportStatus } from '@/lib/api';
import { FilterTabButton, formatDate, REPORT_TARGET_LABEL, REPORT_STATUS_LABEL, REPORT_STATUS_OPTIONS } from '@/components/admin/AdminShared';

// 신고 관리 탭. 백엔드가 targetType(USER/POST/COMMENT)+targetId만 내려주고 실제 게시글/댓글
// 내용까지 조인해서 주지는 않아서, 지금은 "게시글 #42" 식으로 대상만 보여준다 - 내용을 보려면
// 관리자가 targetId로 직접 게시판에서 찾아봐야 한다(추후 개선 여지).
export function AdminReportDirectory() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'all' | 'PENDING' | 'RESOLVED' | 'REJECTED'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadReports = async (p, status) => {
    setLoading(true);
    try {
      const data = await adminListReports({ page: p, status });
      setReports(data.content);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements ?? data.content.length);
      setPage(p);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 기본 필터는 PENDING - 관리자가 이 화면을 열 때 가장 먼저 봐야 할 건 처리 안 된 신고지,
  // 이미 끝난 신고 이력이 아니다(다른 디렉토리들도 다 "지금 조치가 필요한 항목"을 기본값으로 둠).
  useEffect(() => {
    loadReports(1, 'PENDING');
  }, []);

  const switchStatusFilter = (status) => {
    setStatusFilter(status);
    loadReports(1, status);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    loadReports(p, statusFilter);
  };

  // 상태를 바꾸면 현재 필터로 다시 목록을 불러온다 - 예를 들어 PENDING 필터에서 RESOLVED로
  // 바꾸면 그 항목은 더 이상 이 필터에 안 걸려야 하므로, 로컬 배열에서 상태만 patch하지 않고
  // 서버에서 다시 받아와야 화면과 실제 필터 결과가 어긋나지 않는다.
  const changeStatus = async (report, status) => {
    if (status === report.status) return;
    setActionError(null);
    setUpdatingId(report.id);
    try {
      await adminUpdateReportStatus(report.id, { status });
      await loadReports(page, statusFilter);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setUpdatingId(null);
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
        <h2 className="text-sm font-bold" style={{ color: '#3d2c35' }}>신고 목록 (총 {totalElements}건)</h2>
        <div className="flex gap-1">
          <FilterTabButton active={statusFilter === 'PENDING'} onClick={() => switchStatusFilter('PENDING')}>대기중</FilterTabButton>
          <FilterTabButton active={statusFilter === 'RESOLVED'} onClick={() => switchStatusFilter('RESOLVED')}>처리완료</FilterTabButton>
          <FilterTabButton active={statusFilter === 'REJECTED'} onClick={() => switchStatusFilter('REJECTED')}>반려</FilterTabButton>
          <FilterTabButton active={statusFilter === 'all'} onClick={() => switchStatusFilter('all')}>전체</FilterTabButton>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-stone-400 border-b" style={{ borderColor: '#ffd6e0' }}>
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">신고자</th>
              <th className="py-2 pr-3">대상</th>
              <th className="py-2 pr-3">사유</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">신고일</th>
              <th className="py-2 pr-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-b" style={{ borderColor: '#fff0f3', color: '#3d2c35' }}>
                <td className="py-2 pr-3">{r.id}</td>
                <td className="py-2 pr-3">{r.reporterNickname}</td>
                <td className="py-2 pr-3">{REPORT_TARGET_LABEL[r.targetType] ?? r.targetType} #{r.targetId}</td>
                <td className="py-2 pr-3 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                <td className="py-2 pr-3">{REPORT_STATUS_LABEL[r.status] ?? r.status}</td>
                <td className="py-2 pr-3">{formatDate(r.createdAt)}</td>
                <td className="py-2 pr-3">
                  <select value={r.status} disabled={updatingId === r.id}
                    onChange={e => changeStatus(r, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg" style={{ border: '1.5px solid #ffd6e0' }}>
                    {REPORT_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{REPORT_STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-stone-400">해당하는 신고가 없어요</td></tr>
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
