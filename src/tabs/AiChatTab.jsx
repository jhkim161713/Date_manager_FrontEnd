import { useEffect, useMemo, useRef, useState } from 'react';
import { createAiChatSession, getAiChatMessages, getAiChatSessions, sendAiChatMessage } from '@/lib/api';
import { getCurrentLocation } from '../lib/weather';
import { SectionTitle } from '../components/SectionTitle';
import doyoonImage from '@/imports/AiCoachDoyoon.png';
import seoyeonImage from '@/imports/AiCoachSeoyeon.png';

const COACHES = {
  DOYOON: {
    type: 'DOYOON',
    name: '도윤 코치',
    image: doyoonImage,
    userLabel: '여성 사용자',
    accent: '#f0645f',
    accentStrong: '#e6535c',
    accentSecondary: '#9c7de8',
    background: '#fff9f7',
    panel: '#fffdfc',
    border: '#f3d2cb',
    assistantBubble: '#fff1ed',
    inputBackground: '#fffaf8',
    text: '#3d2c35',
    muted: '#9a858b',
    gradient: 'linear-gradient(135deg, #f36f67 0%, #a789ea 100%)',
    glow: 'radial-gradient(circle at 48% 46%, rgba(255, 184, 150, 0.42) 0%, rgba(211, 171, 239, 0.28) 42%, rgba(255,255,255,0) 72%)',
    shadow: '0 18px 50px rgba(145, 91, 103, 0.12)',
    intro: '데이트든 고민이든 나만 믿고 편하게 얘기해봐.',
  },
  SEOYEON: {
    type: 'SEOYEON',
    name: '서연 코치',
    image: seoyeonImage,
    userLabel: '남성·기본 사용자',
    accent: '#167ab9',
    accentStrong: '#126ca9',
    accentSecondary: '#2aa79f',
    background: '#f5f9fd',
    panel: '#fcfeff',
    border: '#cfe2f2',
    assistantBubble: '#edf5fb',
    inputBackground: '#f9fcff',
    text: '#24364b',
    muted: '#8191a4',
    gradient: 'linear-gradient(135deg, #2aa79f 0%, #167ac1 100%)',
    glow: 'radial-gradient(circle at 50% 46%, rgba(111, 213, 211, 0.35) 0%, rgba(124, 183, 233, 0.24) 44%, rgba(255,255,255,0) 72%)',
    shadow: '0 18px 50px rgba(53, 101, 139, 0.12)',
    intro: '네 얘기 다 들어줄게, 데이트든 고민이든 편하게 얘기해줘.',
  },
};

// 성향값이 아예 없을 때(온보딩 전이거나 API 실패) 쓰는 기본 질문 - 예전부터 쓰던 고정 3개.
const DEFAULT_SUGGESTIONS = [
  '첫 데이트, 어디가 좋을까요?',
  '상대의 마음을 어떻게 알 수 있죠?',
  '연애 관계를 오래 유지하는 비결은?',
];

// 유저 성향 축(personaProfile.scores, App.jsx의 getMyStyle 참고)별로 점수가 50에서 많이 벗어날수록
// (=그 축 취향이 뚜렷할수록) 그 방향에 맞는 질문을 우선 보여준다 - 온보딩 결과를 실제로 활용하는
// 첫 지점(2026-08-22 추가). API 호출 없이 순수 조건문이라 가볍다.
const AXIS_QUESTION_POOL = {
  energetic: { high: '오늘 활동적인 데이트 코스 추천해줘', low: '조용하고 여유로운 데이트 장소 있을까?' },
  immersion: { high: '같이 몰입할 수 있는 체험형 데이트 뭐가 있을까?', low: '가볍게 즐길 수 있는 데이트 알려줘' },
  vibe: { high: '요즘 핫한 트렌디한 곳 어디야?', low: '편안하고 익숙한 분위기 장소 추천해줘' },
  aesthetic: { high: '감성 넘치는 예쁜 공간 알려줄래?', low: '꾸밈없이 편한 곳으로 추천해줘' },
  pacing: { high: '즉흥적으로 오늘 갈만한 데이트 어디 있어?', low: '다음 데이트 미리 계획 세우는 거 도와줄래?' },
  depth: { high: '이야기 나눌 거리 많은 곳 있을까?', low: '부담 없이 가볍게 즐길 데이트 뭐가 좋을까?' },
};

function buildPersonaSuggestions(scores) {
  const entries = Object.entries(scores ?? {}).filter(([, value]) => value != null);
  if (entries.length === 0) return DEFAULT_SUGGESTIONS;

  const ranked = entries
    .map(([axis, value]) => ({ axis, value, distinctiveness: Math.abs(value - 50) }))
    .sort((a, b) => b.distinctiveness - a.distinctiveness)
    .slice(0, 3);

  const picks = ranked
    .map(({ axis, value }) => {
      const pool = AXIS_QUESTION_POOL[axis];
      return pool ? (value >= 50 ? pool.high : pool.low) : null;
    })
    .filter(Boolean);

  // 성향값이 3개 미만이면(온보딩 일부만 완료 등) 남는 자리는 기본 질문으로 채운다.
  let i = 0;
  while (picks.length < 3 && i < DEFAULT_SUGGESTIONS.length) {
    if (!picks.includes(DEFAULT_SUGGESTIONS[i])) picks.push(DEFAULT_SUGGESTIONS[i]);
    i += 1;
  }
  return picks;
}

function normalizeGender(gender) {
  return typeof gender === 'string' ? gender.trim().toUpperCase() : 'UNKNOWN';
}

// 홈탭의 상시 챗봇 버튼(2026-08-22 추가)도 같은 코치 사진/이름을 써야 해서 export한다.
export function resolveCoachByGender(gender) {
  return normalizeGender(gender) === 'FEMALE' ? COACHES.DOYOON : COACHES.SEOYEON;
}

function createMockHistory(coach) {
  const now = Date.now();

  return [
    {
      messageId: 'mock-ai-welcome',
      senderType: 'AI',
      messageText: `안녕하세요! 저는 ${coach.name}예요.\n연애와 데이트에 대해 무엇이든 편하게 물어보세요.`,
      createdAt: new Date(now - 4 * 60_000).toISOString(),
    },
    {
      messageId: 'mock-user-question',
      senderType: 'USER',
      messageText: '첫 데이트에서 어떤 주제로 대화하면 좋을까요?',
      createdAt: new Date(now - 3 * 60_000).toISOString(),
    },
    {
      messageId: 'mock-ai-answer',
      senderType: 'AI',
      messageText: '상대의 관심사나 일상에 대해 가볍게 물어보는 것이 좋아요. 최근에 본 영화나 좋아하는 음악처럼 편안한 주제로 시작해 보세요.',
      createdAt: new Date(now - 2 * 60_000).toISOString(),
    },
  ];
}

function createMockReply(text, coach) {
  if (/첫 데이트|장소|어디/.test(text)) {
    return '처음에는 대화가 잘 들리는 조용한 카페나 가볍게 걸을 수 있는 장소가 좋아요. 서로에게 집중할 수 있고, 어색하면 자연스럽게 주변 이야기를 꺼낼 수도 있거든요.';
  }
  if (/마음|관심|호감/.test(text)) {
    return '말보다 꾸준한 행동을 살펴보세요. 먼저 연락하는지, 나와 했던 이야기를 기억하는지, 다음 약속을 구체적으로 잡는지가 좋은 단서가 될 수 있어요.';
  }
  if (/오래|관계|비결/.test(text)) {
    return '서로 다른 점을 고치려 하기보다 이해하려는 태도가 중요해요. 서운함은 작을 때 말하고, 고마운 일은 익숙해져도 자주 표현해 보세요.';
  }
  return `${coach.name}가 함께 정리해볼게요. 지금 가장 고민되는 상황과 상대방의 반응을 조금만 더 자세히 알려주실래요?`;
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function CoachAvatar({ coach, size = 40 }) {
  return (
    <span
      className="inline-flex flex-none items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size, border: `1px solid ${coach.border}` }}
      aria-hidden="true"
    >
      <img
        src={coach.image}
        alt=""
        className="h-full w-full object-cover"
        style={{ objectPosition: coach.type === 'DOYOON' ? '50% 16%' : '50% 17%' }}
      />
    </span>
  );
}

export function AiChatTab({ user, personaProfile }) {
  const coach = resolveCoachByGender(user?.gender);
  const isMockUser = typeof user?.id !== 'number';
  const storageKey = `dm_ai_chat_session_id:${user?.id ?? 'preview'}`;
  const personaSuggestions = useMemo(
    () => buildPersonaSuggestions(personaProfile?.scores),
    [personaProfile]
  );

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const mockReplyTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoadingHistory(true);
      setError(null);
      setMessages([]);

      if (isMockUser) {
        setSessionId(`mock-${user?.id ?? coach.type}`);
        setMessages(createMockHistory(coach));
        setLoadingHistory(false);
        return;
      }

      // 예전엔 저장된 세션이 없으면 탭을 열자마자 새 세션을 바로 만들어버렸는데, 그러면 메시지를
      // 한 글자도 안 쳐도 빈 세션이 DB에 남아서 "지난 대화 보기" 목록이 빈 제목투성이가 됐다
      // (2026-08-22 발견). 이제는 저장된 세션이 있을 때만 그 이력을 불러오고, 없으면 sessionId를
      // null로 둔 채 기다린다 - 실제 세션 생성은 sendText()에서 사용자가 첫 메시지를 보낼 때
      // 그제서야 일어난다.
      const savedId = localStorage.getItem(storageKey);
      try {
        if (savedId) {
          const history = await getAiChatMessages(savedId);
          if (!cancelled) {
            setSessionId(savedId);
            setMessages(history);
          }
        } else if (!cancelled) {
          setSessionId(null);
          setMessages([]);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [coach.type, isMockUser, storageKey, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending]);

  useEffect(() => () => {
    if (mockReplyTimerRef.current) window.clearTimeout(mockReplyTimerRef.current);
  }, []);

  // "지난 대화 보기" 목록을 연다 - 로그아웃하면 localStorage의 마지막 세션 포인터를 지우기로 했으니
  // (App.jsx handleLogout 참고), 다시 로그인했을 때 예전 대화로 돌아가려면 이 목록에서 직접 골라야 한다.
  const loadHistoryPage = async (page) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getAiChatSessions({ page });
      setHistoryList(data.content);
      setHistoryTotalPages(data.totalPages || 1);
      setHistoryPage(page);
    } catch (requestError) {
      setHistoryError(requestError.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = () => {
    setShowHistory(true);
    loadHistoryPage(1);
  };

  // 목록에서 지난 대화 하나를 골라 이어서 본다 - 이 세션을 다시 "마지막 세션"으로 저장해둬서,
  // 로그아웃 전까지는 이 대화가 계속 이어진다(같은 로그인 세션 안에서는 자동 재개 그대로 유지).
  const resumeSession = async (session) => {
    setShowHistory(false);
    setLoadingHistory(true);
    setError(null);
    try {
      const history = await getAiChatMessages(session.sessionId);
      setSessionId(session.sessionId);
      setMessages(history);
      localStorage.setItem(storageKey, session.sessionId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 추천 질문을 눌렀을 때는 입력창에 채워주기만 해서 다시 엔터를 눌러야 했던 문제(2026-08-22
  // 발견) - handleSend의 전송 로직을 텍스트를 인자로 받는 함수로 분리해서, 추천 질문 클릭 시
  // 입력창을 거치지 않고 바로 전송되게 한다.
  const handleSend = async (event) => {
    event.preventDefault();
    await sendText(input);
  };

  const chooseSuggestion = (question) => {
    sendText(question);
  };

  const sendText = async (rawText) => {
    const text = rawText.trim();
    if (!text || sending) return;
    if (!isMockUser && !sessionId && loadingHistory) return; // 세션 유무를 아직 확인 중이면 잠깐 대기

    setSending(true);
    setError(null);

    // 세션을 아직 안 만든 상태(탭만 열고 첫 메시지를 지금 보내는 경우)면 이 시점에 딱 하나만
    // 만든다 - 예전엔 탭을 열자마자 만들어서 메시지 없는 빈 세션이 쌓였었다(2026-08-22 수정).
    let activeSessionId = sessionId;
    if (!isMockUser && !activeSessionId) {
      try {
        const session = await createAiChatSession(`${coach.name} 데이트 상담`);
        activeSessionId = session.sessionId;
        localStorage.setItem(storageKey, activeSessionId);
        setSessionId(activeSessionId);
      } catch (requestError) {
        setError(requestError.message);
        setSending(false);
        return;
      }
    }

    const optimisticUser = {
      messageId: `local-${Date.now()}`,
      senderType: 'USER',
      messageText: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((previous) => [...previous, optimisticUser]);
    setInput('');

    if (isMockUser) {
      mockReplyTimerRef.current = window.setTimeout(() => {
        setMessages((previous) => [
          ...previous,
          {
            messageId: `mock-ai-${Date.now()}`,
            senderType: 'AI',
            messageText: createMockReply(text, coach),
            createdAt: new Date().toISOString(),
          },
        ]);
        setSending(false);
      }, 650);
      return;
    }

    try {
      const { lat, lon } = await getCurrentLocation();
      const aiMessage = await sendAiChatMessage(activeSessionId, text, { lat, lon });
      setMessages((previous) => [...previous, aiMessage]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  // 대화 시작 전엔 성향 기반 초기 질문(personaSuggestions), 시작 후엔 방금 받은 AI 응답에 실려온
  // 후속 질문으로 바뀐다(백엔드 requestFollowUpQuestions, 2026-08-22). 옛 대화를 다시 불러왔을 때는
  // 후속 질문을 새로 안 만들어서(getMessages는 항상 null) 목록이 자연히 사라진다.
  // 목업 미리보기는 실제 백엔드 호출이 없어 후속 질문을 만들 수 없으니, 항상 성향 기반 초기
  // 질문으로 고정해서 예전처럼 추천 질문 패널이 계속 보이게 한다.
  const lastAiMessage = [...messages].reverse().find((m) => m.senderType === 'AI');
  const currentSuggestions = isMockUser || messages.length === 0
    ? personaSuggestions
    : (lastAiMessage?.followUpQuestions?.length ? lastAiMessage.followUpQuestions : null);

  return (
    <section className="flex w-full flex-col gap-4" style={{ color: coach.text }}>
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <SectionTitle sub="성향에 맞는 데이트와 관계 고민을 AI 코치에게 물어보세요">
          🤖 AI 데이트 상담
        </SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          {isMockUser && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold" style={{ border: `1px dashed ${coach.border}`, color: coach.muted }}>
              목 데이터 미리보기
            </span>
          )}
          {!isMockUser && (
            <button type="button" onClick={openHistory}
              className="rounded-full px-3 py-1.5 text-[11px] font-bold transition-all hover:opacity-80"
              style={{ border: `1.5px solid ${coach.border}`, color: coach.accentStrong, background: 'white' }}>
              🕐 지난 대화 보기
            </button>
          )}
        </div>
      </header>

      <div
        className="mx-auto grid w-full max-w-[1440px] overflow-hidden rounded-[28px] p-3 lg:h-[calc(100vh-210px)] lg:min-h-[650px] lg:max-h-[840px] lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.65fr)] lg:gap-3"
        style={{ background: coach.background, border: `1px solid ${coach.border}`, boxShadow: coach.shadow }}
      >
        <aside
          className="flex min-h-0 flex-col overflow-hidden rounded-[22px]"
          style={{ background: coach.panel, border: `1px solid ${coach.border}` }}
        >
          <div className="relative min-h-[300px] flex-1 overflow-hidden lg:min-h-0">
            <div className="absolute inset-0" style={{ background: coach.glow }} />
            <span className="absolute left-[12%] top-[16%] h-2 w-2 rounded-full border" style={{ borderColor: coach.border }} />
            <span className="absolute right-[12%] top-[24%] h-1.5 w-1.5 rounded-full" style={{ background: coach.accentSecondary, opacity: 0.45 }} />
            <span className="absolute bottom-[18%] right-[10%] h-2.5 w-2.5 rotate-45 border" style={{ borderColor: coach.border }} />
            <img
              src={coach.image}
              alt={`${coach.name} 소개 이미지`}
              className="absolute inset-x-0 bottom-0 mx-auto h-[108%] w-full object-contain object-bottom"
              style={{ filter: 'drop-shadow(0 18px 28px rgba(52, 45, 60, 0.12))', mixBlendMode: 'multiply' }}
            />
            <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(to top, ${coach.panel}, rgba(255,255,255,0))` }} />
          </div>

          <div className="relative z-10 px-5 pb-5 pt-2 lg:px-6 lg:pb-6">
            <p className="text-2xl font-bold" style={{ color: coach.accentStrong }}>안녕하세요!</p>
            <p className="mt-2 text-sm font-medium leading-6" style={{ color: coach.text }}>
              저는 데이트 장소 추천부터 연애 고민까지 함께 풀어가는<br />AI 데이트 <strong style={{ color: coach.accentStrong }}>{coach.name}</strong>예요.
            </p>
            <p className="mt-2 text-xs leading-5" style={{ color: coach.muted }}>{coach.intro}</p>

            {currentSuggestions?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold" style={{ color: coach.accentStrong }}>
                  {messages.length === 0 ? '추천 질문' : '이어서 물어보기'}
                </h3>
                <div className="mt-3 space-y-2">
                  {currentSuggestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => chooseSuggestion(question)}
                      disabled={sending}
                      className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-xs font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.82)', border: `1px solid ${coach.border}`, color: coach.text }}
                    >
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-xl text-sm" style={{ background: coach.assistantBubble, color: coach.accentStrong }}>
                        💬
                      </span>
                      <span className="flex-1">{question}</span>
                      <span className="text-base transition-transform group-hover:translate-x-0.5" style={{ color: coach.accent }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div
          className="mt-3 flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-[22px] lg:mt-0 lg:min-h-0"
          style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${coach.border}` }}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
            {loadingHistory ? (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <div className="text-center">
                  <span className="mx-auto block h-8 w-8 animate-pulse rounded-full" style={{ background: coach.assistantBubble }} />
                  <p className="mt-3 text-xs font-medium" style={{ color: coach.muted }}>대화를 불러오는 중...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-start gap-3">
                <CoachAvatar coach={coach} />
                <div>
                  <div className="max-w-xl rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-6" style={{ background: coach.assistantBubble, border: `1px solid ${coach.border}` }}>
                    안녕하세요! 저는 {coach.name}예요.<br />연애와 데이트에 대해 무엇이든 편하게 물어보세요.
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isUserMessage = message.senderType === 'USER';
                return (
                  <div key={message.messageId ?? message.id} className={`flex items-start gap-3 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                    {!isUserMessage && <CoachAvatar coach={coach} />}
                    <div className={`flex max-w-[82%] flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${isUserMessage ? 'rounded-tr-md text-white' : 'rounded-tl-md'}`}
                        style={isUserMessage
                          ? { background: coach.gradient, boxShadow: `0 8px 18px ${coach.accent}24` }
                          : { background: coach.assistantBubble, border: `1px solid ${coach.border}`, color: coach.text }}
                      >
                        {message.messageText}
                      </div>
                      <span className="mt-1.5 px-1 text-[10px]" style={{ color: coach.muted }}>{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-start gap-3">
                <CoachAvatar coach={coach} />
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-4" style={{ background: coach.assistantBubble, border: `1px solid ${coach.border}` }}>
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: coach.accent, animationDelay: `${dot * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-2xl px-4 py-3 text-center text-xs font-medium" style={{ background: '#fff1f2', color: '#d9485f' }}>
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-3 p-3 sm:p-4" style={{ borderTop: `1px solid ${coach.border}`, background: coach.panel }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="메시지를 입력하세요"
              disabled={sending || loadingHistory}
              className="min-w-0 flex-1 rounded-2xl px-4 py-3.5 text-sm outline-none transition-shadow placeholder:opacity-70 focus:ring-2 disabled:opacity-60"
              style={{ border: `1px solid ${coach.border}`, background: coach.inputBackground, color: coach.text, '--tw-ring-color': `${coach.accent}33` }}
            />
            <button
              type="submit"
              disabled={sending || loadingHistory || !input.trim()}
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: coach.gradient, boxShadow: `0 8px 20px ${coach.accent}35` }}
              aria-label="보내기"
              title="보내기"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(61, 44, 53, 0.35)' }}
          onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md max-h-[70vh] overflow-y-auto rounded-[24px] p-5"
            style={{ background: coach.panel, border: `1px solid ${coach.border}`, boxShadow: coach.shadow }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold" style={{ color: coach.accentStrong }}>지난 대화</h3>
              <button type="button" onClick={() => setShowHistory(false)}
                className="text-sm font-bold" style={{ color: coach.muted }}>닫기</button>
            </div>

            {historyLoading && <p className="text-xs" style={{ color: coach.muted }}>불러오는 중...</p>}
            {historyError && <p className="text-xs font-bold" style={{ color: '#e8486b' }}>{historyError}</p>}
            {!historyLoading && !historyError && historyList.length === 0 && (
              <p className="text-xs" style={{ color: coach.muted }}>지난 대화가 없어요.</p>
            )}

            <div className="space-y-2">
              {historyList.map((session) => (
                <button key={session.sessionId} type="button" onClick={() => resumeSession(session)}
                  className="w-full rounded-2xl px-4 py-3 text-left text-xs font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: session.sessionId === sessionId ? coach.assistantBubble : 'rgba(255,255,255,0.82)', border: `1px solid ${coach.border}`, color: coach.text }}>
                  <p className="font-bold">{session.title || `${coach.name}와의 대화`}</p>
                  <p className="mt-1 text-[10px]" style={{ color: coach.muted }}>
                    {new Date(session.createdAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </button>
              ))}
            </div>

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button type="button" onClick={() => loadHistoryPage(historyPage - 1)} disabled={historyPage <= 1 || historyLoading}
                  className="rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40" style={{ border: `1.5px solid ${coach.border}`, color: coach.text }}>이전</button>
                <span className="text-xs" style={{ color: coach.muted }}>{historyPage} / {historyTotalPages}</span>
                <button type="button" onClick={() => loadHistoryPage(historyPage + 1)} disabled={historyPage >= historyTotalPages || historyLoading}
                  className="rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40" style={{ border: `1.5px solid ${coach.border}`, color: coach.text }}>다음</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
