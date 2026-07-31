import { useState } from "react";
import { QUESTIONS, TYPE_RESULT } from "../data/tendencyData";
import { SectionTitle } from "../components/SectionTitle";



export function TendencyTab() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<string | null>(null)

  const choose = (type: string) => {
    const next = [...answers, type]
    if (step < QUESTIONS.length - 1) {
      setAnswers(next)
      setStep(s => s + 1)
    } else {
      const counts: Record<string, number> = {}
      next.forEach(t => { counts[t] = (counts[t] ?? 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
      setResult(top)
    }
  }

  const reset = () => { setStep(0); setAnswers([]); setResult(null) }

  if (result) {
    const r = TYPE_RESULT[result]
    return (
      <div className="space-y-6">
        <SectionTitle sub="테스트 결과가 나왔어요!">💡 우리 커플 유형</SectionTitle>
        <div className="rounded-3xl p-6 text-center" style={{ background: `linear-gradient(135deg, ${r.color}20, ${r.bg})`, border: `1.5px solid ${r.color}40` }}>
          <span className="text-5xl">{r.emoji}</span>
          <h3 className="font-display font-bold text-2xl mt-3" style={{ color: r.color }}>{r.label}</h3>
          <p className="text-sm text-stone-600 mt-3 leading-relaxed">{r.desc}</p>
        </div>
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: '#3d2c35' }}>🎯 추천 데이트 코스</p>
          <div className="space-y-2">
            {r.recommend.map((rec, i) => (
              <div key={i} className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white" style={{ border: '1.5px solid #ffd6e0' }}>
                <span className="font-display font-bold text-lg" style={{ color: r.color }}>{i + 1}</span>
                <span className="text-sm font-semibold" style={{ color: '#3d2c35' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={reset} className="w-full py-3 rounded-2xl font-bold text-sm" style={{ border: '1.5px solid #ffd6e0', color: '#ff6b8a', background: 'white' }}>
          다시 테스트하기
        </button>
      </div>
    )
  }

  const q = QUESTIONS[step]
  return (
    <div className="space-y-6">
      <SectionTitle sub="솔직하게 골라봐요!">💡 커플 성향 테스트</SectionTitle>
      <div className="rounded-2xl px-4 py-2 flex gap-1" style={{ background: '#fff0f3' }}>
        {QUESTIONS.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= step ? '#ff6b8a' : '#ffd6e0' }} />
        ))}
      </div>
      <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(135deg, #fff0f3, #f5eef9)', border: '1.5px solid #ffd6e0' }}>
        <p className="text-xs font-bold text-stone-400 mb-2">{step + 1} / {QUESTIONS.length}</p>
        <p className="font-display font-bold text-lg leading-snug" style={{ color: '#3d2c35' }}>{q.q}</p>
      </div>
      <div className="space-y-2.5">
        {q.options.map(opt => (
          <button key={opt.type} onClick={() => choose(opt.type)}
            className="w-full rounded-2xl px-5 py-4 text-left text-sm font-semibold transition-all hover:scale-[1.01] hover:shadow-md bg-white"
            style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35' }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
