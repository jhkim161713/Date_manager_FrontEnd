import { useEffect, useState } from 'react';
import { createCoupleInvite, acceptCoupleInvite, getCoupleStatus, disconnectCouple, updateMetDate, ackAdminReconnect } from '../lib/api';
import { COUPLE_SINK_COPY } from '../data/coupleSink';
import { confirm } from '../lib/confirm';

// "며칠째"는 자정 기준 날짜 차이 + 1(만난 당일을 1일째로 침) - MyPageTab의 daysSince와 동일한 계산.
function daysSince(dateStr) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  return Math.floor((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;
}

// 히어로에 "다음 n일까지 D-day"를 보여줄 마일스톤 목록. 다 지나면 다음 천 단위로 계속 이어간다.
const DAY_MILESTONES = [100, 200, 300, 500, 1000, 2000, 3000];

function nextMilestone(daysTogether) {
  const upcoming = DAY_MILESTONES.find(m => m > daysTogether);
  return upcoming ?? Math.ceil((daysTogether + 1) / 1000) * 1000;
}

// 커플 연결 상태가 바뀌면(수락/해제) 이 이벤트를 쏜다 - 홈탭/캘린더탭은 각자 마운트 시 한 번만
// coupleLinked를 조회하고 끝이라, 다른 탭이 열려있는 동안 연결 상태가 바뀌어도 반영이 안 됐다
// (2026-09-01, dm:calendar-changed와 같은 패턴). App.jsx도 파트너가 수락한 걸 알아챈 시점에
// 같이 쏜다(수락한 사람 본인 화면은 아래 loadStatus로 바로 갱신되지만, 초대를 보낸 사람 쪽은
// 그 사실을 수동적으로 알게 되는 입장이라 갱신 트리거가 없었음).
export const notifyCoupleStatusChanged = () => window.dispatchEvent(new CustomEvent('dm:couple-status-changed'));

// CoupleTab의 상태(연결 여부/파트너/만난 날짜) + 초대/수락/해제/만난날짜 저장 로직을 전부 감싼 훅
// (2026-08-24 분리). 원래 CoupleTab.jsx 하나에 다 있던 로직이라, 탭 컴포넌트는 이 훅이 돌려주는
// 값만 그대로 렌더링에 쓰면 된다.
export function useCoupleConnection(userId) {
  const [feedback, setFeedback] = useState('');
  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [status, setStatus] = useState({ loading: true, linked: false, partner: null, metDate: null });

  const loadStatus = async () => {
    try {
      const data = await getCoupleStatus();
      setStatus({
        loading: false, linked: data.linked, partner: data.partner, metDate: data.metDate,
        reconnectedByAdminAt: data.reconnectedByAdminAt,
      });
      setMetDateInput(data.metDate || '');
    } catch (error) {
      setStatus({ loading: false, linked: false, partner: null, metDate: null, reconnectedByAdminAt: null });
    }
  };

  useEffect(() => {
    loadStatus();
    // HomeTab.jsx와 동일한 이유(2026-09-02) - 이 탭이 로그인 전에 이미 마운트돼 있으면
    // (예: URL 해시로 'couple' 탭에 바로 진입) 재로그인해도 최초 마운트 시점 상태만 들고
    // 있어서 초대한 사람(A) 쪽에 새 연결 상태가 반영 안 되는 문제가 있었다.
    window.addEventListener('dm:couple-status-changed', loadStatus);
    return () => window.removeEventListener('dm:couple-status-changed', loadStatus);
  }, [userId]);

  const daysTogether = status.metDate ? daysSince(status.metDate) : null;
  const milestone = daysTogether != null ? nextMilestone(daysTogether) : null;

  // 만난 날짜
  const [metDateInput, setMetDateInput] = useState('');
  const [metDateSaving, setMetDateSaving] = useState(false);
  const [metDateError, setMetDateError] = useState('');
  const [isEditingMetDate, setIsEditingMetDate] = useState(false);

  const handleSaveMetDate = async () => {
    setMetDateError('');
    setMetDateSaving(true);
    try {
      await updateMetDate(metDateInput || null);
      setStatus(s => ({ ...s, metDate: metDateInput || null }));
      setIsEditingMetDate(false);
      showFeedback(metDateInput ? '만난 날짜를 저장했어요' : '만난 날짜를 초기화했어요');
    } catch (error) {
      setMetDateError(error.message || '저장하지 못했어요');
    } finally {
      setMetDateSaving(false);
    }
  };

  const cancelEditMetDate = () => {
    setMetDateInput(status.metDate || '');
    setMetDateError('');
    setIsEditingMetDate(false);
  };

  // 초대 링크
  const [inviteLink, setInviteLink] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
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

  // 초대 수락
  const [acceptToken, setAcceptToken] = useState('');
  const [accepting, setAccepting] = useState(false);
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
      notifyCoupleStatusChanged();
      setShowMatchCelebration(true);
    } catch (error) {
      showFeedback(error.message || '초대를 수락하지 못했어요');
    } finally {
      setAccepting(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = await confirm(
      '정말 연결을 해제하시겠어요?\n' +
      '해제하면 더 이상 파트너 정보를 볼 수 없고, 만난 날짜·연결 기간 등 함께 쌓아온 기록도 같은 상대와 다시 연결하기 전까지 보이지 않게 돼요.',
      { confirmText: '해제할게요', danger: true },
    );
    if (!ok) return;
    try {
      await disconnectCouple();
      showFeedback('연결을 해제했어요');
      await loadStatus();
      notifyCoupleStatusChanged();
    } catch (error) {
      showFeedback(error.message || '연결 해제에 실패했어요');
    }
  };

  // 관리자가 방금 "다시 연결"을 눌러준 경우에만 뜨는 배너를 확인 처리한다.
  const handleAckAdminReconnect = async () => {
    setStatus(s => ({ ...s, reconnectedByAdminAt: null }));
    try {
      await ackAdminReconnect();
    } catch {
      // 실패해도 화면에서는 이미 닫혔으니 조용히 무시(다음 새로고침 때만 다시 뜨는 정도)
    }
  };

  return {
    status, daysTogether, milestone,
    feedback, showMatchCelebration, setShowMatchCelebration,
    inviteLink, creatingInvite, makeInviteLink, copyInviteLink, shareInviteLink,
    acceptToken, setAcceptToken, accepting, handleAcceptInvite,
    handleDisconnect, handleAckAdminReconnect,
    metDateInput, setMetDateInput, metDateSaving, metDateError,
    isEditingMetDate, setIsEditingMetDate, handleSaveMetDate, cancelEditMetDate,
  };
}
