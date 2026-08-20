import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Avatar } from '../components/Avatar';
import {
  getMe, updateMe, changePassword, uploadProfilePhoto, getMockUser, setMockUser,
  getMySubscription, cancelSubscription, getCoupleStatus, disconnectCouple, updateMetDate,
  ackAdminReconnect, withdrawMe,
} from '@/lib/api';

const todayStr = () => new Date().toISOString().slice(0, 10);

const SUBSCRIPTION_STATUS_LABEL = {
  ACTIVE: '구독 중', PAST_DUE: '결제 실패', CANCELED: '해지됨',
};

function formatDateOnly(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR', { dateStyle: 'medium' });
}

// 자정 기준이 아니라 "일수 차이"만 필요하므로 두 날짜의 자정 시각끼리 빼서 계산한다
// (시분초가 섞이면 23시간 59분 같은 값이 하루로 안 잡히는 오차가 생길 수 있음).
function daysSince(value) {
  if (!value) return null;
  const start = new Date(value);
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  return Math.floor((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;
}

// 100일 단위 기념일과 주년(365일 단위) 기념일을 합쳐서, 현재 며칠째(daysCount) 이후로
// 가장 가까운 기념일을 찾는다. daysCount와 정확히 같으면 "오늘이 그날"이라는 뜻이 된다.
function nextAnniversary(daysCount) {
  const candidates = [];
  for (let d = 100; d <= 5000; d += 100) candidates.push({ days: d, label: `${d}일` });
  for (let y = 1; y <= 20; y++) candidates.push({ days: y * 365, label: `${y}주년` });
  candidates.sort((a, b) => a.days - b.days || a.label.length - b.label.length);
  return candidates.find(c => c.days >= daysCount);
}


// 커플 매칭 로직이 성별 기반으로 분기하기 때문에 여기서도 "선택 안 함"은 빼고 남성/여성만 고르게 한다
// (LoginModal 회원가입 폼, ProfileConfirmModal과 동일한 정책 - 마이페이지에서 되돌릴 수 있으면 의미 없음).
const GENDER_OPTIONS = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
];

export function MyPageTab({ onUpdated, onWithdrawn, onTabChange }) {
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

  const [subscription, setSubscription] = useState(null); // null: 로딩 중, { hasSubscription: false }, 또는 SubscriptionDto
  const [subCanceling, setSubCanceling] = useState(false);
  const [subError, setSubError] = useState(null);

  const [coupleStatus, setCoupleStatus] = useState(null); // null: 로딩 중, StatusResponse
  const [metDateInput, setMetDateInput] = useState('');
  const [metDateSaving, setMetDateSaving] = useState(false);
  const [metDateError, setMetDateError] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);

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
    const loadProfile = async () => {
      try {
        const data = await getMe();
        setProfile(data);
        setNickname(data.nickname ?? '');
        setGender(data.gender ?? 'UNKNOWN');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // 테스트 계정(mockUser)은 실제 백엔드 데이터가 없으므로 구독/커플 조회는 건너뛰되,
  // coupleStatus를 null로 방치하면 "확인 중.../불러오는 중..." 로딩 상태로 영영 안 풀리므로
  // 커플이 연결 안 된 상태와 동일한 기본값을 바로 채워준다.
  useEffect(() => {
    if (mockUser) {
      setCoupleStatus({ linked: false, partner: null, connectedAt: null, metDate: null });
      return;
    }
    const loadSubscription = async () => {
      try {
        setSubscription(await getMySubscription());
      } catch {
        setSubscription({ hasSubscription: false });
      }
    };
    const loadCoupleStatus = async () => {
      try {
        const data = await getCoupleStatus();
        setCoupleStatus(data);
        setMetDateInput(data.metDate || '');
      } catch {
        setCoupleStatus({ linked: false, partner: null, connectedAt: null, metDate: null });
      }
    };
    loadSubscription();
    loadCoupleStatus();
  }, []);

  const handleSaveMetDate = async () => {
    setMetDateError('');
    setMetDateSaving(true);
    try {
      await updateMetDate(metDateInput || null);
      setCoupleStatus(s => ({ ...s, metDate: metDateInput || null }));
    } catch (e) {
      setMetDateError(e.message || '저장하지 못했어요');
    } finally {
      setMetDateSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(
      '정말 연결을 해제할까요?\n' +
      '해제하면 만난 날짜, 연결 기간 등 함께 쌓아온 기록은 같은 상대와 다시 연결하기 전까지 보이지 않게 돼요.'
    )) return;
    setDisconnecting(true);
    try {
      await disconnectCouple();
      setCoupleStatus({ linked: false, partner: null, connectedAt: null, metDate: null, reconnectedByAdminAt: null });
      setMetDateInput('');
    } catch (e) {
      setMetDateError(e.message || '연결 해제에 실패했어요');
    } finally {
      setDisconnecting(false);
    }
  };

  // 관리자가 방금 "다시 연결"을 눌러준 경우, 마이페이지에 배너로 알려주고 확인하면 서버에도
  // 확인 처리(ackAdminReconnect)해서 다음 조회부터는 배너가 다시 안 뜨게 한다.
  const handleAckAdminReconnect = async () => {
    setCoupleStatus(s => (s ? { ...s, reconnectedByAdminAt: null } : s));
    try {
      await ackAdminReconnect();
    } catch {
      // 확인 처리 실패해도 화면에서는 이미 배너를 닫았으니 조용히 무시 - 다음 새로고침 때
      // 배너가 다시 뜨는 정도의 사소한 불편만 남는다.
    }
  };

  const handleCancelSubscription = async () => {
    setSubError(null);
    if (!window.confirm('구독을 해지할까요?\n이미 낸 이용 기간이 끝날 때까지는 계속 이용할 수 있고, 이후 자동 갱신만 안 돼요.')) return;
    setSubCanceling(true);
    try {
      const updated = await cancelSubscription();
      setSubscription(updated);
    } catch (e) {
      setSubError(e.message);
    } finally {
      setSubCanceling(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawError(null);
    if (mockUser) {
      setWithdrawError('테스트 계정은 탈퇴할 수 없어요');
      return;
    }
    if (!window.confirm('정말 탈퇴하시겠어요?\n탈퇴 후 1년이 지나면 계정 정보가 완전히 삭제돼요.')) return;
    setWithdrawing(true);
    try {
      await withdrawMe();
      onWithdrawn?.();
    } catch (e) {
      setWithdrawError(e.message);
      setWithdrawing(false);
    }
  };

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
    <div className="max-w-md md:max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle sub="내 정보를 확인하고 수정할 수 있어요">⚙️ 마이페이지</SectionTitle>
        {!loading && profile && (
          <button onClick={handleWithdraw} disabled={withdrawing}
            className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all hover:opacity-80 disabled:opacity-60"
            style={{ border: '1.5px solid #ffd6e0', color: '#a89aa0' }}>
            {withdrawing ? '처리 중...' : '회원 탈퇴'}
          </button>
        )}
      </div>
      {withdrawError && <p className="text-right text-xs -mt-2 mb-2" style={{ color: '#e8486b' }}>{withdrawError}</p>}

      {/* 실제 그리드로 배치 - 1행: 프로필/우리의 연결, 2행: 구독 정보/비밀번호 변경.
          grid는 각 행 높이가 그 행에서 제일 큰 카드에 맞춰지므로, 같은 행 카드끼리 항상
          나란히 시작한다 - flex 컬럼을 각자 쌓을 때와 달리 왼쪽/오른쪽 카드 개수·높이가
          달라도 어긋나지 않는다. items-stretch(기본값)라서 같은 행의 두 카드는 높이도 맞는다. */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.25fr] gap-5">
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

      {/* 우리의 연결 - CoupleTab "우리의 연결" 카드와 동일한 느낌으로 통일 (그리드 1행 2번째 칸).
          flex flex-col + 아래 비연결 상태의 flex-1로, 카드가 stretch로 늘어났을 때 남는 세로
          공간을 안전하게 채운다(percentage height 대신 flexbox 성장을 쓰는 이유 - 오버플로 방지). */}
      {!loading && profile && (
        <div className="rounded-3xl p-6 flex flex-col"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          {coupleStatus?.linked && coupleStatus.metDate && (
            <p className="text-center text-sm font-bold mb-3" style={{ color: '#e8486b' }}>
              만난 지 {daysSince(coupleStatus.metDate)}일째 💗
            </p>
          )}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold" style={{ color: '#3d2c35' }}>우리의 연결</h3>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: coupleStatus?.linked ? '#f0fbf6' : '#fff0f3', color: coupleStatus?.linked ? '#2fa876' : '#e8486b' }}>
              {coupleStatus === null ? '확인 중...' : coupleStatus.linked ? '연결됨' : '연결 안 됨'}
            </span>
          </div>

          {coupleStatus === null ? (
            <p className="text-xs text-stone-400 text-center py-8">불러오는 중...</p>
          ) : coupleStatus.linked ? (
            <>
              {/* 관리자가 방금 "다시 연결"을 눌러준 경우에만 뜨는 알림 - 확인을 눌러야 사라진다 */}
              {coupleStatus.reconnectedByAdminAt && (
                <div className="mb-4 rounded-2xl px-4 py-3" style={{ background: '#f7f2fb', border: '1.5px solid #e8d5f5' }}>
                  <p className="text-xs font-bold" style={{ color: '#8b65ad' }}>
                    💌 관리자가 커플 연결을 다시 이어줬어요! 연결일이 오늘로 새로 시작됐어요.
                  </p>
                  <button onClick={handleAckAdminReconnect}
                    className="mt-2 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: 'white', color: '#8b65ad', border: '1.5px solid #e8d5f5' }}>
                    확인했어요
                  </button>
                </div>
              )}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="text-center">
                  <Avatar profileImageUrl={profile.profileImageUrl} gender={profile.gender} size={64} className="mx-auto" />
                  <p className="mt-2 text-xs font-bold" style={{ color: '#3d2c35' }}>나</p>
                </div>
                <div className="flex min-w-16 flex-1 items-center" aria-hidden="true">
                  <span className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: '#f2bdca' }} />
                  <span className="mx-2 flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ background: '#fff0f3' }}>💗</span>
                  <span className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: '#f2bdca' }} />
                </div>
                <div className="text-center">
                  <Avatar profileImageUrl={coupleStatus.partner?.profileImageUrl} gender={coupleStatus.partner?.gender} size={64} className="mx-auto" />
                  <p className="mt-2 text-xs font-bold" style={{ color: '#3d2c35' }}>{coupleStatus.partner?.nickname || '내 사람'}</p>
                </div>
              </div>

              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6d5662' }}>만난 날짜</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={metDateInput}
                  max={todayStr()}
                  onChange={e => setMetDateInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none"
                  style={{ border: '1.5px solid #f0dbe1', background: 'white', color: '#5c4651' }}
                />
                <button
                  onClick={handleSaveMetDate}
                  disabled={metDateSaving || metDateInput === (coupleStatus.metDate || '')}
                  className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)' }}>
                  {metDateSaving ? '저장 중' : '저장'}
                </button>
              </div>
              {metDateError && <p className="text-[11px] mt-1.5" style={{ color: '#e8486b' }}>{metDateError}</p>}

              <p className="text-[11px] text-stone-400 mt-3">
                이 사이트에서 연결된 지 {daysSince(coupleStatus.connectedAt)}일째 ({formatDateOnly(coupleStatus.connectedAt)}~)
              </p>

              <button onClick={handleDisconnect} disabled={disconnecting}
                className="mt-5 w-full rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-60"
                style={{ background: '#f7f2fb', color: '#9a75bb' }}>
                {disconnecting ? '해제 중...' : '연결 해제하기'}
              </button>

              {/* 다음 기념일 배지 - 만난 날짜 기준(없으면 사이트 연결일 기준)으로 계산한다. */}
              {(() => {
                const baseDate = coupleStatus.metDate || coupleStatus.connectedAt;
                const current = daysSince(baseDate);
                const milestone = nextAnniversary(current);
                if (!milestone) return null;
                return (
                  <div className="mt-4 rounded-2xl px-4 py-2.5 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)' }}>
                    <span className="text-xs font-bold text-white">
                      {milestone.days === current ? '오늘 기념일이에요! 🎉' : '다음 기념일'}
                    </span>
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'white', color: '#e8486b' }}>
                      {milestone.days === current ? milestone.label : `D-${milestone.days - current} · ${milestone.label}`}
                    </span>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>아직 내 파트너가 없어요 🌱</p>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                새로운 인연이 찾아오길 바랄게요<br />내 파트너 링크 탭에서 초대 링크를 보내보세요
              </p>
              <button onClick={() => onTabChange?.('couple')}
                className="mt-5 rounded-2xl px-5 py-2.5 text-xs font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
                내 파트너 링크 탭으로 가기 💞
              </button>
            </div>
          )}
        </div>
      )}

      {/* 비밀번호 변경 (그리드 2행 1번째 칸). self-start로 옆 칸(구독 정보)과 높이를
          공유하지 않게 해서, 펼치기를 눌러 이 카드가 늘어나도 구독 정보 카드는 그대로 있는다. */}
      {!loading && profile && (
        <div className="self-start rounded-3xl p-5"
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

      {/* 구독 정보 (그리드 2행 2번째 칸). self-start로 비밀번호 변경 카드가 펼쳐져도
          이 카드 높이는 영향받지 않는다. */}
      {!loading && profile && (
        <div className="self-start rounded-3xl p-6"
          style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#3d2c35' }}>구독 정보 💳</h3>
          {mockUser ? (
            <p className="text-sm text-center py-4 text-stone-400">테스트 계정은 구독 정보를 사용할 수 없어요</p>
          ) : subscription === null ? (
            <p className="text-xs text-stone-400 text-center py-3">불러오는 중...</p>
          ) : !subscription.hasSubscription ? (
            <p className="text-sm text-center py-4" style={{ color: '#3d2c35' }}>
              구독 중이 아니에요<br />
              <span className="text-xs text-stone-400">상단의 💳 구독 메뉴에서 가입할 수 있어요</span>
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-400">상태</span>
                <span className="text-sm font-bold" style={{ color: subscription.status === 'ACTIVE' ? '#4dbfa8' : subscription.status === 'PAST_DUE' ? '#e8486b' : '#a89aa0' }}>
                  {SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-stone-400">시작일</span>
                <span className="text-sm" style={{ color: '#3d2c35' }}>{formatDateOnly(subscription.startedAt)}</span>
              </div>
              {subscription.status !== 'CANCELED' && (
                <button onClick={handleCancelSubscription} disabled={subCanceling}
                  className="w-full py-2.5 rounded-2xl font-bold text-sm transition-all hover:opacity-80 disabled:opacity-60"
                  style={{ border: '1.5px solid #ffd6e0', color: '#e8486b' }}>
                  {subCanceling ? '해지 중...' : '구독 해지하기'}
                </button>
              )}
              {subError && <p className="text-center text-xs mt-3" style={{ color: '#e8486b' }}>{subError}</p>}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
