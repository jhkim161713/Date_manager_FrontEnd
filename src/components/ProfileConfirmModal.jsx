import { useState } from 'react';
import { updateMe } from '@/lib/api';

// 소셜 로그인으로 처음 가입하면 닉네임은 provider가 준 값 그대로, 성별은 무조건 'UNKNOWN'으로 들어온다.
// 닉네임은 이상한 값일 수 있어 수정 기회를 주고, 성별은 커플 매칭에 꼭 필요해서 반드시 고르게 한다.
// 닫기 버튼이 없는 blocking 모달 - 둘 다 확정할 때까지 앱을 쓸 수 없음.
// "선택 안 함"은 일부러 넣지 않는다 - 매칭 로직이 성별 기반으로 이미 분기하고 있어서 미확정을 허용하면 안 됨.
export function ProfileConfirmModal({ user, onDone }) {
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [gender, setGender] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setError(null);
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }
    if (!gender) {
      setError('성별을 선택해주세요');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMe({ nickname: nickname.trim(), gender });
      onDone(updated);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-3xl p-7 w-full max-w-xs relative"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>💑</div>

        <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>프로필을 확인해주세요</h2>
        <p className="text-xs text-center text-stone-400 mb-5 leading-relaxed">
          닉네임은 자유롭게 바꿀 수 있고,<br />성별은 커플 매칭을 위해 꼭 필요해요
        </p>

        <div className="mb-4">
          <label className="text-xs font-bold text-stone-400 mb-1.5 block px-1">닉네임</label>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🌸</span>
            <input className="flex-1 text-sm outline-none bg-transparent" value={nickname}
              onChange={e => setNickname(e.target.value)}
              style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
          </div>
        </div>

        <div className="mb-2">
          <label className="text-xs font-bold text-stone-400 mb-1.5 block px-1">성별</label>
          <div className="flex gap-2.5">
            <button onClick={() => setGender('MALE')} disabled={saving}
              className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{
                border: '1.5px solid #ffd6e0',
                background: gender === 'MALE' ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'white',
                color: gender === 'MALE' ? 'white' : '#3d2c35',
              }}>
              <div className="text-2xl mb-1">🙋‍♂️</div>남성
            </button>
            <button onClick={() => setGender('FEMALE')} disabled={saving}
              className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{
                border: '1.5px solid #ffd6e0',
                background: gender === 'FEMALE' ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'white',
                color: gender === 'FEMALE' ? 'white' : '#3d2c35',
              }}>
              <div className="text-2xl mb-1">🙋‍♀️</div>여성
            </button>
          </div>
        </div>

        <button onClick={handleConfirm} disabled={saving}
          className="mt-3 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
          {saving ? '저장 중...' : '확인 💖'}
        </button>

        {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}
      </div>
    </div>
  );
}
