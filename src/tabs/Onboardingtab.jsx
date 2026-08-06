import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ONBOARDING_MATCHUPS,
  PERSONA_AXES,
  buildPersonaResult,
} from '../data/onboardingData'
import dmLogo from '../imports/Logo.png'

const ADVANCE_DELAY = 360

function createRounds() {
  return ONBOARDING_MATCHUPS.map(matchup => ({
    ...matchup,
    options: Math.random() < 0.5
      ? [...matchup.options]
      : [...matchup.options].reverse(),
  }))
}

function AxisGauge({ axis, detail }) {
  const isHigh = detail.preference === 'high'
  const selectedDirection = detail.preference
    ? (isHigh ? axis.highLabel : axis.lowLabel)
    : '미선택'

  return (
    <div className="rounded-2xl border border-[#ffd6e0] bg-white/90 px-4 py-3.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#3d2c35]">{axis.label}</p>
          <p className="text-[11px] font-semibold text-stone-400">{axis.koreanLabel}</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-extrabold"
          style={{ color: axis.color, background: `${axis.color}14` }}
        >
          {selectedDirection}
        </span>
      </div>

      <div className="relative h-2.5 rounded-full bg-[#f7edf0]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${detail.score}%`,
            background: `linear-gradient(90deg, ${axis.color}70, ${axis.color})`,
          }}
        />
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow"
          style={{ left: `${detail.score}%`, background: axis.color }}
        />
      </div>

      <div className="mt-1.5 flex justify-between gap-3 text-[10px] font-semibold text-stone-400">
        <span>{axis.lowLabel}</span>
        <span className="text-right">{axis.highLabel}</span>
      </div>
    </div>
  )
}

function ChoiceCard({ option, side, axisColor, selectedOptionId, onSelect }) {
  const isSelected = selectedOptionId === option.id
  const isDimmed = selectedOptionId && !isSelected

  return (
    <button
      type="button"
      onClick={() => onSelect(option, side)}
      disabled={Boolean(selectedOptionId)}
      className={`group relative overflow-hidden rounded-[28px] border-[3px] bg-[#211b20] text-left shadow-[0_18px_46px_rgba(73,39,52,0.18)] transition-all duration-300 focus:outline-none focus-visible:ring-4 ${
        isSelected
          ? 'scale-[1.025] border-white ring-4 ring-white/80'
          : 'border-white hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(73,39,52,0.25)]'
      } ${isDimmed ? 'scale-[0.98] opacity-45' : 'opacity-100'}`}
      style={{ '--tw-ring-color': `${axisColor}55` }}
      aria-label={`${option.label} 선택`}
    >
      <div className="relative h-[clamp(230px,42vh,470px)] overflow-hidden">
        <img
          src={option.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
          draggable="false"
        />
        <div className="absolute inset-0 bg-black/15" />
        <img
          src={option.image}
          alt={option.alt}
          className="relative z-10 h-full w-full object-contain"
          draggable="false"
        />
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/5 via-transparent to-black/75" />

        <span className="absolute left-4 top-4 z-30 rounded-full border border-white/35 bg-black/30 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white backdrop-blur-md">
          {side === 'left' ? 'LEFT' : 'RIGHT'}
        </span>

        {isSelected && (
          <span className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-lg" style={{ color: axisColor }}>
            ✓
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 z-30 p-5 text-white sm:p-6">
          <p className="text-lg font-extrabold sm:text-xl">{option.label}</p>
          <p className="mt-1 text-xs font-semibold text-white/70">
            {option.label2}
          </p>
        </div>
      </div>
    </button>
  )
}

export function OnboardingTab({ onComplete, onSkip, embedded = false }) {
  const [phase, setPhase] = useState('intro')
  const [rounds, setRounds] = useState(createRounds)
  const [roundIndex, setRoundIndex] = useState(0)
  const [responses, setResponses] = useState([])
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const advanceTimerRef = useRef(null)

  const viewportClass = embedded
    ? 'min-h-[calc(100vh-140px)] rounded-[28px]'
    : 'min-h-screen'
  const currentRound = rounds[roundIndex]
  const currentAxis = PERSONA_AXES.find(axis => axis.id === currentRound?.axis)
  const progress = ((roundIndex + 1) / rounds.length) * 100
  const personaResult = useMemo(() => buildPersonaResult(responses), [responses])

  useEffect(() => () => window.clearTimeout(advanceTimerRef.current), [])

  const startOnboarding = () => {
    window.clearTimeout(advanceTimerRef.current)
    setRounds(createRounds())
    setRoundIndex(0)
    setResponses([])
    setSelectedOptionId(null)
    setPhase('compare')
  }

  const submitResponse = (response, selectionMarker) => {
    if (!currentRound || selectedOptionId) return

    setSelectedOptionId(selectionMarker)
    const nextResponses = [...responses, response]

    advanceTimerRef.current = window.setTimeout(() => {
      setResponses(nextResponses)
      setSelectedOptionId(null)

      if (roundIndex === rounds.length - 1) {
        setPhase('result')
      } else {
        setRoundIndex(index => index + 1)
      }
    }, ADVANCE_DELAY)
  }

  const chooseOption = (option, side) => {
    const rejectedOption = currentRound.options.find(item => item.id !== option.id)

    submitResponse(
      {
        matchupId: currentRound.id,
        axis: currentRound.axis,
        answerType: 'choice',
        selectedOptionId: option.id,
        selectedVariant: option.variant,
        selectedLabel: option.label,
        selectedSide: side,
        rejectedOptionId: rejectedOption?.id ?? null,
      },
      option.id,
    )
  }

  const chooseNeutral = () => {
    submitResponse(
      {
        matchupId: currentRound.id,
        axis: currentRound.axis,
        answerType: 'neutral',
        selectedOptionId: null,
        selectedVariant: null,
        selectedLabel: '모르겠다',
        selectedSide: 'center',
        rejectedOptionId: null,
      },
      'neutral',
    )
  }

  const undoLastChoice = () => {
    if (roundIndex === 0 || selectedOptionId) return
    setResponses(previous => previous.slice(0, -1))
    setRoundIndex(index => index - 1)
  }

  useEffect(() => {
    if (phase !== 'compare' || !currentRound) return undefined

    const handleKeyDown = event => {
      if (selectedOptionId) return

      if (event.key === 'ArrowLeft') {
        chooseOption(currentRound.options[0], 'left')
      }
      if (event.key === 'ArrowRight') {
        chooseOption(currentRound.options[1], 'right')
      }
      if (event.key === 'ArrowUp') {
        chooseNeutral()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentRound, selectedOptionId, responses])

  const completeOnboarding = () => {
    onComplete?.(personaResult)
  }

  if (phase === 'intro') {
    return (
      <div
        className={`relative flex ${viewportClass} items-center justify-center overflow-hidden px-5 py-10`}
        style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}
      >
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#ffd6e0]/45 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#c4a0e8]/30 blur-3xl" />

        <section className="relative z-10 w-full max-w-2xl rounded-[32px] border border-white/80 bg-white/80 p-7 text-center shadow-[0_24px_80px_rgba(111,64,83,0.14)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-3xl bg-white shadow-lg">
            <img src={dmLogo} alt="DM 로고" className="h-14 w-14 object-contain" />
          </div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#ff6b8a]">
            Persona World Cup
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-[#3d2c35] sm:text-4xl">
            둘 중 더 끌리는 데이트를<br />6번만 선택해 주세요
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-stone-500">
            매 라운드마다 같은 취향 축의 두 사진이 함께 나와요. 오래 고민하지 말고 첫 느낌으로 골라주세요.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERSONA_AXES.map(axis => (
              <div key={axis.id} className="rounded-2xl border border-[#ffd6e0] bg-white/80 px-3 py-2.5 text-left">
                <p className="text-xs font-extrabold" style={{ color: axis.color }}>{axis.label}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-stone-400">
                  {axis.lowLabel} vs {axis.highLabel}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startOnboarding}
            className="mt-7 w-full rounded-2xl bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(255,107,138,0.28)] transition hover:-translate-y-0.5"
          >
            이상형 월드컵 시작하기
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="mt-3 px-4 py-2 text-xs font-bold text-stone-400 transition hover:text-stone-600"
          >
            다음에 할게요
          </button>
        </section>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div
        className={`${viewportClass} overflow-y-auto px-5 py-8 sm:py-12`}
        style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}
      >
        <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(111,64,83,0.14)] backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-extrabold text-[#ff6b8a]">
              6 / 6 선택 완료
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-[#3d2c35]">나의 데이트 페르소나</h1>
            <p className="mt-2 text-sm text-stone-500">
              두 사진 중 선택한 결과를 6개의 취향 축으로 정리했어요.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {PERSONA_AXES.map(axis => (
              <AxisGauge key={axis.id} axis={axis} detail={personaResult.details[axis.id]} />
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={startOnboarding}
              className="rounded-2xl border border-[#ffd6e0] bg-white px-5 py-3 text-sm font-extrabold text-[#ff6b8a] transition hover:bg-[#fff8fa] sm:flex-1"
            >
              다시 선택하기
            </button>
            <button
              type="button"
              onClick={completeOnboarding}
              className="rounded-2xl bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(255,107,138,0.24)] transition hover:-translate-y-0.5 sm:flex-[1.4]"
            >
              결과 저장하고 돌아가기
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div
      className={`relative flex ${viewportClass} flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-6`}
      style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white shadow">
            <img src={dmLogo} alt="DM 로고" className="h-9 w-9 object-contain" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[#3d2c35]">취향 월드컵</p>
            <p className="text-[10px] font-bold text-stone-400">PAIR COMPARISON</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl px-3 py-2 text-xs font-bold text-stone-400 transition hover:bg-white/70 hover:text-stone-600"
        >
          나중에
        </button>
      </header>

      <div className="mx-auto mt-4 w-full max-w-3xl">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span style={{ color: currentAxis.color }}>{roundIndex + 1} / {rounds.length}</span>
          <span className="text-stone-400">← 왼쪽 · 오른쪽 →</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-5">
        <div className="mb-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: currentAxis.color }}>
            {currentAxis.label} · {currentAxis.koreanLabel}
          </p>
          <h1 className="mt-1 text-xl font-extrabold text-[#3d2c35] sm:text-2xl">
            {currentAxis.question}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {currentRound.options.map((option, index) => (
            <ChoiceCard
              key={option.id}
              option={option}
              side={index === 0 ? 'left' : 'right'}
              axisColor={currentAxis.color}
              selectedOptionId={selectedOptionId}
              onSelect={chooseOption}
            />
          ))}
        </div>

        <div className="mx-auto mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
          <button
            type="button"
            onClick={chooseNeutral}
            disabled={Boolean(selectedOptionId)}
            className="rounded-2xl border border-[#ffd6e0] bg-white px-5 py-2.5 text-xs font-extrabold text-[#ff6b8a] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            ? 모르겠다
          </button>
          <button
            type="button"
            onClick={undoLastChoice}
            disabled={roundIndex === 0 || Boolean(selectedOptionId)}
            className="rounded-2xl border border-[#ffd6e0] bg-white px-5 py-2.5 text-xs font-extrabold text-stone-500 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            ↶ 이전 선택
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold text-stone-400">
          
        </p>
      </main>
    </div>
  )
}
