import { useEffect, useState } from 'react';
import { googleLoginUrl, kakaoLoginUrl, naverLoginUrl, login, signup, tryMockLogin, adminCheck } from '@/lib/api';
import { SignupCarousel } from '@/components/SignupCarousel';

const GENDER_OPTIONS = [
  { value: 'UNKNOWN', label: '선택 안 함' },
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
];

// 로그인/회원가입을 한 모달 안에서 mode로 전환한다. 페이지 이동(window.location) 없이
// 화면만 바뀌므로 회원가입 쪽 캐러셀(SignupCarousel)도 그대로 재사용한다.
export function LoginModal({ onClose, onAuthed, initialError }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
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

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  // 소셜로그인은 프론트에서 API를 직접 호출하는 게 아니라, 백엔드의 OAuth2 시작 URL로
  // 브라우저 자체를 이동시킨다. 이후 구글/카카오/네이버 로그인 -> 백엔드 콜백 -> 다시 프론트의
  // /oauth/callback?token=... 으로 리다이렉트되는 흐름은 전부 백엔드가 처리한다 (App.jsx에서 token을 받음).
  // 로그인이든 회원가입이든 같은 OAuth2 흐름이라 버튼 동작은 동일하다.
  const SOCIAL_LOGIN_URLS = { google: googleLoginUrl, kakao: kakaoLoginUrl, naver: naverLoginUrl };
  const handleSocialLogin = (provider) => {
    setError(null);
    setLoading(provider);
    window.location.href = SOCIAL_LOGIN_URLS[provider]();
  };

  const handleSubmit = async () => {
    setError(null);
    if (mode === 'signup') {
      if (!email || !nickname || !password) {
        setError('이메일, 닉네임, 비밀번호를 모두 입력해주세요');
        return;
      }
      setLoading('email');
      try {
        await signup({ email, nickname, gender, password });
        onAuthed();
        onClose();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(null);
      }
      return;
    }

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
      // 관리자 계정으로 로그인한 경우 메인 앱 대신 바로 관리자 페이지로 이동
      const { isAdmin } = await adminCheck().catch(() => ({ isAdmin: false }));
      if (isAdmin) {
        window.location.href = '/admin';
        return;
      }
      onAuthed();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className={`rounded-3xl w-full overflow-hidden ${isSignup ? 'max-w-xs md:max-w-3xl md:grid md:grid-cols-2' : 'max-w-xs'}`}
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}
        onClick={e => e.stopPropagation()}>
        <div className="p-7">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>💕</div>

          <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>
            {isSignup ? '회원가입' : '로그인'}
          </h2>
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
            <span className="text-[11px] text-stone-400">{isSignup ? '또는 이메일로 가입하기' : '또는 이메일로 계속하기'}</span>
            <div className="flex-1 h-px" style={{ background: '#ffd6e0' }} />
          </div>

          <div className="space-y-2.5">
            {isSignup && (
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                <span className="text-sm">🌸</span>
                <input className="flex-1 text-sm outline-none bg-transparent" placeholder="닉네임"
                  value={nickname} onChange={e => setNickname(e.target.value)}
                  style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
              </div>
            )}
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

            {isSignup && (
              <div>
                <label className="text-xs font-bold text-stone-400 mb-1.5 block px-1">성별</label>
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
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading !== null}
            className="mt-3 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
            {loading === 'email' ? (isSignup ? '가입 중...' : '처리 중...') : (isSignup ? '회원가입 💖' : '로그인 💖')}
          </button>

          {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}

          {!isSignup && (
            <p className="text-center text-[10px] text-stone-300 mt-3 leading-relaxed">
              백엔드 없이 다른 탭만 보고 싶다면: admin/password, couple/couple
            </p>
          )}

          <p className="text-center text-xs text-stone-400 mt-3 cursor-pointer hover:text-pink-400 transition-colors"
            onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
            {isSignup ? (
              <>이미 계정이 있으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>로그인</span></>
            ) : (
              <>아직 계정이 없으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>회원가입</span></>
            )}
          </p>
        </div>

        {isSignup && (
          <div className="hidden md:block">
            <SignupCarousel />
          </div>
        )}
      </div>
    </div>
  )
}
