const SIZE = 150;
const CENTER = SIZE / 2;
const RADIUS = 58;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SEGMENT_DEFS = [
  { key: 'male', label: '남성', color: '#8fb3e8' },
  { key: 'female', label: '여성', color: '#ff6b8a' },
  { key: 'unknown', label: '미확정', color: '#d9cdd3' },
];

// 회원 남녀 비율 도넛. 카테고리가 2~3개뿐이라 범례를 항상 함께 보여주고(색만으로 구분하지 않음),
// 각 항목에 인원수·퍼센트를 직접 라벨링한다.
export function GenderRatioDonut({ male = 0, female = 0, unknown = 0 }) {
  const total = male + female + unknown;
  const values = { male, female, unknown };
  const segments = SEGMENT_DEFS.filter(s => values[s.key] > 0);

  // 도넛은 실제 파이 조각(path)을 그리는 대신, 원 하나에 stroke-dasharray로
  // "보이는 길이/숨긴 길이"를 지정하고 stroke-dashoffset으로 시작점을 밀어내는
  // 흔한 트릭을 쓴다. cumulative가 지금까지 그린 비율의 누적값 - 다음 조각은
  // 그 지점부터 이어 그리도록 offset을 음수로 넘긴다. <g>를 -90도 돌려서 12시 방향부터 시작.
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="회원 남녀 비율">
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {total === 0 ? (
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f0e4e8" strokeWidth={STROKE} />
          ) : segments.map((s) => {
            const fraction = values[s.key] / total;
            const dash = fraction * CIRCUMFERENCE;
            const offset = -cumulative * CIRCUMFERENCE;
            cumulative += fraction;
            return (
              <circle key={s.key} cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={s.color} strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`} strokeDashoffset={offset} />
            );
          })}
        </g>
        <text x={CENTER} y={CENTER - 4} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#3d2c35">{total}</text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize="10" fill="#a89aa0">총 회원</text>
      </svg>

      <div className="flex flex-col gap-2">
        {SEGMENT_DEFS.map(s => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="font-bold" style={{ color: '#3d2c35' }}>{s.label}</span>
            <span style={{ color: '#a89aa0' }}>
              {values[s.key]}명 ({total ? Math.round((values[s.key] / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
