import { useEffect, useState } from 'react';
import { googleLoginUrl, kakaoLoginUrl, naverLoginUrl, login, tryMockLogin } from '@/lib/api';

// 로그인 전용 모달. 회원가입은 별도 페이지(/signup)에서 처리한다.
export function LoginModal({ onClose, onAuthed, initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(initialError ?? null);

  // 소셜로그인 페이지로 이동했다가 로그인하지 않고 뒤로가기를 누르면
  // bfcache로 인해 loading 상태가 "이동 중..."에 멈춰있는 채로 복원되므로 초기화해준다
  useEffect(() => {
    const resetLoadingOnRestore = (event) => {
      if (event.persisted) {
        setLoading(null);
      }
    };
    window.addEventListener('pageshow', resetLoadingOnRestore);
    return () => window.removeEventListener('pageshow', resetLoadingOnRestore);
  }, []);

  // 소셜로그인은 프론트에서 API를 직접 호출하는 게 아니라, 백엔드의 OAuth2 시작 URL로
  // 브라우저 자체를 이동시킨다. 이후 구글/카카오/네이버 로그인 -> 백엔드 콜백 -> 다시 프론트의
  // /oauth/callback?token=... 으로 리다이렉트되는 흐름은 전부 백엔드가 처리한다 (App.jsx에서 token을 받음).
  const SOCIAL_LOGIN_URLS = { google: googleLoginUrl, kakao: kakaoLoginUrl, naver: naverLoginUrl };
  const handleSocialLogin = (provider) => {
    setError(null);
    setLoading(provider);
    window.location.href = SOCIAL_LOGIN_URLS[provider]();
  };

  const handleEmailSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }
    setLoading('email');
    try {
      // 백엔드 없이도 동작하는 테스트 계정이면 서버에 요청하지 않고 바로 통과
      if (tryMockLogin({ email, password })) {
        onAuthed();
        onClose();
        return;
      }
      await login({ email, password });
      onAuthed();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="rounded-3xl p-7 w-full max-w-xs relative"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}
        onClick={e => e.stopPropagation()}>
        {/* Deco top */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>💕</div>

        <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>로그인</h2>
        <p className="text-xs text-center text-stone-400 mb-5">우리만의 공간에 오신 걸 환영해요 🌸</p>

        <div className="space-y-2.5">
          <button onClick={() => handleSocialLogin('google')} disabled={loading !== null}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ border: '1.5px solid #ffd6e0', background: 'white', color: '#3d2c35' }}>
            <span className="text-base">🔵</span>
            <span>{loading === 'google' ? '이동 중...' : 'Google로 계속하기'}</span>
          </button>

          <button onClick={() => handleSocialLogin('kakao')} disabled={loading !== null}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ background: '#FEE500', color: '#3d2c35' }}>
            <span className="text-base">💬</span>
            <span>{loading === 'kakao' ? '이동 중...' : '카카오로 계속하기'}</span>
          </button>

          <button onClick={() => handleSocialLogin('naver')} disabled={loading !== null}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ background: '#03C75A', color: 'white' }}>
            <span className="text-base">🅽</span>
            <span>{loading === 'naver' ? '이동 중...' : '네이버로 계속하기'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px" style={{ background: '#ffd6e0' }} />
          <span className="text-[11px] text-stone-400">또는 이메일로 계속하기</span>
          <div className="flex-1 h-px" style={{ background: '#ffd6e0' }} />
        </div>

        <div className="space-y-2.5">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🌷</span>
            <input type="email" className="flex-1 text-sm outline-none bg-transparent" placeholder="이메일"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
          </div>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🔑</span>
            <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="비밀번호"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
          </div>
        </div>

        <button onClick={handleEmailSubmit} disabled={loading !== null}
          className="mt-3 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
          {loading === 'email' ? '처리 중...' : '로그인 💖'}
        </button>

        {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}

        <p className="text-center text-[10px] text-stone-300 mt-3 leading-relaxed">
          백엔드 없이 다른 탭만 보고 싶다면: admin/password, couple/couple
        </p>

        <p className="text-center text-xs text-stone-400 mt-3 cursor-pointer hover:text-pink-400 transition-colors"
          onClick={() => { window.location.href = '/signup'; }}>
          아직 계정이 없으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>회원가입</span>
        </p>
      </div>
    </div>
  )
}
