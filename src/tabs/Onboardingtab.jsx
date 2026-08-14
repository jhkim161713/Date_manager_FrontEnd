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
    : '중립'

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

function ChoiceCard({ option, side, axisColor, selectedOptionId, onSelect, cardRef }) {
  const isSelected = selectedOptionId === option.id
  const isDimmed = selectedOptionId && !isSelected

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(option, side)}
      disabled={Boolean(selectedOptionId)}
      className={`group relative overflow-hidden rounded-[28px] border-[3px] border-white bg-[#211b20] text-left shadow-[0_18px_46px_rgba(73,39,52,0.18)] transition-all duration-300 focus:outline-none focus-visible:ring-4 ${
        isSelected
          ? ''
          : 'hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(73,39,52,0.25)]'
      } ${isDimmed ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
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

export function OnboardingTab({ onComplete, onSkip, embedded = false, skippable = true }) {
  const [phase, setPhase] = useState('intro')
  const [rounds, setRounds] = useState(createRounds)
  const [roundIndex, setRoundIndex] = useState(0)
  const [responses, setResponses] = useState([])
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [winner, setWinner] = useState(null)
  const [winnerAnimateIn, setWinnerAnimateIn] = useState(false)
  const advanceTimerRef = useRef(null)
  const cardRefs = useRef({})
  const optionsGridRef = useRef(null)

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
    setWinner(null)
    setWinnerAnimateIn(false)
    setPhase('compare')
  }

  // "모르겠다"를 고르면 중앙에 띄울 사진이 없으니 위너 연출 없이 바로 다음 단계로 넘어간다.
  // winner state는 비동기라 setTimeout 콜백 안에서 최신값을 못 믿으므로, hasWinner를 인자로 직접 넘긴다.
  const submitResponse = (response, selectionMarker, hasWinner = false) => {
    if (!currentRound || selectedOptionId) return

    setSelectedOptionId(selectionMarker)
    const nextResponses = [...responses, response]
    const isFinalRound = roundIndex === rounds.length - 1

    advanceTimerRef.current = window.setTimeout(() => {
      setResponses(nextResponses)
      setSelectedOptionId(null)

      if (hasWinner) {
        // 위너 컷을 보여준 뒤 다음 단계(다음 라운드 또는 결과 화면)로 넘어가는 건
        // winner 페이즈의 useEffect가 이어서 처리한다.
        setPhase('winner')
      } else if (isFinalRound) {
        setPhase('result')
      } else {
        setRoundIndex(index => index + 1)
      }
    }, ADVANCE_DELAY)
  }

  const chooseOption = (option, side) => {
    const rejectedOption = currentRound.options.find(item => item.id !== option.id)
    const isFinalRound = roundIndex === rounds.length - 1
    let hasWinner = false

    // 마지막 라운드뿐 아니라 매 라운드마다 선택한 사진이 그리드 중앙으로 확대 이동하는
    // 위너 컷 연출을 보여준다.
    const node = cardRefs.current[option.id]
    const gridRect = optionsGridRef.current?.getBoundingClientRect()
    if (node && gridRect) {
      setWinner({
        option,
        rect: node.getBoundingClientRect(),
        // 뷰포트 정중앙이 아니라, 두 사진이 놓여 있던 그리드 영역의 중앙으로 보내기 위한 좌표.
        center: { x: gridRect.left + gridRect.width / 2, y: gridRect.top + gridRect.height / 2 },
        isFinalRound,
      })
      hasWinner = true
    }

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
      hasWinner,
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

  // 위너 컷 진입 직후 한 프레임 쉬었다가 중앙으로 확대 이동시키고(FLIP 애니메이션), 잠시 멈춰서
  // 보여준 다음 다음 라운드로(마지막이었으면 결과 화면으로) 넘어간다.
  useEffect(() => {
    if (phase !== 'winner') return undefined

    // rAF를 한 번만 걸면 초기 위치(rect)가 실제로 화면에 그려지기 전에 중앙 위치 스타일까지
    // 같은 프레임에 반영돼버려서 transition이 생략되고 최종 상태로 바로 점프한다(이동 없이
    // 확대만 되는 것처럼 보이는 원인). 한 프레임 더 미뤄서 초기 위치가 먼저 페인트되게 한다.
    let raf2 = null
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setWinnerAnimateIn(true))
    })
    const advance = window.setTimeout(() => {
      setWinnerAnimateIn(false)
      setWinner(null)
      if (winner?.isFinalRound) {
        setPhase('result')
      } else {
        setRoundIndex(index => index + 1)
        setPhase('compare')
      }
    }, 1700)

    return () => {
      window.cancelAnimationFrame(raf1)
      if (raf2 !== null) window.cancelAnimationFrame(raf2)
      window.clearTimeout(advance)
    }
  }, [phase, winner])

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
          <div className="mx-auto mb-5 grid h-24 w-24 place-items-center overflow-hidden rounded-3xl bg-white shadow-lg">
            <img src={dmLogo} alt="DM 로고" className="h-[5.5rem] w-[5.5rem] object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-[#3d2c35] sm:text-4xl">
            두 사진 중 더 끌리는 쪽을,<br />6번만 골라주세요
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-stone-500">
            매 라운드마다 같은 취향 축의 두 사진이 함께 나와요.<br></br> 오래 고민하지 말고 첫 느낌으로 골라주세요.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERSONA_AXES.map(axis => (
              <div key={axis.id} className="rounded-2xl border border-[#ffd6e0] bg-white/80 px-3 py-2.5 text-left">
                <p className="text-xs font-extrabold" style={{ color: axis.color }}>{axis.koreanLabel}</p>
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
          {skippable && (
            <button
              type="button"
              onClick={onSkip}
              className="mt-3 px-4 py-2 text-xs font-bold text-stone-400 transition hover:text-stone-600"
            >
              다음에 할게요
            </button>
          )}
        </section>
      </div>
    )
  }

  if (phase === 'winner' && winner) {
    const { option, rect, center } = winner
    // 뷰포트 전체가 아니라 원래 사진이 있던 크기를 기준으로 살짝만 키운다(제자리에서 확대되는
    // 느낌이 아니라 실제로 커지면서 그리드 중앙으로 이동하는 게 보이도록).
    // 가로/세로에 각각 다른 상한을 걸면 둘 중 하나만 뷰포트 제한에 걸려서 원본 비율이 깨진 채로
    // 커지는(찌그러지는) 문제가 있었다 - 하나의 배율만 구해서 가로세로에 동일하게 적용한다.
    const growScale = Math.min(1.15, (window.innerWidth * 0.9) / rect.width, (window.innerHeight * 0.62) / rect.height)
    const targetWidth = rect.width * growScale
    const targetHeight = rect.height * growScale
    // translate(-50%, -50%) 퍼센트 트릭 대신 목표 좌상단 좌표를 직접 픽셀로 계산한다 - width/height와
    // 퍼센트 변환이 동시에 애니메이션되면 퍼센트 기준(요소 자기 크기)이 계속 바뀌면서 이동 경로가
    // 휘어 보이는 문제가 있었다.
    const targetTop = center.y - targetHeight / 2
    const targetLeft = center.x - targetWidth / 2
    const flyingStyle = winnerAnimateIn
      ? {
          top: `${targetTop}px`,
          left: `${targetLeft}px`,
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
        }
      : {
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }

    return (
      <div className={`relative ${viewportClass}`} style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}>
        <div
          className="fixed inset-0 z-40 bg-[#211b20] transition-opacity duration-700"
          style={{ opacity: winnerAnimateIn ? 0.55 : 0 }}
        />
        <div
          className="fixed z-50 overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(73,39,52,0.35)]"
          style={{
            position: 'fixed',
            ...flyingStyle,
            transition: 'top 700ms cubic-bezier(0.22,1,0.36,1), left 700ms cubic-bezier(0.22,1,0.36,1), width 700ms cubic-bezier(0.22,1,0.36,1), height 700ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <img src={option.image} alt={option.alt} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/70" />
          <div
            className="absolute inset-x-0 bottom-0 p-5 text-white transition-opacity duration-500"
            style={{ opacity: winnerAnimateIn ? 1 : 0 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">최종 선택</p>
            <p className="mt-1 text-xl font-extrabold">{option.label}</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div
        className={`flex items-center ${viewportClass} overflow-y-auto px-5 py-8 sm:py-12`}
        style={{ background: 'linear-gradient(145deg, #fff8f4 0%, #fff0f3 48%, #f3ebfb 100%)' }}
      >
        <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(111,64,83,0.14)] backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-[#3d2c35]">나의 문화생활 성향</h1>
            <p className="mt-2 text-sm text-stone-500">
              방금 고른 선택들로 나의 첫 성향 점수를 만들었어요.
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
              Date Manager 시작하기
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
        <div className="flex items-center gap-5">
          <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl">
            <img src={dmLogo} alt="DM 로고" className="h-[4.5rem] w-[4.5rem] object-contain" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-[#3d2c35]">당신의 문화생활 취향을 분석하고 있어요</p>
          </div>
        </div>

        {skippable && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl px-3 py-2 text-xs font-bold text-stone-400 transition hover:bg-white/70 hover:text-stone-600"
          >
            나중에
          </button>
        )}
      </header>

      <div className="mx-auto mt-4 w-full max-w-3xl">
        <div className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff6b8a] to-[#c4a0e8] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-5">
        <div className="mb-4 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: currentAxis.color }}>
            {roundIndex + 1}라운드 · {currentAxis.koreanLabel}
          </p>
          <h1 className="font-display mt-1 text-2xl font-extrabold text-[#3d2c35] sm:text-3xl">
            {currentAxis.question}
          </h1>
        </div>

        <div ref={optionsGridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {currentRound.options.map((option, index) => (
            <ChoiceCard
              key={option.id}
              option={option}
              side={index === 0 ? 'left' : 'right'}
              axisColor={currentAxis.color}
              selectedOptionId={selectedOptionId}
              onSelect={chooseOption}
              cardRef={(node) => { cardRefs.current[option.id] = node }}
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
            모르겠다
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
