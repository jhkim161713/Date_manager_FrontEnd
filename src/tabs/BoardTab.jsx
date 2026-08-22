import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { createReport, createBoardPost, deleteBoardPost, getBoardPost, getBoardPosts, updateBoardPost } from '@/lib/api';

// 2026-08-22 - 실제 백엔드(BoardController, /api/board)로 연동 완료. 글 목록/작성/수정/삭제
// 전부 진짜 DB에 저장되고, 새로고침해도 안 사라진다. 신고는 그 전부터 이미 실제 백엔드
// (POST /api/reports)로 연결돼 있었고, 이제 targetId도 진짜 게시글 id를 가리킨다.
function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function BoardTab({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [detailError, setDetailError] = useState(null);

  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState(null); // null | 'sending' | 'done' | 에러 메시지

  const loadPosts = () => {
    setLoading(true);
    setListError(null);
    getBoardPosts()
      // 서버가 재시작 중이거나 응답이 끊기면 request()가 빈 body를 null로 파싱해서 넘길 수 있는데,
      // 그걸 그대로 posts에 넣으면 아래 posts.length에서 렌더링 자체가 죽어버린다(탭 전체가 하얘짐) -
      // 배열이 아니면 빈 배열로 대체해서 "글 없음" 화면으로 안전하게 떨어지게 한다.
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch((err) => setListError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openPost = async (postId) => {
    setEditing(false);
    setReporting(false);
    setDetailError(null);
    try {
      const post = await getBoardPost(postId); // 상세 조회할 때마다 백엔드가 조회수를 1 올려준다
      setSelected(post);
    } catch (err) {
      setDetailError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitError(null);
    try {
      await createBoardPost({ title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      setWriting(false);
      loadPosts();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const startEdit = (post) => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      const updated = await updateBoardPost(selected.id, { title: editTitle.trim(), content: editContent.trim() });
      setSelected(updated);
      setEditing(false);
      loadPosts();
    } catch (err) {
      setDetailError(err.message);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm('이 글을 삭제할까요?')) return;
    try {
      await deleteBoardPost(post.id);
      setSelected(null);
      loadPosts();
    } catch (err) {
      setDetailError(err.message);
    }
  };

  const openReport = () => {
    setReportReason('');
    setReportStatus(null);
    setReporting(true);
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReportStatus('sending');
    try {
      await createReport({ targetType: 'POST', targetId: selected.id, reason: reportReason.trim() });
      setReportStatus('done');
    } catch (err) {
      setReportStatus(err.message || '신고 접수에 실패했어요');
    }
  };

  if (selected) {
    const isMine = user?.id != null && selected.authorId === user.id;
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setSelected(null); setEditing(false); setReporting(false); }}
          className="text-xs font-bold mb-3" style={{ color: '#a08b94' }}>
          ← 목록으로
        </button>
        <div className="rounded-3xl p-6 bg-white" style={{ border: '1.5px solid #ffd6e0' }}>
          {detailError && (
            <p className="text-xs font-bold mb-3" style={{ color: '#e8486b' }}>{detailError}</p>
          )}
          {editing ? (
            <form onSubmit={handleEditSubmit} className="space-y-2.5">
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="제목"
                className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #ffd6e0' }} />
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #ffd6e0' }} />
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl px-4 py-2 text-xs font-bold text-white" style={{ background: '#ff6b8a' }}>저장</button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-xl px-4 py-2 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>취소</button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="font-display font-bold text-lg" style={{ color: '#3d2c35' }}>{selected.title}</h2>
              <p className="text-xs mt-1" style={{ color: '#a08b94' }}>
                {selected.authorNickname} · {formatDate(selected.createdAt)} · 조회 {selected.viewCount}
              </p>
              <p className="text-sm mt-4 leading-relaxed whitespace-pre-wrap" style={{ color: '#3d2c35' }}>{selected.content}</p>

              <div className="flex gap-2 mt-5">
                {isMine ? (
                  <>
                    <button onClick={() => startEdit(selected)} className="rounded-xl px-3 py-1.5 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>수정</button>
                    <button onClick={() => handleDelete(selected)} className="rounded-xl px-3 py-1.5 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>삭제</button>
                  </>
                ) : (
                  <button onClick={openReport} className="rounded-xl px-3 py-1.5 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>🚨 신고</button>
                )}
              </div>

              {reporting && (
                <div className="mt-4 rounded-2xl p-4" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  {reportStatus === 'done' ? (
                    <p className="text-xs font-bold" style={{ color: '#3d2c35' }}>신고가 접수됐어요. 검토 후 처리됩니다.</p>
                  ) : (
                    <form onSubmit={submitReport} className="space-y-2">
                      <p className="text-xs font-bold" style={{ color: '#3d2c35' }}>신고 사유를 입력해주세요</p>
                      <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={3}
                        placeholder="어떤 부분이 문제인지 알려주세요"
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #ffd6e0' }} />
                      {reportStatus && reportStatus !== 'sending' && reportStatus !== 'done' && (
                        <p className="text-xs font-bold" style={{ color: '#e8486b' }}>{reportStatus}</p>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" disabled={reportStatus === 'sending'}
                          className="rounded-xl px-4 py-2 text-xs font-bold text-white" style={{ background: '#e8486b' }}>
                          {reportStatus === 'sending' ? '접수 중...' : '신고 제출'}
                        </button>
                        <button type="button" onClick={() => setReporting(false)} className="rounded-xl px-4 py-2 text-xs font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>취소</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <SectionTitle sub="자유롭게 이야기를 나눠보세요">📋 게시판</SectionTitle>

      <div className="flex justify-end mb-4">
        <button onClick={() => setWriting((w) => !w)}
          className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 12px rgba(255,107,138,0.25)' }}>
          {writing ? '취소' : '✏️ 글쓰기'}
        </button>
      </div>

      {writing && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #ffd6e0' }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={4}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #ffd6e0' }} />
          {submitError && <p className="text-xs font-bold" style={{ color: '#e8486b' }}>{submitError}</p>}
          <button type="submit" className="rounded-xl px-4 py-2 text-xs font-bold text-white"
            style={{ background: '#ff6b8a' }}>
            등록
          </button>
        </form>
      )}

      {loading && <p className="text-xs" style={{ color: '#a08b94' }}>불러오는 중...</p>}
      {listError && <p className="text-xs font-bold" style={{ color: '#e8486b' }}>{listError}</p>}
      {!loading && !listError && posts.length === 0 && (
        <p className="text-xs" style={{ color: '#a08b94' }}>아직 게시글이 없어요. 첫 글을 남겨보세요!</p>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} onClick={() => openPost(post.id)}
            className="rounded-2xl px-4 py-3 bg-white cursor-pointer hover:scale-[1.01] transition-transform"
            style={{ border: '1.5px solid #ffd6e0' }}>
            <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>{post.title}</p>
            <p className="text-xs mt-1" style={{ color: '#a08b94' }}>
              {post.authorNickname} · {formatDate(post.createdAt)} · 조회 {post.viewCount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
