import { useEffect, useState } from 'react';
import {
  adminCheck, adminDeleteCouple, adminDeleteUser, adminListCouples, adminListUsers,
  adminUpdateCouple, adminUpdateUser, getMockUser,
} from '@/lib/api';

const GENDER_LABEL = { MALE: '남성', FEMALE: '여성', UNKNOWN: '선택 안 함' };
const GENDER_OPTIONS = ['UNKNOWN', 'MALE', 'FEMALE'];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

// 로그인 모달/회원가입과 별개의 독립 페이지(/admin). 관리자 계정(ADMIN_EMAIL)으로 로그인한 경우에만
// 회원 목록과 커플 매칭 목록을 조회·편집·삭제할 수 있다. role 체계 없이 백엔드에서 이메일 하나만
// 비교하는 방식이라 프론트에서도 별도 권한 분기 없이 API 응답(403/성공)에 따라 화면만 다르게 보여준다.
export function AdminPage() {
  const [status, setStatus] = useState('checking'); // checking | denied | loading-data | ready
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [couples, setCouples] = useState([]);
  const [actionError, setActionError] = useState(null);

  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalElements, setUserTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editNickname, setEditNickname] = useState('');
  const [editGender, setEditGender] = useState('UNKNOWN');
  const [savingUser, setSavingUser] = useState(false);

  const loadUsers = async (page, search) => {
    setUsersLoading(true);
    try {
      const data = await adminListUsers({ page, search });
      setUsers(data.content);
      setUserTotalPages(data.totalPages || 1);
      setUserTotalElements(data.totalElements ?? data.content.length);
      setUserPage(page);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setUsersLoading(false);
    }
  };

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
        setStatus('loading-data');
        const [userPageData, coupleList] = await Promise.all([
          adminListUsers({ page: 1, search: '' }),
          adminListCouples(),
        ]);
        setUsers(userPageData.content);
        setUserTotalPages(userPageData.totalPages || 1);
        setUserTotalElements(userPageData.totalElements ?? userPageData.content.length);
        setCouples(coupleList);
        setStatus('ready');
      } catch (e) {
        setStatus('denied');
        setError(e.message || '로그인이 필요해요');
      }
    })();
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    loadUsers(1, searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    loadUsers(1, '');
  };

  const goToPage = (page) => {
    if (page < 1 || page > userTotalPages) return;
    loadUsers(page, searchQuery);
  };

  const startEditUser = (u) => {
    setActionError(null);
    setEditingUserId(u.id);
    setEditNickname(u.nickname);
    setEditGender(u.gender);
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
  };

  const saveEditUser = async (id) => {
    setActionError(null);
    if (!editNickname.trim()) {
      setActionError('닉네임을 입력해주세요');
      return;
    }
    setSavingUser(true);
    try {
      await adminUpdateUser(id, { nickname: editNickname, gender: editGender });
      setEditingUserId(null);
      await loadUsers(userPage, searchQuery);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (u) => {
    setActionError(null);
    if (!window.confirm(`${u.nickname}(${u.email}) 회원을 삭제할까요? 되돌릴 수 없어요.`)) return;
    try {
      await adminDeleteUser(u.id);
      // 현재 페이지 마지막 회원을 지운 경우 이전 페이지로 자연스럽게 이동
      const nextPage = users.length === 1 && userPage > 1 ? userPage - 1 : userPage;
      await loadUsers(nextPage, searchQuery);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const toggleCoupleStatus = async (c) => {
    setActionError(null);
    const nextStatus = c.status === 'ACTIVE' ? 'DISCONNECTED' : 'ACTIVE';
    try {
      const updated = await adminUpdateCouple(c.id, { status: nextStatus });
      setCouples(list => list.map(x => (x.id === c.id ? updated : x)));
    } catch (e) {
      setActionError(e.message);
    }
  };

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
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#3d2c35' }}>관리자 페이지 🛠️</h1>
        <p className="text-xs text-stone-400 mb-6">회원 목록과 커플 매칭 현황을 확인·편집할 수 있어요</p>

        {(status === 'checking' || status === 'loading-data') && (
          <p className="text-sm text-stone-400 py-10 text-center">불러오는 중...</p>
        )}

        {status === 'denied' && (
          <div className="rounded-3xl p-6 text-center"
            style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
            <p className="text-sm" style={{ color: '#e8486b' }}>{error}</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-6">
            {actionError && (
              <div className="rounded-2xl px-4 py-3 text-xs font-bold"
                style={{ background: '#fff0f3', color: '#e8486b', border: '1.5px solid #ffd6e0' }}>
                {actionError}
              </div>
            )}

            <section className="rounded-3xl p-6"
              style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h2 className="text-sm font-bold" style={{ color: '#3d2c35' }}>회원 목록 (총 {userTotalElements}명)</h2>
                <form onSubmit={submitSearch} className="flex items-center gap-1.5">
                  <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    placeholder="이메일 또는 닉네임 검색"
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-stone-400 border-b" style={{ borderColor: '#ffd6e0' }}>
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">이메일</th>
                      <th className="py-2 pr-3">닉네임</th>
                      <th className="py-2 pr-3">성별</th>
                      <th className="py-2 pr-3">가입일</th>
                      <th className="py-2 pr-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b" style={{ borderColor: '#fff0f3', color: '#3d2c35' }}>
                        <td className="py-2 pr-3">{u.id}</td>
                        <td className="py-2 pr-3">{u.email}</td>
                        {editingUserId === u.id ? (
                          <>
                            <td className="py-2 pr-3">
                              <input value={editNickname} onChange={e => setEditNickname(e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg w-24" style={{ border: '1.5px solid #ffd6e0' }} />
                            </td>
                            <td className="py-2 pr-3">
                              <select value={editGender} onChange={e => setEditGender(e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg" style={{ border: '1.5px solid #ffd6e0' }}>
                                {GENDER_OPTIONS.map(g => (
                                  <option key={g} value={g}>{GENDER_LABEL[g]}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 pr-3">{formatDate(u.createdAt)}</td>
                            <td className="py-2 pr-3 flex gap-1">
                              <button onClick={() => saveEditUser(u.id)} disabled={savingUser}
                                className="rounded-lg px-2 py-1 font-bold text-white"
                                style={{ background: '#ff6b8a' }}>저장</button>
                              <button onClick={cancelEditUser}
                                className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0' }}>취소</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-3">{u.nickname}</td>
                            <td className="py-2 pr-3">{GENDER_LABEL[u.gender] ?? u.gender}</td>
                            <td className="py-2 pr-3">{formatDate(u.createdAt)}</td>
                            <td className="py-2 pr-3 flex gap-1">
                              <button onClick={() => startEditUser(u)}
                                className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>편집</button>
                              <button onClick={() => deleteUser(u)}
                                className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>삭제</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {!usersLoading && users.length === 0 && (
                      <tr><td colSpan={6} className="py-6 text-center text-stone-400">
                        {searchQuery ? `"${searchQuery}" 검색 결과가 없어요` : '회원이 없어요'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={() => goToPage(userPage - 1)} disabled={userPage <= 1 || usersLoading}
                  className="rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>이전</button>
                <span className="text-xs text-stone-400">{userPage} / {userTotalPages} 페이지</span>
                <button onClick={() => goToPage(userPage + 1)} disabled={userPage >= userTotalPages || usersLoading}
                  className="rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>다음</button>
              </div>
            </section>

            <section className="rounded-3xl p-6"
              style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: '#3d2c35' }}>커플 매칭 목록 ({couples.length}쌍)</h2>
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
                          {c.members.map(m => `${m.nickname}(${m.email})`).join(', ') || '-'}
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
                    {couples.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-stone-400">매칭된 커플이 없어요</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
