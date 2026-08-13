import { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';

// ⚠️ 이 파일은 "게시판 탭이 일단 있어야 한다"는 요청으로 형식상 만든 화면입니다.
// 백엔드 API가 아직 없어서 로컬 state(목업)만으로 동작하고, 새로고침하면 사라져요.
// 이 프론트엔드는 팀원이 실제로 새로 작업할 예정이니, 아래 내용은 참고만 하시고
// 전부 지우고 새로 짜셔도 됩니다.
const MOCK_POSTS = [
  { id: 1, title: '첫 데이트 코스 추천해주세요', author: '코딩조아', createdAt: '2026-08-12', content: '이번 주말에 첫 데이트인데 코스 추천 부탁드려요!' },
  { id: 2, title: '성향 테스트 재밌네요', author: '데이트매니저', createdAt: '2026-08-11', content: '성향 테스트 해봤는데 결과가 신기했어요.' },
];

export function BoardTab() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [selected, setSelected] = useState(null);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      author: '나',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setPosts((prev) => [newPost, ...prev]);
    setTitle('');
    setContent('');
    setWriting(false);
  };

  if (selected) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setSelected(null)} className="text-xs font-bold mb-3" style={{ color: '#a08b94' }}>
          ← 목록으로
        </button>
        <div className="rounded-3xl p-6 bg-white" style={{ border: '1.5px solid #ffd6e0' }}>
          <h2 className="font-display font-bold text-lg" style={{ color: '#3d2c35' }}>{selected.title}</h2>
          <p className="text-xs mt-1" style={{ color: '#a08b94' }}>{selected.author} · {selected.createdAt}</p>
          <p className="text-sm mt-4 leading-relaxed whitespace-pre-wrap" style={{ color: '#3d2c35' }}>{selected.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <SectionTitle sub="자유롭게 이야기를 나눠보세요 (임시 화면, 백엔드 연동 전)">게시판 📋</SectionTitle>

      <button onClick={() => setWriting((w) => !w)}
        className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white mb-4 transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 12px rgba(255,107,138,0.25)' }}>
        {writing ? '취소' : '✏️ 글쓰기'}
      </button>

      {writing && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #ffd6e0' }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={4}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #ffd6e0' }} />
          <button type="submit" className="rounded-xl px-4 py-2 text-xs font-bold text-white"
            style={{ background: '#ff6b8a' }}>
            등록
          </button>
        </form>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} onClick={() => setSelected(post)}
            className="rounded-2xl px-4 py-3 bg-white cursor-pointer hover:scale-[1.01] transition-transform"
            style={{ border: '1.5px solid #ffd6e0' }}>
            <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>{post.title}</p>
            <p className="text-xs mt-1" style={{ color: '#a08b94' }}>{post.author} · {post.createdAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
