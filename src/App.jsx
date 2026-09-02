import { TABS } from './data/tabsData';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import './App.css';
import dmLogo from '@/imports/Logo.png';
import { getMe, getToken, setToken, clearToken, adminCheck, getUnreadCoupleNotifications, ackCoupleNotifications, getCoupleStatus, saveOnboardingStyle, getMyStyle, getMySubscription } from '@/lib/api';
import { CURATION_CART_STORAGE_KEY } from './data/curationData';
import { CoupleMatchCelebration } from './components/CoupleMatchCelebration';
import { ConfirmDialogHost } from './components/ConfirmDialogHost';
import { avatarSrc } from './components/Avatar';
import { HomeTab } from './tabs/HomeTab';
import { CoupleTab } from './tabs/CoupleTab';
import { MiniCalendar } from './components/MiniCalendar';
import { BuilderTab } from './tabs/BuilderTab';
import { CuriationTab } from './tabs/CurationTab';
import { CalendarTab } from './tabs/CalendarTab';
import { MyPageTab } from './tabs/MyPageTab';
import { OnboardingTab } from './tabs/Onboardingtab';
import { PERSONA_AXES } from './data/onboardingData';
import { LoginModal } from './components/LoginModal';
import { ProfileConfirmModal } from './components/ProfileConfirmModal';
import { Avatar } from './components/Avatar';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AiChatTab, resolveCoachByGender } from './tabs/AiChatTab';
import { BoardTab } from './tabs/BoardTab';
import { FinancialPlanner } from './tabs/financialPlanner';

// 6대 성향 게이지가 안드로이드 웹뷰 폭에서는 너무 빽빽하게 눌려 보여서(2026-08-25),
// 안드로이드 앱에서만 상단바에서 숨긴다. 웹/데스크톱에는 그대로 보인다.
const IS_ANDROID_APP = Capacitor.getPlatform() === 'android';

// 안드로이드 실기기 점검(2026-09-01)에서 찾은 좁은 화면 레이아웃 수정들은 전부 안드로이드
// 앱에서만 적용하기로 함 - 웹은 창을 좁혀도 예전 모습 그대로 유지해야 한다는 요청. CSS에서
// Capacitor.isNativePlatform()을 직접 못 쓰니, <html>에 클래스를 하나 붙여서 index.css의
// 전역 규칙들이 이 클래스 아래에서만 적용되게 한다(개별 컴포넌트는 IS_ANDROID_APP을 직접 사용).
if (IS_ANDROID_APP) {
  document.documentElement.classList.add('dm-android');
}

// 모바일 하단 네비게이션용 핵심 탭 (사이드바 전체 대신 자주 쓰는 것만 추림)
const MOBILE_NAV_TABS = [
  { id: 'home', label: '홈', emoji: '🏠' },
  { id: 'couple', label: '내 파트너 링크', emoji: '💞' },
  { id: 'curiation', label: '큐레이션', emoji: '🎬' },
  { id: 'calendar', label: '캘린더', emoji: '📅' },
  { id: 'mypage', label: 'MY', emoji: '👤' },
];

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('home');
  // 상시 챗봇 버튼(2026-08-22, 홈탭 전용에서 전체 탭 공통으로 확장) 최소화 여부 - 화면을
  // 가릴 수 있어서 유저가 접어두면 새로고침해도 그 상태가 유지되도록 localStorage에 저장한다.
  const [chatBubbleMinimized, setChatBubbleMinimized] = useState(
    () => localStorage.getItem('dm_chat_bubble_minimized') === '1'
  );
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [partnerNotifications, setPartnerNotifications] = useState([]);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [celebrationPartner, setCelebrationPartner] = useState(null);
  // 토스 카드등록 인증 완료 후 리다이렉트로 돌아왔는지를 최초 렌더링 시점에 동기적으로 읽어둔다.
  // useEffect 안에서 읽으면 다른 이펙트(popstate 등)의 history.replaceState 실행 순서에 따라
  // 쿼리스트링이 이미 사라진 뒤일 수 있어서, 여기서 먼저 캡처해 state로 고정시켜둔다.
  const initialBillingAuth = (() => {
    const p = new URLSearchParams(window.location.search);
    const authKey = p.get('authKey');
    const customerKey = p.get('customerKey');
    return authKey && customerKey ? { authKey, customerKey } : null;
  })();
  const [showSubscription, setShowSubscription] = useState(
    () => Boolean(initialBillingAuth) || new URLSearchParams(window.location.search).get('billingError') === '1'
  );
  const [pendingBillingAuth, setPendingBillingAuth] = useState(initialBillingAuth);
  const [personaProfile, setPersonaProfile] = useState(null);
  // 큐레이션 탭 "캘린더에 담기" -> 캘린더 탭 등록폼 프리필용(2026-08-22). object identity가
  // 매번 바뀌어야 CalendarTab의 useEffect가 매번 새로 반응하므로, 같은 장소를 연속으로 눌러도
  // 항상 새 객체를 만들어 넘긴다(호출부 참고).
  const [calendarPrefill, setCalendarPrefill] = useState(null);
  // 큐레이션 탭 "빌더로 보내기" -> 빌더 탭으로 바로 이동해서 이름짓기 모달을 자동으로 띄우기
  // 위한 1회성 신호(2026-09-01). calendarPrefill과 같은 패턴 - BuilderTab이 마운트 시 한 번
  // 소비하고 onAutoOpenConsumed로 다시 꺼준다.
  const [builderAutoOpen, setBuilderAutoOpen] = useState(false);
  // 이메일 가입 직후, 또는 소셜 가입 후 ProfileConfirmModal(성별 확정)이 끝난 직후에 띄우는
  // 필수 성향 온보딩 오버레이. 둘 다 "방금 처음 가입한 사람"만 거치는 지점이라 이 하나의
  // 플래그로 두 경로를 합쳐서 처리한다.
  const [showPostSignupOnboarding, setShowPostSignupOnboarding] = useState(false);
  // 안드로이드 전용 "☰ 메뉴" 드로어(2026-09-02) - 예전엔 HomeTab에서만 열 수 있었는데, 헤더의
  // "마이페이지" 버튼 옆으로 옮겨서 어느 탭에 있든 전체 TABS 8개 목록에 접근할 수 있게 함.
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  // 관리자 페이지(/admin)에서 "우리 홈"으로 넘어온 경우에만 상단에 "관리자 페이지" 버튼을 보여준다.
  // adminCheck()를 매번 새로 부르는 대신, /admin에서 넘어올 때만 붙는 ?admin=1 쿼리를
  // sessionStorage에 남겨서 이 탭에 머무는 동안 계속 기억하게 한다.
  const [isAdminUser] = useState(
    () => new URLSearchParams(window.location.search).get('admin') === '1' || sessionStorage.getItem('dm_admin_return') === '1'
  );
  const personaScrollerRef = useRef(null);
  const personaDragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [isPersonaDragging, setIsPersonaDragging] = useState(false);
  const [personaScrollState, setPersonaScrollState] = useState({ left: false, right: false });

  // 탭을 변경할 때 브라우저 history 상태도 함께 push
  const changeTab = (newTab, pushHistory = true) => {
    if (newTab === tab) return;
    // 성향테스트는 나중에 없어질 수도 있는 기능이라 탭 자체(nav 항목)는 그대로 두되, 누르면
    // 브라우저 기본 alert()로 "준비중입니다"만 띄우고 실제 이동은 막음. 목업 데이터로만 동작하던
    // 탭이라 TendencyTab.jsx/tendencyData.js는 삭제함(2026-08-13).
    if (newTab === 'tendency') {
      window.alert('준비중입니다');
      return;
    }
    setTab(newTab);
    if (pushHistory) {
      window.history.pushState({ tab: newTab }, '', `#${newTab}`);
    }
  };

  // 브라우저 뒤로가기/앞으로가기(popstate) 감지
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setTab(event.state.tab);
      } else {
        setTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 초기 진입 시 현재 탭 상태를 history에 등록
    if (!window.history.state) {
      window.history.replaceState({ tab: 'home' }, '', '#home');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 안 읽은 알림을 받아와서, "파트너가 초대를 수락했다"는 알림은 CoupleTab에서 수락한 쪽(B)이
  // 보는 것과 똑같은 CoupleMatchCelebration 이펙트로 보여주고(A도 같은 축하 연출을 봐야
  // "상대방이 진짜 눌렀는지" 확실히 알 수 있으므로), 나머지 알림(만난 날짜 입력 등)만
  // 텍스트 배너로 보여준다.
  const fetchPartnerNotifications = async () => {
    let list;
    try {
      list = await getUnreadCoupleNotifications();
    } catch {
      return;
    }
    const accepted = list.filter(n => n.type === 'PARTNER_ACCEPTED');
    const rest = list.filter(n => n.type !== 'PARTNER_ACCEPTED');
    setPartnerNotifications(rest);
    if (accepted.length > 0) {
      const coupleStatus = await getCoupleStatus().catch(() => null);
      setCelebrationPartner(coupleStatus?.partner || null);
      setShowMatchCelebration(true);
      // 초대를 보낸 사람(A) 쪽은 파트너가 수락한 사실을 이렇게 수동적으로 알게 되는 입장이라,
      // 홈탭/캘린더탭이 각자 들고 있는 coupleLinked도 같이 갱신되도록 알려준다(2026-09-01).
      window.dispatchEvent(new CustomEvent('dm:couple-status-changed'));
    }
  };

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const data = await getMe();
      setUser(data);
      // 로그인 세션이 살아있는 동안(새로고침 포함) personaProfile이 비어있지 않도록, 저장된
      // 성향값이 있으면 여기서 채운다(2026-08-20) - 그전까진 온보딩 화면을 그 자리에서 완료할
      // 때만 메모리에 잠깐 채워지고 새로고침하면 사라졌었다.
      getMyStyle().then((style) => { if (style) setPersonaProfile(style); }).catch(() => {});
      refreshSubscriptionStatus();
      return data;
    } catch {
      clearToken();
      setUser(null);
      return null;
    }
  }, []);

  // 좋아요/코스담기/장소열람/AI챗 언급으로 백엔드 성향값이 실시간으로 바뀌어도, personaProfile은
  // 로그인 시 한 번만 불러온 값이라 화면(상단 성향 게이지 등)엔 반영이 안 됐다(2026-08-22, 실제
  // 테스트로 확인됨 - 백엔드는 정상 갱신되는데 화면만 그대로였음). 이 신호를 트리거하는 액션이
  // 끝난 뒤 호출해서 다시 불러오게 한다.
  const refreshPersonaProfile = useCallback(() => {
    getMyStyle().then((style) => { if (style) setPersonaProfile(style); }).catch(() => {});
  }, []);

  // 상단 "구독" 칩 문구를 실제 구독 상태에 맞게 보여주기 위한 상태(2026-08-22) - 예전엔 항상
  // "구독"이라고만 떠서 이미 구독 중인지 아닌지 버튼만 봐선 알 수 없었다.
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const refreshSubscriptionStatus = useCallback(() => {
    getMySubscription().then(setSubscriptionStatus).catch(() => setSubscriptionStatus(null));
  }, []);

  // 관리자 로그인 시 이 페이지는 onAuthed()를 호출하지 않은 채(user=null인 상태로)
  // /admin으로 이동한다. 그 뒤 브라우저 뒤로가기를 누르면 bfcache가 그 당시의 user=null
  // 스냅샷을 그대로 복원해서 실제로는 로그인돼 있는데도 로그아웃된 것처럼 보인다.
  // pageshow(persisted)로 복원을 감지해서 실제 로그인 상태를 다시 확인해준다.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        loadUser();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [loadUser]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('admin') === '1') {
      sessionStorage.setItem('dm_admin_return', '1');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 안드로이드 앱에서 소셜로그인이 외부 브라우저(Custom Tabs)로 끝나면, 백엔드가
  // datemanager://oauth/callback?token=... 로 리다이렉트하고 AndroidManifest.xml의 intent-filter가
  // 그걸 받아 이 appUrlOpen 이벤트로 앱에 전달한다. 딥링크의 쿼리스트링을 그대로 앱 루트 주소에 옮겨
  // 다시 로드하면, 바로 아래 useEffect의 기존 token/error 처리 로직을 그대로 재사용할 수 있다
  // (2026-09-01 - "구글/카카오 소셜로그인 딥링크" 미해결 항목 해결).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      Browser.close().catch(() => {});
      const deepLink = new URL(url);
      window.location.href = '/' + deepLink.search;
    });
    return () => { listenerPromise.then((handle) => handle.remove()); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthError = params.get('error');

    // 토스 카드등록 콜백 파라미터는 이미 최초 렌더링 시점(initialBillingAuth)에 state로 캡처해뒀으니
    // 여기서는 주소창만 깔끔하게 정리한다.
    if (params.get('authKey') || params.get('billingError')) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    (async () => {
      if (oauthToken) {
        setToken(oauthToken);
        window.history.replaceState({}, '', window.location.pathname);
        // 소셜 로그인으로 들어온 계정이 관리자 계정이면 메인 앱 대신 관리자 페이지로 이동.
        // replace를 쓰는 이유는 LoginModal의 관리자 리다이렉트와 동일 - href로 남겨두면
        // 뒤로가기 시 로그인 전 스냅샷이 되살아나 로그아웃된 것처럼 보이는 문제가 생긴다.
        const { isAdmin } = await adminCheck().catch(() => ({ isAdmin: false }));
        if (isAdmin) {
          window.location.replace('/admin');
          return;
        }
      }
      if (oauthError) {
        setAuthError(oauthError);
        setShowLogin(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
      const loadedUser = await loadUser();
      setAuthChecked(true);

      // 로그인 직후 - 내가 없는 사이 파트너가 초대를 수락했거나 만난 날짜를 입력했으면
      // 안 읽은 알림을 받아와 배너로 보여준다.
      if (loadedUser) {
        fetchPartnerNotifications();
      }
    })();
  }, [loadUser]);

  // 안드로이드 소셜로그인 딥링크 수신(2026-09-01) - 구글/카카오 로그인이 시스템 브라우저에서
  // 끝나면 백엔드가 datemanager://oauth/callback?token=...으로 리다이렉트하고, 안드로이드가
  // AndroidManifest.xml의 인텐트 필터를 보고 이 앱을 다시 연다. 그때 Capacitor가 이 이벤트를
  // 쏴준다. 웹뷰의 window.location은 안 바뀐 상태라 위쪽 token 읽기 로직(라인 208)이 저절로
  // 실행되지 않으므로, token을 쿼리스트링에 실어 같은 페이지로 다시 이동시켜서(전체 새로고침)
  // 그 로직을 그대로 재사용한다 - 로직을 중복 구현하지 않기 위함.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token');
        const error = parsed.searchParams.get('error');
        if (token) {
          window.location.href = `${window.location.pathname}?token=${encodeURIComponent(token)}`;
        } else if (error) {
          window.location.href = `${window.location.pathname}?error=${encodeURIComponent(error)}`;
        }
      } catch (e) {
        console.error('딥링크 처리 실패:', e);
      }
    });
    return () => { listenerPromise.then((listener) => listener.remove()); };
  }, []);

  // 로그인 직후 1회 조회만으로는, 이미 앱을 켜둔 채로 기다리고 있는 사용자(예: A가 초대
  // 링크를 만들어놓고 그 탭을 계속 보고 있는 상태에서 B가 수락)에게는 새로고침 전까지
  // 알림이 절대 뜨지 않는 문제가 있었다. 탭이 다시 활성화될 때(다른 탭/앱을 보다가 돌아왔을 때)
  // 마다 재조회해서, 새로고침 없이도 안 읽은 알림을 받아볼 수 있게 한다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && getToken()) {
        fetchPartnerNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAckPartnerNotifications = () => {
    setPartnerNotifications([]);
    ackCoupleNotifications().catch(() => {});
  };

  const handleMatchCelebrationFinish = () => {
    setShowMatchCelebration(false);
    setCelebrationPartner(null);
    ackCoupleNotifications().catch(() => {});
  };

  const handleLogout = () => {
    clearToken();
    // 큐레이션 담기함(2026-08-20)은 계정 구분 없이 브라우저에 남는 임시 상태라, 로그아웃 시점에는
    // 지워서 다음 사람(같은 브라우저로 다른 계정 로그인)에게 이전 사용자의 담기함이 새지 않게 한다.
    localStorage.removeItem(CURATION_CART_STORAGE_KEY);
    // AI 챗봇의 "마지막 세션" 포인터(AiChatTab.jsx의 storageKey)도 로그아웃 시점엔 지운다 -
    // 이걸 안 지우면 다시 로그인했을 때 지난 대화가 화면에 자동으로 이어져서 뜨는데, 젬미나이처럼
    // "로그인 직후엔 항상 새 대화로 시작하고, 지난 대화는 별도 목록에서 골라서 보게" 하고 싶다는
    // 요청(2026-08-22)에 따라 로그아웃마다 초기화한다. 대화 자체는 DB에 남아있어서 안 사라지고,
    // "지난 대화 보기" 목록(GET /api/aichat/sessions)에서 언제든 다시 찾아 이어갈 수 있다.
    if (user?.id) localStorage.removeItem(`dm_ai_chat_session_id:${user.id}`);
    setUser(null);
    // 로그아웃 시점에 마이페이지/커플탭처럼 user를 전제로 하는 탭에 그대로 남아있으면
    // user=null 상태로 그 탭이 렌더링되며 오류가 날 수 있어, 누구나 볼 수 있는 홈탭으로 보낸다.
    changeTab('home', false);
  };

  const displayName = user?.nickname || user?.email || '';
  const chatBubbleCoach = resolveCoachByGender(user?.gender);

  const updatePersonaScrollState = useCallback(() => {
    const scroller = personaScrollerRef.current;
    if (!scroller) return;

    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    setPersonaScrollState({
      left: scroller.scrollLeft > 2,
      right: scroller.scrollLeft < maxScrollLeft - 2,
    });
  }, []);

  useEffect(() => {
    const scroller = personaScrollerRef.current;
    if (!scroller) return undefined;

    const handleScroll = () => updatePersonaScrollState();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updatePersonaScrollState)
      : null;

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver?.observe(scroller);
    updatePersonaScrollState();

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
    };
  }, [updatePersonaScrollState]);

  const scrollPersonaAxes = (direction) => {
    const scroller = personaScrollerRef.current;
    if (!scroller) return;

    const distance = Math.max(170, Math.round(scroller.clientWidth * 0.62));
    scroller.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  const handlePersonaPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const scroller = personaScrollerRef.current;
    if (!scroller) return;

    personaDragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture?.(event.pointerId);
    setIsPersonaDragging(true);
  };

  const handlePersonaPointerMove = (event) => {
    const drag = personaDragRef.current;
    const scroller = personaScrollerRef.current;
    if (!drag.active || !scroller) return;

    scroller.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX);
  };

  const stopPersonaDrag = (event) => {
    if (!personaDragRef.current.active) return;

    personaDragRef.current.active = false;
    const scroller = personaScrollerRef.current;
    if (scroller?.hasPointerCapture?.(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    setIsPersonaDragging(false);
    updatePersonaScrollState();
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fff8f4', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Sidebar (데스크톱 전용, 모바일에서는 하단 네비로 대체) ── */}
      <aside className="hidden md:flex flex-col h-screen flex-shrink-0 overflow-y-auto" style={{ width: '210px', background: 'white', borderRight: '1.5px solid #ffd6e0' }}>
        {/* Logo (클릭 시 홈으로 이동) */}
        <div 
          onClick={() => changeTab('home')}
          className="flex flex-col items-center px-4 pt-5 pb-3 cursor-pointer transition-transform hover:scale-105" 
          style={{ borderBottom: '1.5px solid #ffd6e0' }}
          title="홈으로 이동"
        >
          <img src={dmLogo} alt="DM Date Manager 로고" className="w-32 h-32 object-contain" />
          <p className="text-xs text-stone-400 mt-0.5" style={{ fontStyle: 'italic' }}>Date Manager for us</p>
        </div>

        {/* Mini Calendar */}
        <MiniCalendar loggedIn={authChecked && !!user} />

        {/* Divider */}
        <div className="mx-3 mb-2" style={{ borderTop: '1.5px solid #ffd6e0' }} />

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => {
              if (t.id !== 'home' && !user) {
                alert('로그인 후 이용 가능합니다! 🌸');
                setShowLogin(true);
                return;
              }
              changeTab(t.id);
            }}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-left transition-all hover:scale-[1.02]"
              style={{
                background: tab === t.id ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'transparent',
                color: tab === t.id ? 'white' : '#3d2c35',
                boxShadow: tab === t.id ? '0 4px 12px rgba(255,107,138,0.25)' : undefined,
              }}>
              <span className="text-base">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <p className="text-center text-xs pb-4 pt-2" style={{ color: '#e8b4c0' }}>made with 💖</p>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar - 좌우 여백은 App.css의 .app-topbar에서 직접 관리(실측 기준, 2026-08-13) */}
        <header className="app-topbar">

          {/* ── 6대 성향 게이지 (PERSONA_AXES 동적 바인딩) ── */}
          {/* 비로그인 상태에서는 의미 없는 중립값(50점)만 보여서 내용은 숨기지만, 이 div의
              flex:1이 로그인 버튼을 오른쪽으로 밀어내는 역할도 하고 있어 div 자체는 남겨둔다. */}
          {!user || IS_ANDROID_APP ? (
            <div className="app-persona-row" />
          ) : (
          <div className="app-persona-row">
            <div className="app-persona-slider">
              {/* 화면이 넓어서 6개 카드가 다 보이면(스크롤할 게 없으면) 화살표를 아예 안 그림 -
                  예전엔 disabled로 흐리게만 처리해서, 큰 화면에서도 쓸모없는 작은 화살표가 계속
                  왼쪽 기준점처럼 남아있어 다른 요소와 정렬이 어긋나 보이는 원인이 됐었음(2026-08-13). */}
              {personaScrollState.left && (
                <button
                  type="button"
                  className="app-persona-arrow"
                  onClick={() => scrollPersonaAxes(-1)}
                  aria-label="이전 성향 보기"
                >
                  ‹
                </button>
              )}

              <div
                ref={personaScrollerRef}
                className={`app-persona-track ${isPersonaDragging ? 'is-dragging' : ''}`}
                onPointerDown={handlePersonaPointerDown}
                onPointerMove={handlePersonaPointerMove}
                onPointerUp={stopPersonaDrag}
                onPointerCancel={stopPersonaDrag}
                onDragStart={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') scrollPersonaAxes(-1);
                  if (event.key === 'ArrowRight') scrollPersonaAxes(1);
                }}
                tabIndex={0}
                aria-label="6대 성향 게이지. 좌우로 드래그하거나 화살표 키로 이동할 수 있습니다."
              >
                {PERSONA_AXES.map(({ id, koreanLabel, lowLabel, highLabel, color }) => {
                  const score = personaProfile?.scores?.[id] ?? 50;

                  return (
                    <div
                      key={id}
                      className="app-persona-axis flex flex-col gap-0.5 rounded-xl px-2.5 py-1.5"
                      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[9px] font-bold" style={{ color }}>{koreanLabel}</span>
                        <span className="text-[9px] font-bold text-stone-400">{score}</span>
                      </div>
                      <div className="relative h-1.5 rounded-full" style={{ background: `${color}20` }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all"
                          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
                        />
                        <div
                          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                          style={{ left: `calc(${score}% - 5px)`, background: color }}
                        />
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="truncate text-[8px] text-stone-400">{lowLabel}</span>
                        <span className="truncate text-right text-[8px] text-stone-400">{highLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {personaScrollState.right && (
                <button
                  type="button"
                  className="app-persona-arrow"
                  onClick={() => scrollPersonaAxes(1)}
                  aria-label="다음 성향 보기"
                >
                  ›
                </button>
              )}
            </div>
          </div>
          )}

          {/* ── Login / Profile ── */}
          <div className="app-profile-actions">
            {!authChecked ? null : user ? (
              <>
                {isAdminUser && (
                  <a href="/admin"
                    className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                    style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
                    🛠️ <span className="app-profile-secondary-label">관리자 페이지</span>
                  </a>
                )}
                <button onClick={() => changeTab('mypage')}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
                  ⚙️ <span className="app-profile-secondary-label">마이페이지</span>
                </button>
                {IS_ANDROID_APP && (
                  <button onClick={() => setShowMobileDrawer(true)}
                    className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                    style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
                    ☰ <span className="app-profile-secondary-label">메뉴</span>
                  </button>
                )}
                <button onClick={() => setShowSubscription(true)}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:bg-stone-100"
                  style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
                  💳 <span className="app-profile-secondary-label">
                    {subscriptionStatus?.id != null && subscriptionStatus?.status === 'ACTIVE' ? '구독중' : '구독하기'}
                  </span>
                </button>
                <div className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5"
                  style={{ background: '#fff0f3', border: '1.5px solid #ffd6e0' }}>
                  <Avatar profileImageUrl={user.profileImageUrl} gender={user.gender} size={22} />
                  <span className="app-profile-name text-sm font-bold" style={{ color: '#3d2c35' }}>{displayName}</span>
                  <span className="text-xs text-stone-400">님</span>
                </div>
                <button onClick={handleLogout}
                  className="rounded-2xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{ border: '1.5px solid #ffd6e0', color: '#bbb', background: 'white' }}>
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 rounded-2xl px-4 py-1.5 text-xs font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 14px rgba(255,107,138,0.3)' }}>
                <span>💕</span><span>로그인</span>
              </button>
            )}
          </div>
        </header>

        {/* 파트너 액션 알림 - 로그인 직후 또는 탭이 다시 활성화될 때, 안 읽은 알림이 있을 때만
            뜨는 전역 배너. 특정 탭 안이 아니라 여기(App.jsx)에 두는 이유는 사용자가 어느 탭으로
            들어오든 알림을 받아볼 수 있어야 하기 때문이다. */}
        {partnerNotifications.length > 0 && (
          <div className="mx-4 mt-3 rounded-2xl px-4 py-3 md:mx-8" style={{ background: '#fff0f3', border: '1.5px solid #ffd6e0' }}>
            {partnerNotifications.map(n => (
              <p key={n.id} className="text-[11px] font-bold" style={{ color: '#e8486b' }}>💌 {n.message}</p>
            ))}
            <button type="button" onClick={handleAckPartnerNotifications}
              className="mt-2 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ background: 'white', color: '#e8486b', border: '1.5px solid #ffd6e0' }}>
              확인했어요
            </button>
          </div>
        )}

        {/* 파트너가 내 초대를 수락했을 때 - CoupleTab에서 수락한 쪽(B)이 그 자리에서 보는 것과
            동일한 축하 이펙트를 초대한 쪽(A)도 다음 로그인/탭 재활성화 시 똑같이 보게 한다. */}
        <CoupleMatchCelebration
          show={showMatchCelebration}
          onFinish={handleMatchCelebrationFinish}
          myName={user?.nickname || '나'}
          partnerName={celebrationPartner?.nickname || '상대방'}
          myPhoto={avatarSrc(user?.profileImageUrl, user?.gender)}
          partnerPhoto={avatarSrc(celebrationPartner?.profileImageUrl, celebrationPartner?.gender)}
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 md:px-8 py-4 md:py-7 pb-24 md:pb-16">
            {tab !== 'home' && !user ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-3">🔒</span>
                <h2 className="font-bold text-xl text-[#3d2c35]">로그인이 필요한 서비스입니다</h2>
                <p className="text-sm text-stone-400 mt-1 mb-6">로그인하고 모든 기능을 이용해 보세요!</p>
                <button onClick={() => setShowLogin(true)}
                  className="rounded-2xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 14px rgba(255,107,138,0.3)' }}>
                  로그인하기
                </button>
              </div>
            ) : (
              <>
                {tab === 'home' && <HomeTab user={user} onTabChange={changeTab} personaProfile={personaProfile} onStyleChanged={refreshPersonaProfile} />}
                {tab === 'couple' && <CoupleTab user={user} onTabChange={changeTab} personaProfile={personaProfile} />}
                {tab === 'curiation' && (
                  <CuriationTab user={user} personaProfile={personaProfile} onStyleChanged={refreshPersonaProfile}
                    onAddToCalendar={(item) => { setCalendarPrefill(item); changeTab('calendar'); }}
                    onOpenBuilder={() => { setBuilderAutoOpen(true); changeTab('builder'); }} />
                )}
                {tab === 'builder' && (
                  <BuilderTab autoOpenNaming={builderAutoOpen} onAutoOpenConsumed={() => setBuilderAutoOpen(false)} />
                )}
                {tab === 'calendar' && (
                  <CalendarTab user={user} prefill={calendarPrefill} onPrefillConsumed={() => setCalendarPrefill(null)} />
                )}
                {tab === 'aichat' && <AiChatTab user={user} personaProfile={personaProfile} onStyleChanged={refreshPersonaProfile} />}
                {tab === 'financialPlanner' && <FinancialPlanner />}
                {tab === 'board' && <BoardTab user={user} />}
                {tab === 'mypage' && (
                  <MyPageTab onUpdated={loadUser} onTabChange={changeTab}
                    onWithdrawn={() => { handleLogout(); changeTab('home', false); }} />
                )}
              </>
            )}
          </div>
        </main>

        {/* 상시 챗봇 버튼(2026-08-22, 기획안 "메인 화면 챗봇 버튼: 상시 배치" 대응 - 홈탭 전용에서
            전체 탭 공통으로 확장) - 이미 AI 상담 탭에 있을 땐 의미가 없어서 숨긴다. 화면을 가릴 수
            있다는 피드백이 있어 접기(×) 기능도 뒀고, 그 상태는 새로고침해도 유지된다. */}
        {user && tab !== 'aichat' && tab !== 'financialPlanner' && tab !== 'calendar' && (
          chatBubbleMinimized ? (
            <button type="button"
              onClick={() => { setChatBubbleMinimized(false); localStorage.removeItem('dm_chat_bubble_minimized'); }}
              aria-label="AI 데이트 상담 버튼 다시 보기"
              className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 h-9 w-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-110"
              style={{ background: chatBubbleCoach.gradient, boxShadow: `0 6px 16px ${chatBubbleCoach.accent}55` }}>
              💬
            </button>
          ) : (
            <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-1.5">
              <button type="button" onClick={() => changeTab('aichat')}
                aria-label={`${chatBubbleCoach.name}에게 데이트 상담하기`}
                className="flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 transition-all hover:scale-105"
                style={{ background: chatBubbleCoach.gradient, boxShadow: `0 10px 24px ${chatBubbleCoach.accent}55` }}>
                <img src={chatBubbleCoach.image} alt="" aria-hidden="true"
                  className="h-10 w-10 rounded-full object-cover border-2 border-white" />
                <span className="text-xs font-bold text-white whitespace-nowrap">{chatBubbleCoach.name}에게 물어보기</span>
              </button>
              <button type="button"
                onClick={() => { setChatBubbleMinimized(true); localStorage.setItem('dm_chat_bubble_minimized', '1'); }}
                aria-label="AI 데이트 상담 버튼 접기"
                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'white', color: '#a89aa0', border: '1.5px solid #ffd6e0' }}>
                ×
              </button>
            </div>
          )
        )}

        {/* ── 모바일 하단 네비게이션 (데스크톱에서는 숨김) ── */}
        <nav className="flex md:hidden flex-shrink-0 items-center justify-around px-1 pt-1.5 pb-1"
          style={{ background: 'white', borderTop: '1.5px solid #ffd6e0' }}>
          {MOBILE_NAV_TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => {
                if (t.id !== 'home' && !user) {
                  alert('로그인 후 이용 가능합니다! 🌸');
                  setShowLogin(true);
                  return;
                }
                changeTab(t.id);
              }}
                className={`flex flex-col items-center gap-0.5 py-1 transition-all ${IS_ANDROID_APP ? 'flex-1' : ''}`}
                style={IS_ANDROID_APP ? undefined : { minWidth: '56px' }}>
                <span className="text-lg" style={{ opacity: active ? 1 : 0.55 }}>{t.emoji}</span>
                <span className="text-[10px] font-bold" style={{ color: active ? '#ff6b8a' : '#bbb' }}>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 안드로이드 전용 메뉴 드로어(2026-09-02) - 헤더 "마이페이지" 옆 "☰ 메뉴" 버튼을 누르면
          TABS 8개 전체 목록을 왼쪽에서 슬라이드로 보여준다(하단 네비 5개엔 없는 빌더/AI상담/
          자금플래너/게시판도 여기서 접근). 배경 탭하면 닫힘. */}
      {IS_ANDROID_APP && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${showMobileDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowMobileDrawer(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`h-full flex flex-col overflow-y-auto transition-transform duration-300 ${showMobileDrawer ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ width: '210px', background: 'white', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center justify-between px-4 pt-5 pb-3" style={{ borderBottom: '1.5px solid #ffd6e0' }}>
              <span className="font-display font-bold text-sm" style={{ color: '#3d2c35' }}>메뉴</span>
              <button type="button" onClick={() => setShowMobileDrawer(false)} className="text-lg leading-none" style={{ color: '#b9a7ae' }}>✕</button>
            </div>
            <nav className="flex flex-col gap-1 px-3 py-3">
              {TABS.map(t => (
                <button key={t.id} onClick={() => { changeTab(t.id); setShowMobileDrawer(false); }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-left transition-all"
                  style={{ color: '#3d2c35' }}>
                  <span className="text-base">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <ConfirmDialogHost />

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => { setShowLogin(false); setAuthError(null); }}
          onAuthed={() => {
            // 앱을 콜드 스타트할 때만 fetchPartnerNotifications()가 불려서, 로그인 모달로 로그아웃
            // 후 재로그인하는 경로(앱을 안 껐다 켠 경우)에서는 "파트너가 수락했어요" 축하 효과가
            // 영원히 안 떴다(2026-09-02 발견) - 여기서도 같이 호출해서 콜드 스타트와 동일하게 만든다.
            loadUser().then((loadedUser) => { if (loadedUser) fetchPartnerNotifications(); });
            changeTab('home', false);
          }}
          onSignupComplete={() => { setShowLogin(false); setAuthError(null); setShowPostSignupOnboarding(true); }}
          initialError={authError}
        />
      )}

      {/* 소셜 로그인으로 막 가입해서 성별이 아직 없는 경우, 닉네임 확인 + 성별 확정을 먼저 받음.
          이 모달은 최초 가입자한테만 뜨므로(성별이 이미 있으면 안 뜸), 완료 시점이 곧 "방금 소셜로
          가입 완료"인 시점이라 여기서 바로 이어서 성향 온보딩을 띄운다. */}
      {authChecked && user && user.gender === 'UNKNOWN' && (
        <ProfileConfirmModal user={user} onDone={(updated) => { setUser(updated); setShowPostSignupOnboarding(true); }} />
      )}

      {/* 가입 직후 필수 성향 온보딩. 전체 화면을 덮어서 건너뛸 수 없게 한다(OnboardingTab에 skippable=false). */}
      {showPostSignupOnboarding && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-white">
          <OnboardingTab
            skippable={false}
            onComplete={async (profile) => {
              await saveOnboardingStyle(profile);
              setPersonaProfile(profile);
              setShowPostSignupOnboarding(false);
            }}
          />
        </div>
      )}

      {showSubscription && user && (
        <SubscriptionModal
          user={user}
          pendingBillingAuth={pendingBillingAuth}
          onClose={() => { setShowSubscription(false); setPendingBillingAuth(null); refreshSubscriptionStatus(); }}
        />
      )}
    </div>
  );
}
