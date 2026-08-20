import { useEffect, useState } from 'react';
import { adminCreateNotice, adminDeleteNotice, adminListNotices, adminUpdateNotice } from '@/lib/api';
import { formatDate } from '@/components/admin/AdminShared';

// 관리자 전용 공지사항 게시판. 백엔드 /api/admin/notices가 이미 관리자 인증을 요구하므로
// (AdminNoticeController), 여기선 별도 쓰기 권한 체크 없이 그대로 폼을 노출해도 안전하다 -
// 이 페이지 자체가 AdminPage의 adminCheck 통과 이후에만 렌더링되기 때문.
// showForm+editingId 조합으로 "새 글 작성"과 "기존 글 편집" 폼을 하나로 재사용한다
// (editingId가 있으면 PUT, 없으면 POST).
export function AdminNoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async (p) => {
    setLoading(true);
    try {
      const data = await adminListNotices({ page: p });
      setNotices(data.content);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setShowForm(true);
    setActionError(null);
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setShowForm(true);
    setActionError(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setActionError(null);
    if (!title.trim() || !content.trim()) {
      setActionError('제목과 내용을 모두 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateNotice(editingId, { title, content });
      } else {
        await adminCreateNotice({ title, content });
      }
      setShowForm(false);
      setEditingId(null);
      await load(1);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeNotice = async (n) => {
    setActionError(null);
    if (!window.confirm(`"${n.title}" 공지를 삭제할까요?`)) return;
    try {
      await adminDeleteNotice(n.id);
      const nextPage = notices.length === 1 && page > 1 ? page - 1 : page;
      await load(nextPage);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    load(p);
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: '#3d2c35' }}>공지사항</h2>
        {!showForm && (
          <button onClick={startCreate}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>+ 새 공지 작성</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submitForm} className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: '#fff8f4', border: '1.5px solid #ffd6e0' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목"
            className="w-full text-sm px-3 py-2 rounded-xl" style={{ border: '1.5px solid #ffd6e0' }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용" rows={4}
            className="w-full text-sm px-3 py-2 rounded-xl resize-none" style={{ border: '1.5px solid #ffd6e0' }} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="rounded-xl px-4 py-2 text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>
              {saving ? '저장 중...' : editingId ? '수정 완료' : '등록'}
            </button>
            <button type="button" onClick={cancelForm}
              className="rounded-xl px-4 py-2 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>취소</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {notices.map(n => (
          <div key={n.id} className="rounded-2xl p-4" style={{ border: '1.5px solid #ffd6e0' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#3d2c35' }}>{n.title}</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {formatDate(n.createdAt)}{n.updatedAt ? ` (수정됨 ${formatDate(n.updatedAt)})` : ''}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => startEdit(n)}
                  className="rounded-lg px-2 py-1 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>편집</button>
                <button onClick={() => removeNotice(n)}
                  className="rounded-lg px-2 py-1 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>삭제</button>
              </div>
            </div>
            <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: '#3d2c35' }}>{n.content}</p>
          </div>
        ))}
        {!loading && notices.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-6">등록된 공지가 없어요</p>
        )}
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
