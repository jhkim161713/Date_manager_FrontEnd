import { useEffect, useRef, useState } from 'react';
import { createAiChatSession, getAiChatMessages, sendAiChatMessage } from '@/lib/api';
import { getCurrentLocation } from '../lib/weather';
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
    intro: '따뜻하게 공감하면서도 현실적인 방향을 함께 찾아드릴게요.',
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
    intro: '차분하게 상황을 정리하고 자연스러운 다음 단계를 함께 찾아드릴게요.',
  },
};

const SUGGESTED_QUESTIONS = [
  { icon: '♥', text: '첫 데이트, 어디가 좋을까요?' },
  { icon: '●', text: '상대의 마음을 어떻게 알 수 있죠?' },
  { icon: '★', text: '연애 관계를 오래 유지하는 비결은?' },
];

function normalizeGender(gender) {
  return typeof gender === 'string' ? gender.trim().toUpperCase() : 'UNKNOWN';
}

function resolveCoachByGender(gender) {
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

export function AiChatTab({ user }) {
  const coach = resolveCoachByGender(user?.gender);
  const normalizedGender = normalizeGender(user?.gender);
  const isMockUser = typeof user?.id !== 'number';
  const storageKey = `dm_ai_chat_session_id:${user?.id ?? 'preview'}`;

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
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

      const savedId = localStorage.getItem(storageKey);
      try {
        if (savedId) {
          const history = await getAiChatMessages(savedId);
          if (!cancelled) {
            setSessionId(savedId);
            setMessages(history);
          }
          return;
        }
        throw new Error('저장된 세션 없음');
      } catch {
        try {
          const session = await createAiChatSession(`${coach.name} 데이트 상담`);
          if (!cancelled) {
            localStorage.setItem(storageKey, session.sessionId);
            setSessionId(session.sessionId);
            setMessages([]);
          }
        } catch (requestError) {
          if (!cancelled) setError(requestError.message);
        }
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

  const chooseSuggestion = (question) => {
    setInput(question);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending || !sessionId) return;

    const optimisticUser = {
      messageId: `local-${Date.now()}`,
      senderType: 'USER',
      messageText: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, optimisticUser]);
    setInput('');
    setSending(true);
    setError(null);

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
      const aiMessage = await sendAiChatMessage(sessionId, text, { lat, lon });
      setMessages((previous) => [...previous, aiMessage]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const genderBadge = normalizedGender === 'FEMALE'
    ? '여성 사용자 · 도윤 코치'
    : normalizedGender === 'MALE'
      ? '남성 사용자 · 서연 코치'
      : '기본 사용자 · 서연 코치';

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4" style={{ color: coach.text }}>
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: coach.accentStrong }}>
            AI 데이트 상담
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: coach.muted }}>
            성향에 맞는 데이트와 관계 고민을 AI 코치에게 물어보세요
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isMockUser && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold" style={{ border: `1px dashed ${coach.border}`, color: coach.muted }}>
              목 데이터 미리보기
            </span>
          )}
          <span className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ background: coach.assistantBubble, color: coach.accentStrong }}>
            {genderBadge}
          </span>
        </div>
      </header>

      <div
        className="grid overflow-hidden rounded-[28px] p-3 lg:h-[calc(100vh-210px)] lg:min-h-[650px] lg:max-h-[840px] lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.65fr)] lg:gap-3"
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
              저는 연애 고민을 함께 풀어가는<br />AI 데이트 코치 <strong style={{ color: coach.accentStrong }}>{coach.name}</strong>예요.
            </p>
            <p className="mt-2 text-xs leading-5" style={{ color: coach.muted }}>{coach.intro}</p>

            <div className="mt-6">
              <h3 className="text-sm font-bold" style={{ color: coach.accentStrong }}>추천 질문</h3>
              <div className="mt-3 space-y-2">
                {SUGGESTED_QUESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => chooseSuggestion(suggestion.text)}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-xs font-semibold transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.82)', border: `1px solid ${coach.border}`, color: coach.text }}
                  >
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-xl text-sm" style={{ background: coach.assistantBubble, color: coach.accentStrong }}>
                      {suggestion.icon}
                    </span>
                    <span className="flex-1">{suggestion.text}</span>
                    <span className="text-base transition-transform group-hover:translate-x-0.5" style={{ color: coach.accent }}>›</span>
                  </button>
                ))}
              </div>
            </div>
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
              disabled={sending || loadingHistory || !sessionId}
              className="min-w-0 flex-1 rounded-2xl px-4 py-3.5 text-sm outline-none transition-shadow placeholder:opacity-70 focus:ring-2 disabled:opacity-60"
              style={{ border: `1px solid ${coach.border}`, background: coach.inputBackground, color: coach.text, '--tw-ring-color': `${coach.accent}33` }}
            />
            <button
              type="submit"
              disabled={sending || loadingHistory || !input.trim() || !sessionId}
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
    </section>
  );
}
