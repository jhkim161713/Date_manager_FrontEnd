import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Avatar } from '../components/Avatar';
import { getMe, updateMe, changePassword, uploadProfilePhoto, getMockUser, setMockUser } from '@/lib/api';

// 커플 매칭 로직이 성별 기반으로 분기하기 때문에 여기서도 "선택 안 함"은 빼고 남성/여성만 고르게 한다
// (LoginModal 회원가입 폼, ProfileConfirmModal과 동일한 정책 - 마이페이지에서 되돌릴 수 있으면 의미 없음).
const GENDER_OPTIONS = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
];

export function MyPageTab({ onUpdated }) {
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwNotice, setPwNotice] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const mockUser = getMockUser();

  useEffect(() => {
    if (mockUser) {
      // 백엔드 없이 로그인한 테스트 계정 -> 서버 호출 없이 로컬 값만 사용
      setProfile(mockUser);
      setNickname(mockUser.nickname ?? '');
      setGender(mockUser.gender ?? 'UNKNOWN');
      setLoading(false);
      return;
    }
    getMe()
      .then(data => {
        setProfile(data);
        setNickname(data.nickname ?? '');
        setGender(data.gender ?? 'UNKNOWN');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError(null);
    setNotice(null);
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      if (mockUser) {
        const updated = { ...mockUser, nickname, gender };
        setMockUser(updated);
        setProfile(updated);
        setNotice('저장했어요 💾 (테스트 계정이라 이 브라우저에만 저장돼요)');
        onUpdated?.();
        return;
      }
      const updated = await updateMe({ nickname, gender });
      setProfile(updated);
      setNotice('저장했어요 💾');
      onUpdated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 다시 선택해도 onChange가 또 발생하도록 초기화
    if (!file) return;
    setPhotoError(null);
    if (mockUser) {
      setPhotoError('테스트 계정은 프로필 사진을 바꿀 수 없어요');
      return;
    }
    setPhotoUploading(true);
    try {
      const updated = await uploadProfilePhoto(file);
      setProfile(updated);
      onUpdated?.();
    } catch (e) {
      setPhotoError(e.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePasswordSave = async () => {
    setPwError(null);
    setPwNotice(null);
    if (mockUser) {
      setPwError('테스트 계정은 비밀번호를 변경할 수 없어요');
      return;
    }
    if (!newPassword.trim()) {
      setPwError('새 비밀번호를 입력해주세요');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwNotice('비밀번호를 변경했어요 🔑');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-md md:max-w-3xl">
      <SectionTitle sub="내 정보를 확인하고 수정할 수 있어요">마이페이지 ⚙️</SectionTitle>

      <div className="md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="rounded-3xl p-6"
        style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-6">불러오는 중...</p>
        ) : !profile ? (
          <p className="text-sm text-center py-6" style={{ color: '#e8486b' }}>{error}</p>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-4">
              <Avatar profileImageUrl={profile.profileImageUrl} gender={profile.gender} size={72} />
              <div>
                <label className="rounded-2xl px-3 py-2 text-xs font-bold cursor-pointer inline-block transition-all hover:opacity-90"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>
                  {photoUploading ? '업로드 중...' : '사진 변경'}
                  <input type="file" accept="image/*" className="hidden" disabled={photoUploading}
                    onChange={handlePhotoChange} />
                </label>
                {photoError && <p className="text-xs mt-1.5" style={{ color: '#e8486b' }}>{photoError}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-stone-400 mb-1.5 block">이메일</label>
              <div className="rounded-2xl px-4 py-3" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4', color: '#3d2c35' }}>
                {profile.email}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-stone-400 mb-1.5 block">닉네임</label>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                <span className="text-sm">🌷</span>
                <input className="flex-1 text-sm outline-none bg-transparent" value={nickname}
                  onChange={e => setNickname(e.target.value)} style={{ color: '#3d2c35' }} />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-stone-400 mb-1.5 block">성별</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setGender(opt.value)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      border: '1.5px solid #ffd6e0',
                      background: gender === opt.value ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'white',
                      color: gender === opt.value ? 'white' : '#3d2c35',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
              {saving ? '저장 중...' : '저장하기 💾'}
            </button>

            {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}
            {notice && <p className="text-center text-xs mt-3" style={{ color: '#4dbfa8' }}>{notice}</p>}
          </>
        )}
      </div>

      {!loading && profile && (
        <div className="rounded-3xl p-6 mt-4 md:mt-0"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <button onClick={() => setPwOpen(o => !o)}
            className="w-full flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: '#3d2c35' }}>비밀번호 변경 🔑</h3>
            <span className="text-xs text-stone-400">{pwOpen ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>

          {pwOpen && (
            <div className="mt-4">
              <div className="mb-3">
                <label className="text-xs font-bold text-stone-400 mb-1.5 block">현재 비밀번호</label>
                <div className="rounded-2xl px-4 py-3" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  <input type="password" className="w-full text-sm outline-none bg-transparent"
                    placeholder="소셜 로그인 계정은 비워두세요"
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    style={{ color: '#3d2c35' }} />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-stone-400 mb-1.5 block">새 비밀번호</label>
                <div className="rounded-2xl px-4 py-3" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  <input type="password" className="w-full text-sm outline-none bg-transparent"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={{ color: '#3d2c35' }} />
                </div>
              </div>

              <button onClick={handlePasswordSave} disabled={pwSaving}
                className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
                {pwSaving ? '변경 중...' : '비밀번호 변경하기'}
              </button>

              {pwError && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{pwError}</p>}
              {pwNotice && <p className="text-center text-xs mt-3" style={{ color: '#4dbfa8' }}>{pwNotice}</p>}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
