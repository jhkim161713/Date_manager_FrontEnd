import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { getMe, updateMe } from '@/lib/api';

const GENDER_OPTIONS = [
  { value: 'UNKNOWN', label: '선택 안 함' },
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

  useEffect(() => {
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

  return (
    <div className="max-w-md">
      <SectionTitle sub="내 정보를 확인하고 수정할 수 있어요">마이페이지 ⚙️</SectionTitle>

      <div className="rounded-3xl p-6"
        style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-6">불러오는 중...</p>
        ) : !profile ? (
          <p className="text-sm text-center py-6" style={{ color: '#e8486b' }}>{error}</p>
        ) : (
          <>
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
    </div>
  )
}
