import { useState } from 'react';
import { googleLoginUrl, kakaoLoginUrl, naverLoginUrl, signup } from '@/lib/api';
import { SignupCarousel } from '@/components/SignupCarousel';

const GENDER_OPTIONS = [
  { value: 'UNKNOWN', label: '선택 안 함' },
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
];

// 로그인 모달과 별개의 독립 페이지(/signup)로 분리된 회원가입 화면.
// 성공 시 토큰이 저장된 상태로 홈('/')으로 이동한다.
export function SignupPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const SOCIAL_LOGIN_URLS = { google: googleLoginUrl, kakao: kakaoLoginUrl, naver: naverLoginUrl };
  const handleSocialSignup = (provider) => {
    setError(null);
    setLoading(provider);
    window.location.href = SOCIAL_LOGIN_URLS[provider]();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email || !nickname || !password) {
      setError('이메일, 닉네임, 비밀번호를 모두 입력해주세요');
      return;
    }
    setLoading('email');
    try {
      await signup({ email, nickname, gender, password });
      window.location.href = '/';
    } catch (e) {
      setError(e.message);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>
      <div className="rounded-3xl w-full max-w-xs md:max-w-3xl md:grid md:grid-cols-2 overflow-hidden"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
      <div className="p-7">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>💕</div>

        <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>회원가입</h2>
        <p className="text-xs text-center text-stone-400 mb-5">우리만의 공간에 오신 걸 환영해요 🌸</p>

        <div className="space-y-2.5">
          <button onClick={() => handleSocialSignup('google')} disabled={loading !== null}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ border: '1.5px solid #ffd6e0', background: 'white', color: '#3d2c35' }}>
            <span className="text-base">🔵</span>
            <span>{loading === 'google' ? '이동 중...' : 'Google로 계속하기'}</span>
          </button>

          <button onClick={() => handleSocialSignup('kakao')} disabled={loading !== null}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ background: '#FEE500', color: '#3d2c35' }}>
            <span className="text-base">💬</span>
            <span>{loading === 'kakao' ? '이동 중...' : '카카오로 계속하기'}</span>
          </button>

          <button onClick={() => handleSocialSignup('naver')} disabled={loading !== null}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
            style={{ background: '#03C75A', color: 'white' }}>
            <span className="text-base">🅽</span>
            <span>{loading === 'naver' ? '이동 중...' : '네이버로 계속하기'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px" style={{ background: '#ffd6e0' }} />
          <span className="text-[11px] text-stone-400">또는 이메일로 가입하기</span>
          <div className="flex-1 h-px" style={{ background: '#ffd6e0' }} />
        </div>

        <div className="space-y-2.5">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🌸</span>
            <input className="flex-1 text-sm outline-none bg-transparent" placeholder="닉네임"
              value={nickname} onChange={e => setNickname(e.target.value)}
              style={{ color: '#3d2c35' }} />
          </div>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🌷</span>
            <input type="email" className="flex-1 text-sm outline-none bg-transparent" placeholder="이메일"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ color: '#3d2c35' }} />
          </div>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🔑</span>
            <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="비밀번호"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ color: '#3d2c35' }} />
          </div>

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
        </div>

        <button onClick={handleSubmit} disabled={loading !== null}
          className="mt-4 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
          {loading === 'email' ? '가입 중...' : '회원가입 💖'}
        </button>

        {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}

        <p className="text-center text-xs text-stone-400 mt-3 cursor-pointer hover:text-pink-400 transition-colors"
          onClick={() => { window.location.href = '/'; }}>
          이미 계정이 있으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>로그인</span>
        </p>
      </div>

      {/* 기능 소개 캐러셀 - 모바일 폭에서는 숨김 */}
      <div className="hidden md:block">
        <SignupCarousel />
      </div>
      </div>
    </div>
  );
}
