import { useEffect, useMemo, useState } from 'react';
import { createOrUpdateFundGoal, getFundPlannerDashboard, updateFundGoalProgress } from '../lib/api';
import { SectionTitle } from '../components/SectionTitle';

const MONEY_FORMATTER = new Intl.NumberFormat('ko-KR');

const EXAMPLE_PROMPTS = [
  '6개월 뒤 도쿄 여행 자금 150만 원 모으기',
  '1년 동안 우리의 결혼 준비금 500만 원 만들기',
  '10개월 동안 비상금 300만 원 모으고 싶어',
];

// 백엔드 CachedExchangeRate는 currencyCode/rate만 주기 때문에, 국기·한글명·단위 표시는
// 프론트에서 보강한다(DestinationCurrencyMapper가 매핑하는 통화 범위와 맞춤, 2026-08-31).
const CURRENCY_META = {
  JPY: { flag: '🇯🇵', label: '일본 엔', unitLabel: '100엔' },
  USD: { flag: '🇺🇸', label: '미국 달러', unitLabel: '1달러' },
  EUR: { flag: '🇪🇺', label: '유로', unitLabel: '1유로' },
  GBP: { flag: '🇬🇧', label: '영국 파운드', unitLabel: '1파운드' },
  THB: { flag: '🇹🇭', label: '태국 바트', unitLabel: '1바트' },
  VND: { flag: '🇻🇳', label: '베트남 동', unitLabel: '100동' },
  TWD: { flag: '🇹🇼', label: '대만 달러', unitLabel: '1달러' },
  HKD: { flag: '🇭🇰', label: '홍콩 달러', unitLabel: '1달러' },
  SGD: { flag: '🇸🇬', label: '싱가포르 달러', unitLabel: '1달러' },
  IDR: { flag: '🇮🇩', label: '인도네시아 루피아', unitLabel: '100루피아' },
  CNY: { flag: '🇨🇳', label: '중국 위안', unitLabel: '1위안' },
  AUD: { flag: '🇦🇺', label: '호주 달러', unitLabel: '1달러' },
};

const PRODUCT_COLORS = ['#ff6b8a', '#9270cf', '#2e9b8c', '#d98c3f', '#4a90c4'];

function formatWon(value) {
  return `${MONEY_FORMATTER.format(Math.round(value ?? 0))}원`;
}

// 백엔드 GoalResultDto -> 화면에서 쓰는 goal 모양으로 변환(destinationCountry -> destination, goalId -> id).
function toGoalView(goal) {
  if (!goal) return null;
  return {
    id: goal.goalId,
    ownerType: goal.ownerType,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetPeriodMonth: goal.targetPeriodMonth,
    category: goal.category,
    destination: goal.destinationCountry,
  };
}

function toExchangeBriefingView(briefing, aiComment) {
  if (!briefing) return null;
  const meta = CURRENCY_META[briefing.currencyCode] ?? { flag: '🌐', label: briefing.currencyCode, unitLabel: '1단위' };
  const change = briefing.prevRate != null ? briefing.rate - briefing.prevRate : 0;
  const changePercent = briefing.prevRate ? (change / briefing.prevRate) * 100 : 0;
  return {
    ...meta,
    currencyCode: briefing.currencyCode,
    rate: briefing.rate,
    change,
    changePercent,
    direction: change >= 0 ? 'UP' : 'DOWN',
    summary: aiComment || '환율은 하루 1회 갱신돼요. 여행일이 가까워질수록 필요한 만큼 나눠서 환전하는 게 안정적이에요.',
  };
}

function toProductsView(products) {
  return (products ?? []).map((p, index) => ({
    id: `${p.bankName}-${p.productName}-${p.saveTrm}-${index}`,
    bankName: p.bankName,
    productName: p.productName?.trim(),
    rate: p.intrRate2 ?? p.intrRate ?? 0,
    term: `${p.saveTrm}개월`,
    badge: p.productType === 'SAVING' ? '적금' : '예금',
    color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
    linkUrl: p.linkUrl,
  }));
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

function PlannerPromptPanel({ input, setInput, phase, question, onSubmit }) {
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
              금액과 기간을 함께 적으면 목표와 금융 브리핑을 바로 만들어 드려요. 목표는 항상 1개만 유지되고,
              다시 입력하면 지금 목표가 새 내용으로 바뀌어요.
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
            <div className="flex items-center justify-end gap-3 px-1 pb-1">
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

function EmptyGoalCard() {
  return (
    <Panel className="p-6 text-center">
      <p className="text-3xl">🎯</p>
      <h2 className="mt-3 text-lg font-extrabold text-[#3d2c35]">아직 목표가 없어요</h2>
      <p className="mt-1.5 text-sm font-semibold leading-6 text-[#8f7b82]">
        위 입력창에 모으고 싶은 금액과 기간을 말해주면 목표가 만들어져요.
      </p>
    </Panel>
  );
}

function GoalProgressCard({ goal, onUpdateProgress, isUpdating }) {
  const [progressInput, setProgressInput] = useState('');
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

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold text-[#a08c93]">모은 금액 업데이트</p>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(progressInput.replaceAll(',', ''));
            if (!Number.isFinite(value) || value < 0) return;
            onUpdateProgress(Math.min(goal.targetAmount, value));
            setProgressInput('');
          }}
        >
          <input
            type="number"
            min="0"
            max={goal.targetAmount}
            value={progressInput}
            onChange={(event) => setProgressInput(event.target.value)}
            disabled={isUpdating}
            placeholder="현재 모은 금액 직접 입력"
            className="min-w-0 flex-1 rounded-full border px-3.5 py-2 text-xs font-bold text-[#3d2c35] outline-none focus:ring-2 focus:ring-[#ffb3c3] disabled:opacity-60"
            style={{ borderColor: '#ead7dd' }}
          />
          <button type="submit" disabled={isUpdating || progressInput.trim() === ''}
            className="flex-none rounded-full px-3.5 py-2 text-[11px] font-extrabold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #ad82da)' }}>
            저장
          </button>
        </form>
        <div className="mt-2 flex items-center gap-2">
          {[50000, 100000].map((amount) => (
            <button key={amount} type="button"
              onClick={() => onUpdateProgress(Math.min(goal.targetAmount, goal.currentAmount + amount))}
              disabled={progress >= 100 || isUpdating}
              className="rounded-full border px-3 py-2 text-[11px] font-extrabold text-[#d95678] transition-colors hover:bg-[#fff0f3] disabled:opacity-40"
              style={{ borderColor: '#f3cbd5' }}>
              +{amount / 10000}만원
            </button>
          ))}
        </div>
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
              {isExchange ? '실시간 환율 브리핑' : '추천 상품 금리 동향'}
            </p>
            <h3 className="mt-0.5 text-base font-extrabold text-[#3d2c35]">
              {isExchange ? `${data.label} · ${data.currencyCode}` : '오늘의 예·적금 금리'}
            </h3>
          </div>
        </div>
      </div>

      {isExchange ? (
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#a08c93]">{data.unitLabel} 기준</p>
            <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2d3637]">
              {MONEY_FORMATTER.format(Math.round(data.rate * 100) / 100)}<span className="ml-1 text-sm font-extrabold">원</span>
            </p>
          </div>
          {data.change !== 0 && (
            <p className="rounded-full px-3 py-1.5 text-xs font-extrabold"
              style={{ color: isUp ? '#df5871' : '#297cad', background: isUp ? '#fff0f3' : '#edf6fb' }}>
              {isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)}원 ({Math.abs(data.changePercent).toFixed(2)}%)
            </p>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: '#faf6fc' }}>
            <p className="text-[11px] font-bold text-[#9b89a4]">평균 금리</p>
            <p className="mt-1 text-2xl font-black text-[#5b4867]">{data.avgRate.toFixed(2)}%</p>
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
  if (products.length === 0) return null;
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#d95678]">맞춤 금융 상품</p>
          <h2 className="mt-1 text-lg font-extrabold text-[#3d2c35]">목표와 잘 맞는 예·적금이에요</h2>
        </div>
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
              <a href={product.linkUrl} target="_blank" rel="noreferrer"
                className="mt-1 inline-block text-[10px] font-extrabold text-[#8d7680] hover:underline">
                가입하러 가기 →
              </a>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function FinancialPlanner() {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('loading'); // loading(초기 조회) | ready | loading(제출 중) | clarification
  const [question, setQuestion] = useState('');
  const [goal, setGoal] = useState(null);
  const [aiComment, setAiComment] = useState('');
  const [exchangeBriefing, setExchangeBriefing] = useState(null);
  const [products, setProducts] = useState([]);
  const [notice, setNotice] = useState('');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const progress = useMemo(() => {
    if (!goal) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }, [goal]);

  // 알림 문구는 아직 아무 액션도 안 한 첫 진입 상태에도 항상 떠 있어야 해서(2026-08-31), 업데이트로
  // 받은 notice가 없을 때는 목표 유무에 따른 기본 문구로 대체한다.
  const defaultNotice = goal ? `달성률 ${progress}%예요. 목표를 자유롭게 수정하거나 진행 상황을 업데이트해보세요.` : '아직 목표가 없어요. 아래에서 목표를 말해보세요.';

  const applyDashboard = (dashboard) => {
    setGoal(toGoalView(dashboard.goal));
    setAiComment(dashboard.aiComment ?? '');
    setExchangeBriefing(toExchangeBriefingView(dashboard.exchangeBriefing, dashboard.aiComment));
    setProducts(toProductsView(dashboard.recommendedProducts));
  };

  const loadDashboard = async () => {
    try {
      const dashboard = await getFundPlannerDashboard();
      applyDashboard(dashboard);
      setNotice(dashboard.goal ? '' : '아직 목표가 없어요. 아래에서 목표를 말해보세요.');
    } catch (err) {
      setNotice(err.message || '대시보드를 불러오지 못했어요.');
    } finally {
      setPhase('ready');
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const interestBriefing = useMemo(() => {
    if (products.length === 0) return null;
    const avgRate = products.reduce((sum, p) => sum + p.rate, 0) / products.length;
    return {
      avgRate,
      bestSavingRate: Math.max(...products.map((p) => p.rate)),
      summary: '아래 목록은 목표 기간과 같은 예치기간 상품 중 최고우대금리 순으로 골랐어요.',
    };
  }, [products]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setPhase('loading');
    setQuestion('');
    try {
      const result = await createOrUpdateFundGoal(prompt);
      if (result.needsClarification) {
        setPhase('clarification');
        setQuestion(result.question);
        return;
      }
      setInput('');
      const dashboard = await getFundPlannerDashboard();
      applyDashboard(dashboard);
      setNotice('목표를 반영했어요.');
      setPhase('ready');
    } catch (err) {
      setNotice(err.message || '목표를 만드는 중 문제가 생겼어요.');
      setPhase('ready');
    }
  };

  // 빠른 버튼(+5만원 등)과 직접 입력 둘 다 여기로 모은다 - 백엔드 PATCH가 절대값을 받기 때문에
  // "얼마를 더할지"가 아니라 "최종적으로 얼마가 될지"를 항상 계산해서 넘긴다.
  const handleUpdateProgress = async (nextAmount) => {
    if (!goal) return;
    setIsUpdatingProgress(true);
    try {
      const result = await updateFundGoalProgress(goal.id, nextAmount);
      setGoal(toGoalView(result));
      setNotice(`모은 금액을 ${formatWon(nextAmount)}(으)로 업데이트했어요.`);
    } catch (err) {
      setNotice(err.message || '진행률을 업데이트하지 못했어요.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle sub="말로 세운 목표를 환율·금리 정보와 함께 한눈에 관리해요">
        💰 AI 스마트 자금 플래너
      </SectionTitle>

      <div className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-xs font-bold text-[#6f5962]"
        style={{ background: '#fffdfc', borderColor: '#efdee3' }} aria-live="polite">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="flex-none">✨</span><span>{notice || defaultNotice}</span>
        </span>
        {goal && (
          <div className="flex flex-none items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-[11px] font-bold text-[#8e7981]"
            style={{ borderColor: '#ecdde2' }}>
            <span className="h-2 w-2 flex-none rounded-full bg-[#42b697]" /> 달성률 {progress}%
          </div>
        )}
      </div>

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
            />
          </div>
          {goal ? (
            <GoalProgressCard goal={goal} onUpdateProgress={handleUpdateProgress} isUpdating={isUpdatingProgress} />
          ) : (
            <EmptyGoalCard />
          )}
        </div>

        <div className={`grid gap-4 transition-opacity ${phase === 'loading' ? 'pointer-events-none opacity-45' : 'opacity-100'}`}>
          {exchangeBriefing && <BriefingCard type="exchange" data={exchangeBriefing} />}
          {interestBriefing && <BriefingCard type="interest" data={interestBriefing} />}
          <ProductRecommendationList products={products} />
        </div>
      </div>
    </div>
  );
}
