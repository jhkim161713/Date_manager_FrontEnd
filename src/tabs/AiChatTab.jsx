import { useEffect, useRef, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { createAiChatSession, getAiChatMessages, sendAiChatMessage } from '@/lib/api';

const SESSION_STORAGE_KEY = 'dm_ai_chat_session_id';

export function AiChatTab() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  // 처음 열었을 때 - 이전에 쓰던 세션이 로컬에 저장되어 있으면 그 대화를 이어서 불러오고,
  // 없거나(다른 계정 등으로) 조회가 실패하면 새 세션을 만든다.
  useEffect(() => {
    const init = async () => {
      setLoadingHistory(true);
      setError(null);
      const savedId = localStorage.getItem(SESSION_STORAGE_KEY);
      try {
        if (savedId) {
          const history = await getAiChatMessages(savedId);
          setSessionId(savedId);
          setMessages(history);
          return;
        }
        throw new Error('저장된 세션 없음');
      } catch {
        try {
          const session = await createAiChatSession('데이트 상담');
          localStorage.setItem(SESSION_STORAGE_KEY, session.sessionId);
          setSessionId(session.sessionId);
          setMessages([]);
        } catch (e) {
          setError(e.message);
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !sessionId) return;

    // 낙관적 업데이트: 내가 보낸 메시지는 응답 기다리지 않고 바로 화면에 띄운다
    const optimisticUser = {
      messageId: `local-${Date.now()}`,
      senderType: 'USER',
      messageText: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const aiMessage = await sendAiChatMessage(sessionId, text);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <SectionTitle sub="성향에 맞는 데이트를 AI에게 물어보세요">AI 데이트 상담 🤖</SectionTitle>

      <div className="flex-1 min-h-0 flex flex-col rounded-3xl bg-white overflow-hidden"
        style={{ border: '1.5px solid #ffd6e0', boxShadow: '0 5px 18px rgba(89, 58, 70, 0.06)' }}>

        {/* 메시지 목록 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {loadingHistory ? (
            <p className="text-xs text-center py-6" style={{ color: '#a08b94' }}>대화 불러오는 중...</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>무엇이든 물어보세요</p>
              <p className="text-xs mt-1" style={{ color: '#a08b94' }}>예: "이번 주말에 조용한 데이트 코스 추천해줘"</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.messageId} className={`flex ${m.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.senderType === 'USER'
                    ? { background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', color: 'white' }
                    : { background: '#fff0f3', color: '#3d2c35', border: '1.5px solid #ffd6e0' }}>
                  {m.messageText}
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5 text-sm" style={{ background: '#fff0f3', color: '#a08b94', border: '1.5px solid #ffd6e0' }}>
                답변을 준비하고 있어요...
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-xs" style={{ color: '#e8486b' }}>
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <form onSubmit={handleSend} className="flex items-center gap-2 p-3" style={{ borderTop: '1.5px solid #ffd6e0' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            disabled={sending || loadingHistory || !sessionId}
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none disabled:opacity-60"
            style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4', color: '#3d2c35' }}
          />
          <button
            type="submit"
            disabled={sending || loadingHistory || !input.trim() || !sessionId}
            className="rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 12px rgba(255,107,138,0.25)' }}
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  );
}
