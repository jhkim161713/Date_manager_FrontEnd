import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Avatar, avatarSrc } from '../components/Avatar';
import { CoupleMatchCelebration } from '../components/CoupleMatchCelebration';
import { createCoupleInvite, acceptCoupleInvite, getCoupleStatus, disconnectCouple, updateMetDate } from '../lib/api';
import {
  COUPLE_SINK_BENEFITS,
  COUPLE_SINK_COPY,
  COUPLE_SINK_STEPS,
} from '../data/coupleSink';
import { PERSONA_AXES } from '../data/onboardingData';

const opposite = (gender) => (gender === 'MALE' ? 'FEMALE' : 'MALE');

// "며칠째"는 자정 기준 날짜 차이 + 1(만난 당일을 1일째로 침) - MyPageTab의 daysSince와 동일한 계산.
function daysSince(dateStr) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  return Math.floor((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// 성향 궁합 그래프의 점 색상. Avatar 컴포넌트와 같은 규칙(FEMALE만 핑크, 나머지는 블루)을 따른다.
const genderColor = (gender) => (gender === 'FEMALE' ? '#e8486b' : '#4a90d9');

// 히어로에 "다음 n일까지 D-day"를 보여줄 마일스톤 목록. 다 지나면 다음 천 단위로 계속 이어간다.
const DAY_MILESTONES = [100, 200, 300, 500, 1000, 2000, 3000];

function nextMilestone(daysTogether) {
  const upcoming = DAY_MILESTONES.find(m => m > daysTogether);
  return upcoming ?? Math.ceil((daysTogether + 1) / 1000) * 1000;
}

export function CoupleTab({ user, onTabChange, personaProfile }) {
  const [inviteLink, setInviteLink] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [status, setStatus] = useState({ loading: true, linked: false, partner: null, metDate: null });
  const [acceptToken, setAcceptToken] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [metDateInput, setMetDateInput] = useState('');
  const [metDateSaving, setMetDateSaving] = useState(false);
  const [metDateError, setMetDateError] = useState('');

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  const loadStatus = async () => {
    try {
      const data = await getCoupleStatus();
      setStatus({ loading: false, linked: data.linked, partner: data.partner, metDate: data.metDate });
      setMetDateInput(data.metDate || '');
    } catch (error) {
      setStatus({ loading: false, linked: false, partner: null, metDate: null });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const daysTogether = status.metDate ? daysSince(status.metDate) : null;
  const milestone = daysTogether != null ? nextMilestone(daysTogether) : null;

  const handleSaveMetDate = async () => {
    setMetDateError('');
    setMetDateSaving(true);
    try {
      await updateMetDate(metDateInput || null);
      setStatus(s => ({ ...s, metDate: metDateInput || null }));
      showFeedback(metDateInput ? '만난 날짜를 저장했어요' : '만난 날짜를 초기화했어요');
    } catch (error) {
      setMetDateError(error.message || '저장하지 못했어요');
    } finally {
      setMetDateSaving(false);
    }
  };

  const makeInviteLink = async () => {
    setCreatingInvite(true);
    try {
      const data = await createCoupleInvite();
      setInviteLink(data.inviteUrl);
      showFeedback('초대 링크가 만들어졌어요');
    } catch (error) {
      showFeedback(error.message || '초대 링크를 만들지 못했어요');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleAcceptInvite = async () => {
    const token = acceptToken.trim().split('/').pop();
    if (!token) {
      showFeedback('토큰(링크)을 입력해주세요');
      return;
    }
    setAccepting(true);
    try {
      await acceptCoupleInvite(token);
      showFeedback('내 파트너 연결이 완료됐어요 💕');
      setAcceptToken('');
      await loadStatus();
      setShowMatchCelebration(true);
    } catch (error) {
      showFeedback(error.message || '초대를 수락하지 못했어요');
    } finally {
      setAccepting(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm('정말 연결을 해제하시겠어요?\n해제하면 더 이상 파트너 정보를 볼 수 없어요.');
    if (!confirmed) return;
    try {
      await disconnectCouple();
      showFeedback('연결을 해제했어요');
      await loadStatus();
    } catch (error) {
      showFeedback(error.message || '연결 해제에 실패했어요');
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) {
      await makeInviteLink();
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      showFeedback('링크를 복사했어요');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      showFeedback('링크를 복사했어요');
    }
  };

  const shareInviteLink = async () => {
    if (!inviteLink) {
      await makeInviteLink();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: COUPLE_SINK_COPY.shareTitle,
          text: COUPLE_SINK_COPY.shareMessage,
          url: inviteLink,
        });
        showFeedback('초대장을 공유했어요');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    copyInviteLink();
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="px-3">
        <SectionTitle sub={COUPLE_SINK_COPY.subtitle} titleSize="text-2xl" subSize="text-sm">내 파트너 링크</SectionTitle>
      </div>

      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-7 md:px-9 md:py-8"
        style={{
          background: 'linear-gradient(125deg, #fff1ed 0%, #fff8f4 46%, #f7efff 100%)',
          border: '1.5px solid #ffd6e0',
          boxShadow: '0 12px 30px rgba(127, 76, 92, 0.08)',
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full" style={{ background: 'rgba(232, 213, 245, 0.62)' }} />
        <div className="pointer-events-none absolute -bottom-20 left-[34%] h-44 w-44 rounded-full" style={{ background: 'rgba(255, 214, 224, 0.38)' }} />

        <div className="relative z-10 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {!status.linked ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold" style={{ color: '#e8486b' }}>
                  💌 둘만의 작은 공간
                </span>
                <h1 className="font-display mt-4 text-3xl font-bold leading-[1.25] md:text-[2.35rem]" style={{ color: '#3d2c35' }}>
                  초대장 하나로,
                  <br />
                  <span style={{ color: '#e8486b' }}>우리 둘을 연결해요</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: '#7f6873' }}>
                  소중한 사람에게 초대 링크를 보내 보세요. 연결이 완료되면 서로의 취향을 맞춰 보고,
                  <br />
                  함께 가고 싶은 데이트도 한곳에 담아보세요.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={makeInviteLink}
                    disabled={creatingInvite}
                    className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #ff6b8a, #e96fa6)', boxShadow: '0 8px 20px rgba(232, 72, 107, 0.24)' }}
                  >
                    {creatingInvite ? '만드는 중...' : inviteLink ? '새 링크 만들기' : '초대 링크 만들기'}
                  </button>
                </div>
              </>
            ) : !status.metDate ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold" style={{ color: '#e8486b' }}>
                  💕 연결 완료
                </span>
                <h1 className="font-display mt-4 text-3xl font-bold leading-[1.25] md:text-[2.35rem]" style={{ color: '#3d2c35' }}>
                  사귀기 시작한 날짜를
                  <br />
                  <span style={{ color: '#e8486b' }}>알려주세요</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: '#7f6873' }}>
                  만난 날짜를 입력하면, 그날부터 함께한 시간을 세어드릴게요.
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold" style={{ color: '#e8486b' }}>
                  💕 함께한 지 {daysTogether}일째
                </span>
                <h1 className="font-display mt-4 text-3xl font-bold leading-[1.25] md:text-[2.35rem]" style={{ color: '#3d2c35' }}>
                  다음 {milestone}일까지
                  <br />
                  <span style={{ color: '#e8486b' }}>D-{milestone - daysTogether}</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: '#7f6873' }}>
                  우리만의 이야기가 하루하루 쌓이고 있어요.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onTabChange?.('builder')}
                    className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #ff6b8a, #e96fa6)', boxShadow: '0 8px 20px rgba(232, 72, 107, 0.24)' }}
                  >
                    우리 데이트 코스 짜러 가기 →
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="relative rounded-[26px] bg-white px-6 py-6" style={{ border: '1px solid rgba(255, 214, 224, 0.9)', boxShadow: '0 15px 35px rgba(101, 66, 80, 0.1)' }}>
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-extrabold" style={{ color: '#5c4651' }}>우리의 연결</span>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: status.linked ? '#f0fbf6' : '#fff0f3', color: status.linked ? '#2fa876' : '#e8486b' }}>
                  {status.loading ? '확인 중...' : status.linked ? '연결됨' : '미연결'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <Avatar profileImageUrl={user?.profileImageUrl} gender={user?.gender} size={64} className="mx-auto" />
                  <p className="mt-2 text-xs font-extrabold" style={{ color: '#5c4651' }}>나</p>
                </div>
                <div className="flex min-w-20 flex-1 items-center" aria-hidden="true">
                  <span className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: '#f2bdca' }} />
                  <span className="mx-2 flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ background: '#fff0f3' }}>💗</span>
                  <span className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: '#f2bdca' }} />
                </div>
                <div className="text-center">
                  {status.linked ? (
                    <Avatar profileImageUrl={status.partner?.profileImageUrl} gender={status.partner?.gender}
                      size={64} className="mx-auto" />
                  ) : (
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed text-2xl opacity-50" style={{ background: '#fbf8f6', borderColor: '#dfd2d7', color: '#b9a7ae' }}>+</div>
                  )}
                  <p className="mt-2 text-xs font-extrabold" style={{ color: status.linked ? '#5c4651' : '#a28d97' }}>
                    {status.linked ? (status.partner?.nickname || '내 파트너') : '내 파트너'}
                  </p>
                </div>
              </div>
              {status.linked ? (
                <>
                  <div className="mt-5">
                    <label className="block text-[10px] font-extrabold mb-1.5" style={{ color: '#6d5662' }}>{!status.metDate ? '👉 만난 날짜' : '만난 날짜'}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={metDateInput}
                        max={todayStr()}
                        onChange={e => setMetDateInput(e.target.value)}
                        className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                        style={{ border: '1.5px solid #f0dbe1', background: 'white', color: '#5c4651' }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveMetDate}
                        disabled={metDateSaving || metDateInput === (status.metDate || '')}
                        className="flex-shrink-0 rounded-xl px-3 py-2 text-[11px] font-extrabold text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)' }}
                      >
                        {metDateSaving ? '저장 중' : '저장'}
                      </button>
                    </div>
                    {metDateError && <p className="mt-1 text-[10px]" style={{ color: '#e8486b' }}>{metDateError}</p>}
                  </div>
                  <button type="button" onClick={handleDisconnect}
                    className="mt-4 w-full rounded-xl py-2.5 text-[11px] font-extrabold"
                    style={{ background: '#f7f2fb', color: '#9a75bb' }}>
                    연결 해제하기
                  </button>
                </>
              ) : (
                <p className="mt-6 text-center text-[11px] leading-5" style={{ color: '#a28d97' }}>
                  상대가 링크를 열고 초대를 수락하면<br />내 파트너와의 공간이 열려요.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {status.linked && (
        <section className="rounded-[26px] bg-white p-5 md:p-6" style={{ border: '1.5px solid #f3dde3', boxShadow: '0 6px 20px rgba(127, 76, 92, 0.05)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🧩</span>
              <h3 className="font-display text-lg font-bold" style={{ color: '#3d2c35' }}>성향 궁합</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1" style={{ color: genderColor(user?.gender) }}>
                <span className="h-2 w-2 rounded-full" style={{ background: genderColor(user?.gender) }} />나
              </span>
              <span className="flex items-center gap-1" style={{ color: genderColor(status.partner?.gender) }}>
                <span className="h-2 w-2 rounded-full" style={{ background: genderColor(status.partner?.gender) }} />{status.partner?.nickname || '파트너'}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#a28d97' }}>나와 파트너의 문화생활 성향 점수를 비교할 수 있어요.</p>

          <div className="mt-5 space-y-4">
            {PERSONA_AXES.map(({ id, koreanLabel, lowLabel, highLabel }) => {
              const myScore = personaProfile?.scores?.[id] ?? 50;
              // 파트너 실제 점수는 UserStyle API가 아직 없어서 못 가져옴 - 백엔드 준비되면
              // getPersonaScoreComparison() 같은 함수로 이 값을 실제 조회값으로 교체할 것.
              const partnerScore = 50;

              return (
                <div key={id}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold" style={{ color: '#6d5662' }}>{koreanLabel}</span>
                    <span className="text-[10px] font-bold">
                      <span style={{ color: genderColor(user?.gender) }}>나: {myScore}</span>
                      <span className="mx-1" style={{ color: '#d8c8ce' }}>·</span>
                      <span style={{ color: genderColor(status.partner?.gender) }}>파트너: {partnerScore}</span>
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-2 rounded-full" style={{ background: '#f3e9ec' }}>
                    <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm" style={{ left: `calc(${myScore}% - 7px)`, background: genderColor(user?.gender) }} />
                    <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm" style={{ left: `calc(${partnerScore}% - 7px)`, background: genderColor(status.partner?.gender) }} />
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[10px] text-stone-400">{lowLabel}</span>
                    <span className="text-[10px] text-stone-400">{highLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[10px]" style={{ color: '#b09da5' }}>
            파트너의 성향 점수는 아직 실제 연동 전이라 중립값(50)으로 표시돼요.
          </p>
        </section>
      )}

      {!status.linked && (
      <section className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="rounded-[26px] bg-white p-5 md:p-6" style={{ border: '1.5px solid #f3dde3', boxShadow: '0 6px 20px rgba(127, 76, 92, 0.05)' }}>
          <div>
            <h3 className="font-display text-lg font-bold" style={{ color: '#3d2c35' }}>초대 링크 보내기</h3>
            <p className="mt-1 text-xs" style={{ color: '#a28d97' }}>나의 연인에게 링크를 보내고 연결을 시작해 보세요.</p>
          </div>

          <label className="mt-5 block text-[11px] font-extrabold" style={{ color: '#6d5662' }}>내 파트너 초대 링크</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl p-2 pl-4" style={{ background: inviteLink ? '#fffaf8' : '#faf7f6', border: '1.5px solid #f0dbe1' }}>
            <span aria-hidden="true">🔗</span>
            <input
              type="text"
              readOnly
              value={inviteLink}
              placeholder="버튼을 누르면 초대 링크가 만들어져요"
              aria-label="내 파트너 초대 링크"
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:font-normal placeholder:text-stone-400"
              style={{ color: '#5c4651' }}
            />
            <button
              type="button"
              onClick={copyInviteLink}
              className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all hover:scale-[1.03]"
              style={{ background: inviteLink ? '#fff0f3' : '#eee8ea', color: inviteLink ? '#e8486b' : '#99878e' }}
            >
              {inviteLink ? '링크 복사' : '링크 만들기'}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px]" style={{ color: '#b09da5' }}>링크는 1시간 동안 유효하며, 연결되면 자동으로 만료돼요.</p>
            <button type="button" onClick={shareInviteLink} className="rounded-xl px-4 py-2 text-xs font-extrabold" style={{ border: '1.5px solid #e8d5f5', color: '#8b65ad', background: '#fcfaff' }}>
              공유하기 ↗
            </button>
          </div>

          <div className="mt-5 rounded-2xl p-4" style={{ background: '#f9f6ff', border: '1.5px dashed #e3d3f5' }}>
            <label className="block text-[11px] font-extrabold" style={{ color: '#6d5662' }}>
              받은 초대 링크 수락하기
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={acceptToken}
                onChange={e => setAcceptToken(e.target.value)}
                placeholder="상대가 보낸 링크를 붙여넣으세요"
                className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none placeholder:font-normal placeholder:text-stone-400"
                style={{ border: '1.5px solid #f0dbe1', background: 'white', color: '#5c4651' }}
              />
              <button
                type="button"
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)' }}
              >
                {accepting ? '연결 중...' : '수락하기'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {COUPLE_SINK_BENEFITS.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl p-4" style={{ background: benefit.background, border: `1px solid ${benefit.border}` }}>
                <span className="text-xl" aria-hidden="true">{benefit.emoji}</span>
                <h4 className="mt-2 text-xs font-extrabold" style={{ color: '#4c3943' }}>{benefit.title}</h4>
                <p className="mt-1 text-[10px] leading-4" style={{ color: '#927f88' }}>{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[26px] p-5 md:p-6" style={{ background: '#fff6ef', border: '1.5px solid #f6dfce' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ background: '#ffe8d6' }}>🫶</div>
          <h3 className="font-display mt-4 text-lg font-bold" style={{ color: '#49363f' }}>이렇게 연결돼요</h3>
          <div className="mt-5 space-y-4">
            {COUPLE_SINK_STEPS.map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-extrabold" style={{ color: '#e27676', border: '1px solid #f1c9c1' }}>{index + 1}</span>
                  {index < COUPLE_SINK_STEPS.length - 1 && <span className="mt-1 h-7 w-px" style={{ background: '#eed3ca' }} />}
                </div>
                <div className="pt-1">
                  <p className="text-xs font-extrabold" style={{ color: '#5c4651' }}>{step.title}</p>
                  <p className="mt-0.5 text-[10px] leading-4" style={{ color: '#9d878f' }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-white/70 p-3.5">
            <p className="text-[10px] leading-4" style={{ color: '#8e747e' }}>
              <strong style={{ color: '#d06179' }}>안심하세요.</strong> 연결은 언제든 해제할 수 있어요.
            </p>
          </div>
        </aside>
      </section>
      )}

      <div
        aria-live="polite"
        className={`fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all ${feedback ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        style={{ background: '#4f3d46' }}
      >
        ✓ {feedback}
      </div>

      <CoupleMatchCelebration
        show={showMatchCelebration}
        onFinish={() => setShowMatchCelebration(false)}
        myName={user?.nickname || '나'}
        partnerName={status.partner?.nickname || '상대방'}
        myPhoto={avatarSrc(user?.profileImageUrl, user?.gender)}
        partnerPhoto={avatarSrc(status.partner?.profileImageUrl, status.partner?.gender || opposite(user?.gender))}
      />
    </div>
  );
}
