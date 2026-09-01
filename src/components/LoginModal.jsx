import { useEffect, useState } from 'react';
import {
  googleLoginUrl, kakaoLoginUrl, naverLoginUrl, login, signup, adminCheck,
  checkEmailAvailable, checkNicknameAvailable, uploadProfilePhoto, findPassword,
} from '@/lib/api';
import { SignupCarousel } from '@/components/SignupCarousel';

// 커플 매칭 로직이 성별 기반으로 분기하기 때문에 "선택 안 함(UNKNOWN)"은 일부러 넣지 않는다 -
// 소셜 로그인 첫 가입 시 뜨는 ProfileConfirmModal과 동일한 정책.
// 브라우저 기본 검증(type="email") 대신, 중복확인 버튼을 눌렀을 때 이 정규식으로 형식을 먼저
// 체크해서 앱 톤에 맞는 커스텀 메시지를 보여준다.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_OPTIONS = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
];

// 네이버 로그인은 네이버 개발자센터 심사(추가인증)를 통과해 "서비스 중" 상태가 되기 전까지는
// 앱 등록 시 지정해둔 테스트 계정으로만 로그인이 된다 - 코드 문제가 아니라 심사 승인 여부에
// 달린 문제일 수 있다. 팀원 확인 결과 정상 동작하지 않는다고 판단되면 이 값만 false로 바꾸면
// 바로 "준비중입니다" 안내로 전환된다(백엔드 OAuth 설정은 그대로 둔 채 버튼만 막는 방식).
const NAVER_LOGIN_ENABLED = false;

// 로그인/회원가입을 한 모달 안에서 mode로 전환한다. 페이지 이동(window.location) 없이
// 화면만 바뀌므로 회원가입 쪽 캐러셀(SignupCarousel)도 그대로 재사용한다.
export function LoginModal({ onClose, onAuthed, onSignupComplete, initialError }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'find-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState(null);
  const [photoFile, setPhotoFile] = useState(null); // 회원가입 시 선택적 업로드 - 안 골라도 가입 가능
  const [photoSizeError, setPhotoSizeError] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(initialError ?? null);
  const [findPasswordSent, setFindPasswordSent] = useState(false); // 비밀번호 찾기 메일 발송 완료 여부

  // 회원가입 화면 전용: 중복확인은 지금은 API만 먼저 열어두는 단계라 결과를 보여주기만 하고
  // 제출을 막지는 않는다 (막는 UX 게이트는 프로젝트 막판에 켜기로 팀에서 정함)
  const [nicknameCheck, setNicknameCheck] = useState(null); // { checking, available, message }
  const [emailCheck, setEmailCheck] = useState(null);

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
    setNicknameCheck(null);
    setEmailCheck(null);
    setGender(null);
    setPhotoFile(null);
    setPhotoSizeError(null);
    setPasswordConfirm('');
    setFindPasswordSent(false);
  };

  // 비밀번호 찾기 - 가입 여부와 상관없이 항상 "보냈다"고 응답이 오므로, 성공/실패 구분 없이
  // 요청이 끝나면 안내 화면으로 넘어간다(계정 존재 여부가 노출되지 않도록).
  const handleFindPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }
    setLoading('email');
    try {
      await findPassword(email.trim());
      setFindPasswordSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleCheckNickname = async () => {
    if (!nickname.trim()) return;
    setNicknameCheck({ checking: true });
    try {
      const { available } = await checkNicknameAvailable(nickname.trim());
      setNicknameCheck({ checking: false, available, message: available ? '사용 가능한 닉네임이에요' : '이미 사용 중인 닉네임이에요' });
    } catch (e) {
      setNicknameCheck({ checking: false, available: null, message: e.message });
    }
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) return;
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailCheck({ checking: false, available: false, message: '올바른 이메일 형식을 입력하세요' });
      return;
    }
    setEmailCheck({ checking: true });
    try {
      const { available } = await checkEmailAvailable(email.trim());
      setEmailCheck({ checking: false, available, message: available ? '사용 가능한 이메일이에요' : '이미 가입된 이메일이에요' });
    } catch (e) {
      setEmailCheck({ checking: false, available: null, message: e.message });
    }
  };

  // 소셜로그인은 프론트에서 API를 직접 호출하는 게 아니라, 백엔드의 OAuth2 시작 URL로
  // 브라우저 자체를 이동시킨다. 이후 구글/카카오/네이버 로그인 -> 백엔드 콜백 -> 다시 프론트의
  // /oauth/callback?token=... 으로 리다이렉트되는 흐름은 전부 백엔드가 처리한다 (App.jsx에서 token을 받음).
  // 로그인이든 회원가입이든 같은 OAuth2 흐름이라 버튼 동작은 동일하다.
  const SOCIAL_LOGIN_URLS = { google: googleLoginUrl, kakao: kakaoLoginUrl, naver: naverLoginUrl };
  const handleSocialLogin = (provider) => {
    if (provider === 'naver' && !NAVER_LOGIN_ENABLED) {
      window.alert('네이버 로그인은 현재 준비중입니다');
      return;
    }
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
      if (!gender) {
        setError('성별을 선택해주세요');
        return;
      }
      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다');
        return;
      }
      setLoading('email');
      try {
        // signup()이 성공하면 내부적으로 토큰을 저장하므로, 그 직후 uploadProfilePhoto가
        // 방금 만든 계정으로 인증된 상태에서 호출된다. 사진은 선택 사항이라 실패해도 가입
        // 자체를 막지는 않지만(가입은 이미 끝난 상태), 실패를 완전히 숨기면 사용자가 사진이
        // 왜 안 붙었는지 알 길이 없으므로(2026-08-24, S3 권한 문제로 실제로 실패하는 걸 발견) 알려준다.
        await signup({ email, nickname, gender, password });
        if (photoFile) {
          await uploadProfilePhoto(photoFile).catch(() => {
            window.alert('프로필 사진 업로드에 실패했어요. 마이페이지에서 다시 시도해 주세요.');
          });
        }
        onAuthed();
        // 가입 직후 성향 온보딩을 거쳐야 완료로 치는 구조라, 여기서 모달을 바로 닫지 않고
        // App.jsx가 온보딩 오버레이를 띄우도록 넘긴다.
        onSignupComplete ? onSignupComplete() : onClose();
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
      await login({ email, password });
      // 관리자 계정으로 로그인한 경우 메인 앱 대신 바로 관리자 페이지로 이동.
      // href 대신 replace를 쓰는 이유: href는 현재 '/'(로그인 전 상태) 페이지를 히스토리에
      // 그대로 남겨두는데, 뒤로가기를 누르면 그 로그인 전 스냅샷이 되살아나 실제로는
      // 로그인된 상태인데도 로그아웃된 것처럼 보였다. replace는 그 항목 자체를 지우고
      // '/admin'으로 바꿔치기하므로 뒤로가기로는 그 스냅샷에 아예 도달할 수 없게 된다.
      const { isAdmin } = await adminCheck().catch(() => ({ isAdmin: false }));
      if (isAdmin) {
        window.location.replace('/admin');
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
  const isFindPassword = mode === 'find-password';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className={`relative rounded-3xl w-full overflow-hidden ${isSignup ? 'max-w-xs md:max-w-3xl md:grid md:grid-cols-2' : 'max-w-xs'}`}
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
        {/* 배경 클릭으로는 안 닫히고, 이 버튼을 눌러야만 닫힘 (입력 중이던 내용이 실수로 날아가는 걸 방지) */}
        {/* 회원가입 화면은 오른쪽에 캐러셀 이미지가 깔려서 배경색과 섞이기 쉬우므로,
            투명 대신 흰 배경을 줘서 눈에 띄게 한다 (로그인 화면은 배경이 단순해서 기존 투명 유지) */}
        <button onClick={onClose} aria-label="닫기"
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${isSignup ? 'hover:opacity-80' : 'hover:bg-black/5'}`}
          style={isSignup
            ? { background: 'white', color: '#3d2c35', boxShadow: '0 2px 8px rgba(61,44,53,0.18)' }
            : { color: '#a89aa0' }}>
          ✕
        </button>
        <div className="p-7">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>💕</div>

          <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>
            {isSignup ? '회원가입' : isFindPassword ? '비밀번호 찾기' : '로그인'}
          </h2>
          <p className="text-xs text-center text-stone-400 mb-5">
            {isFindPassword ? '가입하신 이메일로 재설정 링크를 보내드릴게요' : '우리만의 공간에 오신 걸 환영해요 🌸'}
          </p>

          {!isFindPassword && (
          <>
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
          </>
          )}

          {/* 비밀번호 찾기 화면 - 이메일만 입력받는 짧은 폼. 요청이 끝나면(성공/실패 구분 없이
              항상 "보냈다"는 응답이 오므로) 안내 문구로 바뀐다. */}
          {isFindPassword && (
            findPasswordSent ? (
              <div className="rounded-2xl px-4 py-5 text-center" style={{ background: '#fff0f3' }}>
                <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>메일을 확인해주세요 💌</p>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  가입하신 이메일이라면 재설정 링크를 보내드렸어요.<br />링크는 30분 동안 유효해요.
                </p>
              </div>
            ) : (
              <form className="space-y-2.5" autoComplete="off" onSubmit={handleFindPassword}>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  <span className="text-sm">🌷</span>
                  <input type="text" className="flex-1 text-sm outline-none bg-transparent" placeholder="가입한 이메일"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="off"
                    style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
                </div>
                <button type="submit" disabled={loading !== null}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
                  {loading === 'email' ? '전송 중...' : '재설정 링크 보내기'}
                </button>
              </form>
            )
          )}

          {/* form으로 감싸서, 이메일/비밀번호(혹은 회원가입 필드)를 다 채운 뒤 Enter를 누르면
              브라우저 기본 동작으로 자동 제출되게 한다 - 버튼 클릭과 완전히 동일한 handleSubmit 호출. */}
          {!isFindPassword && (
          <form className="space-y-2.5" autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {isSignup && (
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="min-w-0 flex-1 rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                    <span className="text-sm">🌸</span>
                    <input className="flex-1 text-sm outline-none bg-transparent" placeholder="닉네임"
                      value={nickname} onChange={e => { setNickname(e.target.value); setNicknameCheck(null); }}
                      style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
                  </div>
                  <button type="button" onClick={handleCheckNickname} disabled={!nickname.trim() || nicknameCheck?.checking}
                    className="shrink-0 rounded-2xl px-2.5 py-3 text-xs font-bold whitespace-nowrap disabled:opacity-50"
                    style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>
                    {nicknameCheck?.checking ? '확인 중...' : '중복확인'}
                  </button>
                </div>
                {nicknameCheck?.message && (
                  <p className="text-[11px] mt-1 px-1" style={{ color: nicknameCheck.available ? '#4dbfa8' : '#e8486b' }}>
                    {nicknameCheck.message}
                  </p>
                )}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <div className="min-w-0 flex-1 rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  <span className="text-sm">🌷</span>
                  <input type="text" className="flex-1 text-sm outline-none bg-transparent" placeholder="이메일"
                    value={email} onChange={e => { setEmail(e.target.value); setEmailCheck(null); }}
                    autoComplete="off"
                    style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
                </div>
                {isSignup && (
                  <button type="button" onClick={handleCheckEmail} disabled={!email.trim() || emailCheck?.checking}
                    className="shrink-0 rounded-2xl px-2.5 py-3 text-xs font-bold whitespace-nowrap disabled:opacity-50"
                    style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>
                    {emailCheck?.checking ? '확인 중...' : '중복확인'}
                  </button>
                )}
              </div>
              {isSignup && emailCheck?.message && (
                <p className="text-[11px] mt-1 px-1" style={{ color: emailCheck.available ? '#4dbfa8' : '#e8486b' }}>
                  {emailCheck.message}
                </p>
              )}
            </div>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
              <span className="text-sm">🔑</span>
              <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="비밀번호"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
            </div>

            {!isSignup && (
              <p className="text-right text-[11px] px-1 cursor-pointer hover:text-pink-400 transition-colors"
                style={{ color: '#a89aa0' }}
                onClick={() => switchMode('find-password')}>
                비밀번호를 잊으셨나요?
              </p>
            )}

            {isSignup && (
              <div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
                  <span className="text-sm">🔑</span>
                  <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="비밀번호 확인"
                    value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
                </div>
                {passwordConfirm && (
                  <p className="text-[11px] mt-1 px-1" style={{ color: password === passwordConfirm ? '#4dbfa8' : '#e8486b' }}>
                    {password === passwordConfirm ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                  </p>
                )}
              </div>
            )}

            {isSignup && (
              <div>
                <label className="text-xs font-bold text-stone-400 mb-1.5 block px-1">성별</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setGender(opt.value)}
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

            {isSignup && (
              <div>
                <label className="text-xs font-bold text-stone-400 mb-1.5 block px-1">프로필 사진 (선택)</label>
                <label className="rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer flex items-center gap-2"
                  style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4', color: '#3d2c35' }}>
                  <span>🖼️</span>
                  <span className="truncate">{photoFile ? photoFile.name : '사진 선택하기 (안 골라도 가입 가능)'}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      // 백엔드 제한(application.yaml의 multipart max-file-size)과 동일한 5MB 기준으로
                      // 미리 걸러서, 가입 제출 후 업로드가 조용히 실패하는 걸 선택 즉시 알려준다.
                      if (file && file.size > 5 * 1024 * 1024) {
                        setPhotoSizeError('파일 크기는 5MB를 넘을 수 없어요');
                        setPhotoFile(null);
                        return;
                      }
                      setPhotoSizeError(null);
                      setPhotoFile(file);
                    }} />
                </label>
                {photoSizeError && <p className="text-xs mt-1.5 px-1" style={{ color: '#e8486b' }}>{photoSizeError}</p>}
              </div>
            )}

            <button type="submit" disabled={loading !== null}
              className="mt-3 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
              {loading === 'email' ? (isSignup ? '가입 중...' : '처리 중...') : (isSignup ? '회원가입 💖' : '로그인 💖')}
            </button>
          </form>
          )}

          {error && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{error}</p>}

          {isFindPassword ? (
            <p className="text-center text-xs text-stone-400 mt-3 cursor-pointer hover:text-pink-400 transition-colors"
              onClick={() => switchMode('login')}>
              로그인으로 돌아가기
            </p>
          ) : (
            <p className="text-center text-xs text-stone-400 mt-3 cursor-pointer hover:text-pink-400 transition-colors"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
              {isSignup ? (
                <>이미 계정이 있으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>로그인</span></>
              ) : (
                <>아직 계정이 없으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>회원가입</span></>
              )}
            </p>
          )}
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
