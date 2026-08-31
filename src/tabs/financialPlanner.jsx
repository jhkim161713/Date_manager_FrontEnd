import { useMemo, useState } from 'react';

const MONEY_FORMATTER = new Intl.NumberFormat('ko-KR');

const EXAMPLE_PROMPTS = [
  '6개월 뒤 도쿄 여행 자금 150만 원 모으기',
  '1년 동안 우리의 결혼 준비금 500만 원 만들기',
  '10개월 동안 비상금 300만 원 모으고 싶어',
];

const MOCK_PRODUCTS = [
  {
    id: 'dream-step',
    bankName: '하모니은행',
    productName: '꿈을 모으는 자유적금',
    rate: 4.2,
    term: '6~12개월',
    badge: '목표 기간 추천',
    color: '#ff6b8a',
  },
  {
    id: 'together-save',
    bankName: '라온저축은행',
    productName: '함께 차곡차곡 적금',
    rate: 4.05,
    term: '12개월',
    badge: '우대금리 포함',
    color: '#9270cf',
  },
  {
    id: 'travel-pocket',
    bankName: '여행은행',
    productName: '설레는 여행 포켓',
    rate: 3.85,
    term: '6개월',
    badge: '자유 납입',
    color: '#2e9b8c',
  },
];

const INITIAL_DASHBOARD = {
  goal: {
    id: 'mock-goal-1',
    ownerType: 'COUPLE',
    title: '도쿄에서 보내는 우리의 가을',
    targetAmount: 1500000,
    currentAmount: 640000,
    targetPeriodMonth: 6,
    category: 'TRAVEL',
    destination: '도쿄',
  },
  exchangeBriefing: {
    flag: '🇯🇵',
    currencyCode: 'JPY',
    label: '일본 엔',
    unitLabel: '100엔',
    rate: 927.42,
    change: 8.34,
    changePercent: 0.91,
    direction: 'UP',
    summary: '엔화가 어제보다 소폭 올랐어요. 지금 전액을 환전하기보다 여행일까지 2~3회로 나눠 준비해 보세요.',
  },
  interestBriefing: {
    baseRate: 2.5,
    bestSavingRate: 4.2,
    direction: 'HOLD',
    summary: '기준금리는 보합 흐름이에요. 6개월 목표라면 중도해지 부담이 적은 단기 자유적금을 먼저 비교해 보세요.',
  },
  products: MOCK_PRODUCTS,
};

function formatWon(value) {
  return `${MONEY_FORMATTER.format(Math.round(value))}원`;
}

function parseAmount(text) {
  const match = text.replaceAll(',', '').match(/([\d.]+)\s*(억|천만|백만|만)?\s*원/);
  if (!match) return null;

  const units = { 억: 100000000, 천만: 10000000, 백만: 1000000, 만: 10000 };
  return Math.round(Number(match[1]) * (units[match[2]] ?? 1));
}

function parsePeriod(text) {
  const match = text.match(/(\d+)\s*(개월|달|년)/);
  if (!match) return null;
  return match[2] === '년' ? Number(match[1]) * 12 : Number(match[1]);
}

function resolveDestination(text) {
  if (/도쿄|일본|오사카|후쿠오카/.test(text)) {
    return {
      destination: /오사카/.test(text) ? '오사카' : /후쿠오카/.test(text) ? '후쿠오카' : '도쿄',
      briefing: {
        flag: '🇯🇵', currencyCode: 'JPY', label: '일본 엔', unitLabel: '100엔', rate: 927.42,
        change: 8.34, changePercent: 0.91, direction: 'UP',
        summary: '엔화가 어제보다 소폭 올랐어요. 한 번에 환전하기보다 목표일까지 나눠 준비하는 방법이 안정적이에요.',
      },
    };
  }

  if (/뉴욕|미국|하와이/.test(text)) {
    return {
      destination: /하와이/.test(text) ? '하와이' : '뉴욕',
      briefing: {
        flag: '🇺🇸', currencyCode: 'USD', label: '미국 달러', unitLabel: '1달러', rate: 1384.6,
        change: -3.2, changePercent: -0.23, direction: 'DOWN',
        summary: '달러는 단기적으로 숨을 고르는 흐름이에요. 여행 예산의 일부부터 분할 환전해 변동 위험을 낮춰 보세요.',
      },
    };
  }

  if (/파리|프랑스|유럽|이탈리아|스페인/.test(text)) {
    return {
      destination: /파리|프랑스/.test(text) ? '파리' : '유럽',
      briefing: {
        flag: '🇪🇺', currencyCode: 'EUR', label: '유로', unitLabel: '1유로', rate: 1618.3,
        change: 5.1, changePercent: 0.32, direction: 'UP',
        summary: '유로가 완만하게 오르고 있어요. 여행 시점이 가까워질수록 필요한 금액을 조금씩 확보해 두는 편이 좋아요.',
      },
    };
  }

  return { destination: null, briefing: null };
}

function buildMockDashboard(prompt, amount, months) {
  const destinationResult = resolveDestination(prompt);
  const isTravel = /여행|도쿄|일본|오사카|후쿠오카|뉴욕|미국|하와이|파리|프랑스|유럽/.test(prompt);
  const isCouple = /우리|커플|함께|결혼/.test(prompt);
  const title = isTravel
    ? `${destinationResult.destination ?? '여행지'}로 떠나는 설레는 계획`
    : /결혼/.test(prompt)
      ? '우리의 따뜻한 결혼 준비'
      : /비상금/.test(prompt)
        ? '마음을 든든하게 하는 비상금'
        : '차근차근 만드는 나의 목표';

  return {
    goal: {
      id: `mock-goal-${Date.now()}`,
      ownerType: isCouple ? 'COUPLE' : 'SOLO',
      title,
      targetAmount: amount,
      currentAmount: Math.min(Math.round(amount * 0.18), amount),
      targetPeriodMonth: months,
      category: isTravel ? 'TRAVEL' : 'SAVING',
      destination: destinationResult.destination,
    },
    exchangeBriefing: isTravel ? destinationResult.briefing : null,
    interestBriefing: INITIAL_DASHBOARD.interestBriefing,
    products: MOCK_PRODUCTS.map((product, index) => ({
      ...product,
      term: months <= 6 ? '6개월' : months <= 12 ? '12개월' : '12~24개월',
      badge: index === 0 ? `${months}개월 목표 추천` : product.badge,
    })),
  };
}

function Panel({ children, className = '', style = {} }) {
  return (
    <section
      className={`rounded-[26px] border bg-white ${className}`}
      style={{ borderColor: '#f0dfe4', boxShadow: '0 14px 34px rgba(98, 65, 76, 0.07)', ...style }}
    >
      {children}
    </section>
  );
}

function PlannerPromptPanel({ input, setInput, phase, question, onSubmit, onReset }) {
  const isLoading = phase === 'loading';

  return (
    <Panel className="overflow-hidden">
      <div className="p-5 sm:p-6" style={{ background: 'linear-gradient(145deg, #fffafd 0%, #fff5ef 100%)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold"
              style={{ color: '#d84f70', background: '#fff0f3' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b8a]" /> AI 목표 설계
            </span>
            <h2 className="mt-3 text-xl font-extrabold tracking-[-0.02em] text-[#3d2c35] sm:text-2xl">
              이루고 싶은 계획을 말해 주세요
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#8f7b82]">
              금액과 기간을 함께 적으면 목표와 금융 브리핑을 바로 만들어 드려요.
            </p>
          </div>
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl text-xl"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 8px 18px rgba(255,107,138,.24)' }}>
            ✦
          </span>
        </div>

        {question && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border p-4"
            style={{ borderColor: '#efd9f8', background: '#fbf5ff' }} aria-live="polite">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white text-sm shadow-sm">🤖</span>
            <div>
              <p className="text-[11px] font-extrabold text-[#9270b7]">플래너의 질문</p>
              <p className="mt-1 text-sm font-bold leading-5 text-[#59445f]">{question}</p>
            </div>
          </div>
        )}

        <form className="mt-5" onSubmit={onSubmit}>
          <label htmlFor="planner-prompt" className="sr-only">자금 목표 입력</label>
          <div className="rounded-[22px] border bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#ffb3c3]"
            style={{ borderColor: '#ead7dd' }}>
            <textarea
              id="planner-prompt"
              rows={3}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
              placeholder="예: 6개월 뒤 도쿄 여행 자금 150만 원을 모으고 싶어"
              className="w-full resize-none bg-transparent px-3 pt-2 text-sm font-semibold leading-6 text-[#3d2c35] outline-none placeholder:font-medium placeholder:text-[#baaab0] disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-3 px-1 pb-1">
              <button type="button" onClick={onReset}
                className="rounded-full px-3 py-2 text-xs font-bold text-[#a08c93] transition-colors hover:bg-[#fff3f5]">
                새로 시작
              </button>
              <button type="submit" disabled={isLoading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #ad82da)', boxShadow: '0 7px 16px rgba(225,86,121,.22)' }}>
                {isLoading ? '계획을 만드는 중...' : '계획 만들기'} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button key={prompt} type="button" onClick={() => setInput(prompt)} disabled={isLoading}
              className="rounded-full border bg-white px-3 py-2 text-left text-[11px] font-bold text-[#866f78] transition-all hover:-translate-y-0.5 hover:border-[#ff9fb3] disabled:opacity-50"
              style={{ borderColor: '#eedce2' }}>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function GoalProgressCard({ goal, onAddProgress }) {
  const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlyAmount = Math.ceil(remaining / Math.max(1, goal.targetPeriodMonth));
  const ownerLabel = goal.ownerType === 'COUPLE' ? '우리의 목표' : '나의 목표';

  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#d95678]">{ownerLabel}</p>
          <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.02em] text-[#3d2c35]">{goal.title}</h2>
          <p className="mt-2 text-xs font-semibold text-[#9d8990]">
            {goal.destination ? `${goal.destination} · ` : ''}{goal.targetPeriodMonth}개월 목표
          </p>
        </div>
        <span className="rounded-2xl px-3 py-2 text-sm font-black text-[#d95678]" style={{ background: '#fff0f3' }}>
          {progress}%
        </span>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#f6e9ed]">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff6b8a, #bf91e5)' }} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#aa979e]">현재 모은 금액</p>
          <p className="mt-1 text-xl font-black text-[#3d2c35]">{formatWon(goal.currentAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-[#aa979e]">목표 금액</p>
          <p className="mt-1 text-sm font-extrabold text-[#6c5960]">{formatWon(goal.targetAmount)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl p-4" style={{ background: '#fff9f7' }}>
        <div>
          <p className="text-[10px] font-bold text-[#aa979e]">앞으로 필요한 금액</p>
          <p className="mt-1 text-sm font-extrabold text-[#59464d]">{formatWon(remaining)}</p>
        </div>
        <div className="border-l pl-3" style={{ borderColor: '#efdee3' }}>
          <p className="text-[10px] font-bold text-[#aa979e]">월 추천 저축액</p>
          <p className="mt-1 text-sm font-extrabold text-[#59464d]">약 {formatWon(monthlyAmount)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="mr-auto text-[11px] font-bold text-[#a08c93]">목업 진행률 업데이트</span>
        {[50000, 100000].map((amount) => (
          <button key={amount} type="button" onClick={() => onAddProgress(amount)} disabled={progress >= 100}
            className="rounded-full border px-3 py-2 text-[11px] font-extrabold text-[#d95678] transition-colors hover:bg-[#fff0f3] disabled:opacity-40"
            style={{ borderColor: '#f3cbd5' }}>
            +{amount / 10000}만원
          </button>
        ))}
      </div>
    </Panel>
  );
}

function BriefingCard({ type, data }) {
  const isExchange = type === 'exchange';
  const isUp = data.direction === 'UP';
  const accent = isExchange ? '#2d8f83' : '#8b68b4';
  const pale = isExchange ? '#edf9f5' : '#f7f1fc';

  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl text-lg" style={{ background: pale }}>
            {isExchange ? data.flag : '％'}
          </span>
          <div>
            <p className="text-[11px] font-extrabold" style={{ color: accent }}>
              {isExchange ? '실시간 환율 브리핑' : '금리 동향 브리핑'}
            </p>
            <h3 className="mt-0.5 text-base font-extrabold text-[#3d2c35]">
              {isExchange ? `${data.label} · ${data.currencyCode}` : '오늘의 예·적금 금리'}
            </h3>
          </div>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[#8f7b82]" style={{ background: '#f8f3f4' }}>
          목업 · 오늘 09:00
        </span>
      </div>

      {isExchange ? (
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#a08c93]">{data.unitLabel} 기준</p>
            <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2d3637]">
              {MONEY_FORMATTER.format(data.rate)}<span className="ml-1 text-sm font-extrabold">원</span>
            </p>
          </div>
          <p className="rounded-full px-3 py-1.5 text-xs font-extrabold"
            style={{ color: isUp ? '#df5871' : '#297cad', background: isUp ? '#fff0f3' : '#edf6fb' }}>
            {isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)}원 ({Math.abs(data.changePercent).toFixed(2)}%)
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: '#faf6fc' }}>
            <p className="text-[11px] font-bold text-[#9b89a4]">한국 기준금리</p>
            <p className="mt-1 text-2xl font-black text-[#5b4867]">{data.baseRate.toFixed(2)}%</p>
            <p className="mt-1 text-[10px] font-bold text-[#a492ad]">보합 흐름 →</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#fff7f4' }}>
            <p className="text-[11px] font-bold text-[#a18b84]">추천 상품 최고</p>
            <p className="mt-1 text-2xl font-black text-[#745750]">{data.bestSavingRate.toFixed(2)}%</p>
            <p className="mt-1 text-[10px] font-bold text-[#ad938d]">우대금리 포함</p>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl p-4" style={{ background: pale }}>
        <p className="text-[10px] font-extrabold" style={{ color: accent }}>AI 한 줄 브리핑</p>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-[#594b50]">{data.summary}</p>
      </div>
    </Panel>
  );
}

function ProductRecommendationList({ products }) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#d95678]">맞춤 금융 상품</p>
          <h2 className="mt-1 text-lg font-extrabold text-[#3d2c35]">목표와 잘 맞는 적금이에요</h2>
        </div>
        <span className="text-[10px] font-bold text-[#aa979e]">목업 상품 3개</span>
      </div>

      <div className="mt-4 divide-y" style={{ borderColor: '#f2e5e8' }}>
        {products.map((product) => (
          <article key={product.id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-0">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl text-base font-black text-white"
              style={{ background: product.color, boxShadow: `0 7px 16px ${product.color}33` }}>
              {product.bankName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[10px] font-bold text-[#a08c93]">{product.bankName}</p>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                  style={{ color: product.color, background: `${product.color}12` }}>
                  {product.badge}
                </span>
              </div>
              <h3 className="mt-1 truncate text-sm font-extrabold text-[#4a3940]">{product.productName}</h3>
              <p className="mt-1 text-[10px] font-semibold text-[#9f8b92]">가입 기간 {product.term}</p>
            </div>
            <div className="flex-none text-right">
              <p className="text-[10px] font-bold text-[#a08c93]">최고 연</p>
              <p className="text-lg font-black" style={{ color: product.color }}>{product.rate.toFixed(2)}%</p>
              <button type="button" onClick={() => window.alert('목업 화면에서는 상품 페이지로 이동하지 않아요.')}
                className="mt-1 text-[10px] font-extrabold text-[#8d7680] hover:underline">
                자세히 보기 →
              </button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function FinancialPlanner() {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('ready');
  const [question, setQuestion] = useState('');
  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD);
  const [notice, setNotice] = useState('예시 목표를 목업 데이터로 보여드리고 있어요. 새 계획을 입력해 보세요.');

  const progress = useMemo(
    () => Math.min(100, Math.round((dashboard.goal.currentAmount / dashboard.goal.targetAmount) * 100)),
    [dashboard]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    const amount = parseAmount(prompt);
    const months = parsePeriod(prompt);
    if (!amount || !months) {
      setPhase('clarification');
      setQuestion(!amount && !months
        ? '목표 금액과 기간을 함께 알려주실래요? 예: 6개월 동안 150만 원'
        : !amount
          ? '좋아요! 얼마를 모으고 싶은지 목표 금액도 알려주세요.'
          : '좋아요! 언제까지 모을지 기간도 알려주세요.');
      return;
    }

    setPhase('loading');
    setQuestion('');
    setNotice('문장에서 금액, 기간과 목표 성격을 찾고 있어요.');
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    const nextDashboard = buildMockDashboard(prompt, amount, months);
    setDashboard(nextDashboard);
    setInput('');
    setPhase('ready');
    setNotice(nextDashboard.exchangeBriefing
      ? `${nextDashboard.goal.destination} 목표에 맞춰 환율과 금리 브리핑을 새로 만들었어요.`
      : '새 목표에 맞춰 금리 브리핑과 추천 상품을 새로 만들었어요.');
  };

  const handleReset = () => {
    setInput('');
    setQuestion('');
    setPhase('ready');
    setDashboard(INITIAL_DASHBOARD);
    setNotice('처음 예시 목표로 돌아왔어요.');
  };

  const handleAddProgress = (amount) => {
    setDashboard((current) => ({
      ...current,
      goal: {
        ...current.goal,
        currentAmount: Math.min(current.goal.targetAmount, current.goal.currentAmount + amount),
      },
    }));
    setNotice(`${formatWon(amount)}을 목표에 더했어요. 목업 데이터라 새로고침하면 초기화돼요.`);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-6 text-[#3d2c35]">
      <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-[10px] font-extrabold text-[#d95678]" style={{ background: '#fff0f3' }}>
              MOCK DATA
            </span>
            <span className="text-[11px] font-bold text-[#ad99a0]">API 연결 전 프론트엔드 미리보기</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">AI 스마트 자금 플래너</h1>
          <p className="mt-1.5 text-sm font-semibold text-[#958087]">말로 세운 목표를 환율·금리 정보와 함께 한눈에 관리해요.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-[11px] font-bold text-[#8e7981]"
          style={{ borderColor: '#ecdde2' }}>
          <span className="h-2 w-2 rounded-full bg-[#42b697]" /> 목업 데이터 정상 · 달성률 {progress}%
        </div>
      </header>

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold text-[#6f5962]"
          style={{ background: '#fffdfc', borderColor: '#efdee3' }} aria-live="polite">
          <span aria-hidden="true">✨</span><span>{notice}</span>
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
        <div className="space-y-4 xl:sticky xl:top-0">
          <div className="sticky top-0 z-20 -mx-1 px-1 pb-1 pt-1 backdrop-blur-md xl:static xl:m-0 xl:p-0 xl:backdrop-blur-none"
            style={{ background: 'rgba(255,248,244,.86)' }}>
            <PlannerPromptPanel
              input={input}
              setInput={setInput}
              phase={phase}
              question={question}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          </div>
          <GoalProgressCard goal={dashboard.goal} onAddProgress={handleAddProgress} />
        </div>

        <div className={`grid gap-4 transition-opacity ${phase === 'loading' ? 'pointer-events-none opacity-45' : 'opacity-100'}`}>
          {dashboard.exchangeBriefing && <BriefingCard type="exchange" data={dashboard.exchangeBriefing} />}
          <BriefingCard type="interest" data={dashboard.interestBriefing} />
          <ProductRecommendationList products={dashboard.products} />
          <p className="px-2 text-center text-[10px] font-semibold leading-5 text-[#ab979e]">
            화면의 환율·금리·상품은 UI 확인을 위한 목업 데이터이며 실제 금융 정보나 가입 권유가 아닙니다.
          </p>
        </div>
      </div>
    </div>
  );
}
