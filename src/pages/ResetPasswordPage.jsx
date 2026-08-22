import { useState } from 'react';
import { resetPassword } from '@/lib/api';

// 메일 속 재설정 링크(/reset-password?token=...)로 들어오는 독립 페이지.
// 로그인 모달과 별개로 동작해야 해서(로그인 안 한 상태에서 접근) AdminPage.jsx와 같은
// 방식으로 main.jsx에서 경로를 보고 바로 이 컴포넌트를 렌더링한다.
export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('유효하지 않은 링크예요. 메일에서 다시 눌러주세요');
      return;
    }
    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('비밀번호가 일치하지 않아요');
      return;
    }
    setSaving(true);
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>
      <div className="rounded-3xl p-7 max-w-xs w-full" style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>🔑</div>
        <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>비밀번호 재설정</h2>

        {!token ? (
          <p className="text-sm text-center mt-4" style={{ color: '#e8486b' }}>
            유효하지 않은 링크예요. 로그인 화면의 "비밀번호를 잊으셨나요?"에서 다시 요청해주세요.
          </p>
        ) : done ? (
          <>
            <p className="text-sm text-center text-stone-400 mt-4 mb-5">비밀번호가 변경됐어요. 새 비밀번호로 로그인해주세요 💕</p>
            <a href="/"
              className="block text-center w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
              로그인하러 가기
            </a>
          </>
        ) : (
          <>
            <p className="text-xs text-center text-stone-400 mb-5">새로 사용할 비밀번호를 입력해주세요</p>
            <form className="space-y-2.5" onSubmit={handleSubmit}>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                <span className="text-sm">🔑</span>
                <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="새 비밀번호"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password" style={{ color: '#3d2c35' }} />
              </div>
              <div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  <span className="text-sm">🔑</span>
                  <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="새 비밀번호 확인"
                    value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)}
                    autoComplete="new-password" style={{ color: '#3d2c35' }} />
                </div>
                {newPasswordConfirm && (
                  <p className="text-[11px] mt-1 px-1" style={{ color: newPassword === newPasswordConfirm ? '#4dbfa8' : '#e8486b' }}>
                    {newPassword === newPasswordConfirm ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                  </p>
                )}
              </div>
              <button type="submit" disabled={saving}
                className="mt-1 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
                {saving ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </form>
            {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
