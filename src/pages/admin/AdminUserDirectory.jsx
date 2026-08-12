import { useEffect, useState } from 'react';
import { adminDeleteUser, adminListUsers, adminUpdateUser } from '@/lib/api';
import { GENDER_LABEL, GENDER_OPTIONS, SubscribedBadge, FilterTabButton, formatDate } from '@/components/admin/AdminShared';

// 회원 디렉토리 탭 (일반회원/구독회원). 백엔드 /api/admin/users가 페이지네이션+검색+필터를
// 전부 서버에서 처리하므로, 이 컴포넌트는 그 파라미터들(page/search/filter)만 상태로 들고
// 바뀔 때마다 다시 fetch하는 방식으로 동작한다. userPage는 1부터 시작 - 서버가
// spring.data.web.pageable.one-indexed-parameters=true로 설정돼 있어서 page=1이 첫 페이지다.
export function AdminUserDirectory() {
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('free'); // 'free' | 'subscribed'
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalElements, setUserTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editNickname, setEditNickname] = useState('');
  const [editGender, setEditGender] = useState('UNKNOWN');
  const [savingUser, setSavingUser] = useState(false);

  const loadUsers = async (page, search, filter) => {
    setUsersLoading(true);
    try {
      const data = await adminListUsers({ page, search, filter });
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
    loadUsers(1, '', 'free');
  }, []);

  const switchUserFilter = (filter) => {
    setUserFilter(filter);
    setSearchInput('');
    setSearchQuery('');
    loadUsers(1, '', filter);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    loadUsers(1, searchInput, userFilter);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    loadUsers(1, '', userFilter);
  };

  const goToPage = (page) => {
    if (page < 1 || page > userTotalPages) return;
    loadUsers(page, searchQuery, userFilter);
  };

  const startEditUser = (u) => {
    setActionError(null);
    setEditingUserId(u.id);
    setEditNickname(u.nickname);
    setEditGender(u.gender);
  };

  const cancelEditUser = () => setEditingUserId(null);

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
      // 로컬 배열을 직접 patch하지 않고 현재 페이지를 다시 불러온다 - 필터가 바뀔 여지가
      // 없는 편집이라 지금은 큰 의미 없어 보이지만, 총 인원수(userTotalElements) 등
      // 서버 계산값과 어긋나지 않게 항상 서버 응답을 신뢰하는 편이 안전하다.
      await loadUsers(userPage, searchQuery, userFilter);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSavingUser(false);
    }
  };

  const withdrawUser = async (u) => {
    setActionError(null);
    if (!window.confirm(`${u.nickname}(${u.email}) 회원을 탈퇴 처리할까요?\n탈퇴 후 1년이 지나면 기록이 자동으로 완전히 삭제돼요.`)) return;
    try {
      // 백엔드에서는 실제로 지우지 않고 users.withdrawn_at만 채우는 soft-delete로 처리된다
      // (1년 지나면 서버 배치가 실제 삭제함). 여기 이름이 "탈퇴 처리"인 이유도 그래서다.
      await adminDeleteUser(u.id);
      // 지금 페이지의 마지막 1명을 탈퇴시킨 경우, 그대로 두면 빈 페이지가 보이므로
      // 자연스럽게 이전 페이지로 이동시킨다 (2페이지 이상 있을 때만 해당).
      const nextPage = users.length === 1 && userPage > 1 ? userPage - 1 : userPage;
      await loadUsers(nextPage, searchQuery, userFilter);
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

      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold" style={{ color: '#3d2c35' }}>회원 목록 (총 {userTotalElements}명)</h2>
          <div className="flex gap-1">
            <FilterTabButton active={userFilter === 'free'} onClick={() => switchUserFilter('free')}>일반회원</FilterTabButton>
            <FilterTabButton active={userFilter === 'subscribed'} onClick={() => switchUserFilter('subscribed')}>구독회원</FilterTabButton>
          </div>
        </div>
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
                    <td className="py-2 pr-3">{u.nickname}<SubscribedBadge subscribed={u.subscribed} /></td>
                    <td className="py-2 pr-3">{GENDER_LABEL[u.gender] ?? u.gender}</td>
                    <td className="py-2 pr-3">{formatDate(u.createdAt)}</td>
                    <td className="py-2 pr-3 flex gap-1">
                      <button onClick={() => startEditUser(u)}
                        className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>편집</button>
                      <button onClick={() => withdrawUser(u)}
                        className="rounded-lg px-2 py-1 font-bold" style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>탈퇴 처리</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!usersLoading && users.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-stone-400">
                {searchQuery ? `"${searchQuery}" 검색 결과가 없어요` : '해당하는 회원이 없어요'}
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
  );
}
