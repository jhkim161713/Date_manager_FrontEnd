import { COUPLE_SINK_STEPS } from '../../data/coupleSink';

// 미연결 상태일 때 보이는 우측 사이드바 - "이렇게 연결돼요" 단계 안내. CoupleTab.jsx에서 그대로 옮김.
export function ConnectionStepsAside() {
  return (
    <aside className="rounded-[26px] p-5 md:p-6" style={{ background: '#fff6ef', border: '1.5px solid #f6dfce' }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ background: '#ffe8d6' }}>🫶</div>
      <h3 className="font-display mt-4 text-lg font-bold" style={{ color: '#49363f' }}>이렇게 연결돼요</h3>
      <div className="mt-5 space-y-4">
        {COUPLE_SINK_STEPS.map((step, index) => (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-extrabold" style={{ color: '#e27676', border: '1px solid #f1c9c1' }}>{index + 1}</span>
              {index < COUPLE_SINK_STEPS.length - 1 && <span className="mt-1 h-7 w-px" style={{ background: '#eed3ca' }} />}
            </div>
            <div className="pt-1">
              <p className="text-xs font-extrabold" style={{ color: '#5c4651' }}>{step.title}</p>
              <p className="mt-0.5 text-[10px] leading-4" style={{ color: '#9d878f' }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white/70 p-3.5">
        <p className="text-[10px] leading-4" style={{ color: '#8e747e' }}>
          <strong style={{ color: '#d06179' }}>안심하세요.</strong> 연결은 언제든 해제할 수 있어요.
        </p>
      </div>
    </aside>
  );
}
