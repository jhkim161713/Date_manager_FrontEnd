import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ONBOARDING_CARDS,
  PERSONA_AXES,
  buildPersonaResult,
} from '../data/onboardingData'

const SWIPE_THRESHOLD = 90
const EXIT_DISTANCE = 560

function AxisGauge({ axis, score }) {
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
          {score}
        </span>
      </div>

      <div className="relative h-2.5 rounded-full bg-[#f7edf0]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${axis.color}70, ${axis.color})`,
          }}
        />
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow"
          style={{ left: `${score}%`, background: axis.color }}
        />
      </div>

      <div className="mt-1.5 flex justify-between gap-3 text-[10px] font-semibold text-stone-400">
        <span>{axis.lowLabel}</span>
        <span className="text-right">{axis.highLabel}</span>
      </div>
    </div>
  )
}

export function OnboardingTab({ onComplete, onSkip, embedded = false }) {
  const [phase, setPhase] = useState('intro')
  const [cardIndex, setCardIndex] = useState(0)
  const [responses, setResponses] = useState([])
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const viewportClass = embedded
    ? 'min-h-[calc(100vh-140px)] rounded-[28px]'
    : 'min-h-screen'

  const dragStartRef = useRef({ x: 0, y: 0, pointerId: null })
  const exitTimerRef = useRef(null)

  const currentCard = ONBOARDING_CARDS[cardIndex]
  const nextCard = ONBOARDING_CARDS[cardIndex + 1]
  const progress = ((cardIndex + 1) / ONBOARDING_CARDS.length) * 100
  const personaResult = useMemo(() => buildPersonaResult(responses), [responses])

  useEffect(() => () => clearTimeout(exitTimerRef.current), [])

  const resetCardPosition = () => {
    setDragX(0)
    setDragY(0)
    setIsDragging(false)
  }

  const chooseCard = (value, direction) => {
    if (!currentCard || isExiting) return

    setIsExiting(true)
    setIsDragging(false)

    if (direction === 0) {
      setDragY(-240)
      setDragX(0)
    } else {
      setDragX(direction * EXIT_DISTANCE)
      setDragY(20)
    }

    exitTimerRef.current = setTimeout(() => {
      const nextResponses = [
        ...responses,
        {
          cardId: currentCard.id,
          axis: currentCard.axis,
          variant: currentCard.variant,
          polarity: currentCard.polarity,
          value,
        },
      ]

      setResponses(nextResponses)
      setDragX(0)
      setDragY(0)
      setIsExiting(false)

      if (cardIndex === ONBOARDING_CARDS.length - 1) {
        setPhase('result')
      } else {
        setCardIndex(index => index + 1)
      }
    }, 230)
  }

  useEffect(() => {
    if (phase !== 'swipe') return undefined

    const handleKeyDown = event => {
      if (isExiting) return

      if (event.key === 'ArrowLeft') chooseCard(-1, -1)
      if (event.key === 'ArrowRight') chooseCard(1, 1)
      if (event.key === 'ArrowUp' || event.key === ' ') chooseCard(0, 0)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, isExiting, cardIndex, responses])

  const handlePointerDown = event => {
    if (isExiting) return

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = event => {
    if (!isDragging || dragStartRef.current.pointerId !== event.pointerId) return

    setDragX(event.clientX - dragStartRef.current.x)
    setDragY((event.clientY - dragStartRef.current.y) * 0.15)
  }

  const handlePointerUp = event => {
    if (!isDragging || dragStartRef.current.pointerId !== event.pointerId) return

    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      chooseCard(dragX > 0 ? 1 : -1, dragX > 0 ? 1 : -1)
      return
    }

    resetCardPosition()
  }

  const startOnboarding = () => {
    clearTimeout(exitTimerRef.current)
    setCardIndex(0)
    setResponses([])
    setIsExiting(false)
    resetCardPosition()
    setPhase('swipe')
  }

  const undoLastAnswer = () => {
    if (cardIndex === 0 || isExiting) return
    setResponses(previous => previous.slice(0, -1))
    setCardIndex(index => index - 1)
    resetCardPosition()
  }

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

        <section className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/80 bg-white/80 p-7 text-center shadow-[0_24px_80px_rgba(111,64,83,0.14)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[#ff6b8a] to-[#c4a0e8] text-2xl font-black text-white shadow-lg">
            DM
          </div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#ff6b8a]">
            Persona Discovery
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-[#3d2c35] sm:text-4xl">
            당신의 데이트 취향을<br />12장의 이미지로 발견해요
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone-500">
            고민하지 말고 첫 느낌으로 골라주세요. 오른쪽은 좋아요, 왼쪽은 패스예요.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERSONA_AXES.map(axis => (
              <div key={axis.id} className="rounded-2xl border border-[#ffd6e0] bg-white/80 px-3 py-2.5 text-left">
                <p className="text-xs font-extrabold" style={{ color: axis.color }}>{axis.label}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-stone-400">{axis.koreanLabel}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startOnboarding}
            className="mt-7 w-full rounded-2xl bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(255,107,138,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(255,107,138,0.34)]"
          >
            취향 카드 시작하기
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
    const strongestAxis = PERSONA_AXES.reduce((strongest, axis) => {
      const distance = Math.abs(personaResult.scores[axis.id] - 50)
      return distance > strongest.distance ? { axis, distance } : strongest
    }, { axis: PERSONA_AXES[0], distance: -1 }).axis
    const strongestScore = personaResult.scores[strongestAxis.id]
    const strongestDirection = strongestScore >= 50 ? strongestAxis.highLabel : strongestAxis.lowLabel

    return (
      <div
        className={`${viewportClass} overflow-y-auto px-5 py-8 sm:py-12`}
        style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}
      >
        <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(111,64,83,0.14)] backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-extrabold text-[#ff6b8a]">
              12 / 12 완료
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-[#3d2c35]">나의 데이트 페르소나</h1>
            <p className="mt-2 text-sm text-stone-500">
              가장 선명한 취향은 <strong style={{ color: strongestAxis.color }}>{strongestAxis.label} · {strongestDirection}</strong> 쪽이에요.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {PERSONA_AXES.map(axis => (
              <AxisGauge key={axis.id} axis={axis} score={personaResult.scores[axis.id]} />
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={startOnboarding}
              className="rounded-2xl border border-[#ffd6e0] bg-white px-5 py-3 text-sm font-extrabold text-[#ff6b8a] transition hover:bg-[#fff8fa] sm:flex-1"
            >
              다시 테스트하기
            </button>
            <button
              type="button"
              onClick={completeOnboarding}
              className="rounded-2xl bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(255,107,138,0.24)] transition hover:-translate-y-0.5 sm:flex-[1.4]"
            >
              데이트 매니저 시작하기
            </button>
          </div>
        </section>
      </div>
    )
  }

  const rotate = dragX / 24
  const likeOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1)
  const passOpacity = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1)

  return (
    <div
      className={`relative flex ${viewportClass} flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6`}
      style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}
    >
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#ff6b8a] to-[#c4a0e8] text-xs font-black text-white shadow">
            DM
          </span>
          <div>
            <p className="text-sm font-extrabold text-[#3d2c35]">취향 탐색</p>
            <p className="text-[10px] font-bold text-stone-400">PERSONA DISCOVERY</p>
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

      <div className="mx-auto mt-4 w-full max-w-xl">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-[#ff6b8a]">{cardIndex + 1} / {ONBOARDING_CARDS.length}</span>
          <span className="text-stone-400">직감으로 골라주세요</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-4">
        <div
          className="relative w-full max-w-[440px]"
          style={{ height: 'clamp(390px, 59vh, 640px)' }}
        >
          <div className="absolute inset-x-4 inset-y-0 translate-y-3 scale-[0.96] overflow-hidden rounded-[30px] bg-white/70 shadow-lg">
            {nextCard && (
              <img
                src={nextCard.image}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover opacity-30 blur-[2px]"
                draggable="false"
              />
            )}
          </div>

          <article
            className="absolute inset-0 overflow-hidden rounded-[30px] border-[3px] border-white bg-white shadow-[0_24px_65px_rgba(73,39,52,0.25)] select-none"
            style={{
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              opacity: isExiting ? 0.4 : 1,
              transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotate}deg)`,
              transition: isDragging ? 'none' : 'transform 230ms ease, opacity 230ms ease',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={resetCardPosition}
          >
            <img
              src={currentCard.image}
              alt={currentCard.alt}
              className="h-full w-full object-cover"
              draggable="false"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/80" />

            <div
              className="pointer-events-none absolute left-5 top-5 -rotate-12 rounded-xl border-[3px] border-[#ff8ba3] bg-black/20 px-4 py-2 text-lg font-black tracking-wider text-[#ffb2c1] backdrop-blur-sm"
              style={{ opacity: passOpacity }}
            >
              PASS
            </div>
            <div
              className="pointer-events-none absolute right-5 top-5 rotate-12 rounded-xl border-[3px] border-[#7be2b7] bg-black/20 px-4 py-2 text-lg font-black tracking-wider text-[#a5f3d2] backdrop-blur-sm"
              style={{ opacity: likeOpacity }}
            >
              LIKE
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-white">
              <span className="inline-flex rounded-full border border-white/35 bg-black/20 px-3 py-1 text-[11px] font-extrabold backdrop-blur-sm">
                CARD {String(cardIndex + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold">이런 데이트, 끌리나요?</h2>
              <p className="mt-1 text-xs font-semibold text-white/75">사진을 좌우로 밀어 선택해 주세요.</p>
            </div>
          </article>
        </div>

        <div className="mt-5 flex w-full max-w-[440px] items-center justify-center gap-3">
          <button
            type="button"
            onClick={undoLastAnswer}
            disabled={cardIndex === 0 || isExiting}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#ffd6e0] bg-white text-lg text-stone-400 shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="이전 카드로 돌아가기"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => chooseCard(-1, -1)}
            disabled={isExiting}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#ffd6e0] bg-white px-4 text-sm font-extrabold text-[#e8486b] shadow-md transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <span className="text-lg">✕</span> 패스
          </button>
          <button
            type="button"
            onClick={() => chooseCard(1, 1)}
            disabled={isExiting}
            className="flex h-14 flex-[1.15] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] px-4 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(255,107,138,0.28)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <span className="text-lg">♥</span> 좋아요
          </button>
        </div>

        <button
          type="button"
          onClick={() => chooseCard(0, 0)}
          disabled={isExiting}
          className="mt-3 px-4 py-1.5 text-xs font-bold text-stone-400 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-600 disabled:opacity-50"
        >
          잘 모르겠어요
        </button>
        <p className="mt-1 text-[10px] font-semibold text-stone-400">키보드 ← 패스 · → 좋아요 · ↑ 모르겠어요</p>
      </main>
    </div>
  )
}
