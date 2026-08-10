import { useState } from 'react';
import { updateMe } from '@/lib/api';

// 소셜 로그인으로 새로 가입하면 성별이 'UNKNOWN'으로 들어오는데(구글/카카오/네이버가 성별을
// 안 주기 때문), 커플 매칭 기능이 성별을 필요로 하므로 로그인 직후 반드시 성별을 고르게 한다.
// 닫기 버튼이 없는 blocking 모달 - 고를 때까지 앱을 쓸 수 없음.
export function GenderPromptModal({ onDone }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handlePick = async (gender) => {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateMe({ gender });
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

        <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>성별을 알려주세요</h2>
        <p className="text-xs text-center text-stone-400 mb-6 leading-relaxed">
          커플 매칭을 위해 꼭 필요해요.<br />마이페이지에서 나중에 다시 바꿀 수 있어요
        </p>

        <div className="flex gap-2.5">
          <button onClick={() => handlePick('MALE')} disabled={saving}
            className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ border: '1.5px solid #ffd6e0', background: 'white', color: '#3d2c35' }}>
            <div className="text-2xl mb-1">🙋‍♂️</div>남성
          </button>
          <button onClick={() => handlePick('FEMALE')} disabled={saving}
            className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ border: '1.5px solid #ffd6e0', background: 'white', color: '#3d2c35' }}>
            <div className="text-2xl mb-1">🙋‍♀️</div>여성
          </button>
        </div>

        {error && <p className="text-center text-xs mt-4" style={{ color: '#e8486b' }}>{error}</p>}
      </div>
    </div>
  );
}
