import { useState } from 'react';

const WIDTH = 560;
const HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 };

// 단일 시리즈 추이 라인 차트 (방문자/구독자 등). data: [{ date: 'YYYY-MM-DD', count: number }]
// 시리즈가 하나뿐이라 범례는 생략하고(제목이 이미 무엇인지 말해줌), 호버 시 크로스헤어+툴팁을 보여준다.
export function TrendLineChart({ data, color = '#ff6b8a' }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;
  // 1로 바닥을 깔아둬야 전부 0인 날짜만 있을 때(0/0) 나누기 결과가 NaN이 되는 걸 막는다.
  const maxValue = Math.max(1, ...data.map(d => d.count));

  const points = data.map((d, i) => {
    const x = PADDING.left + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1));
    const y = PADDING.top + innerH - (innerH * d.count) / maxValue;
    return { ...d, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const gridLines = [0, 0.5, 1];

  // 마우스 x좌표를 실제 렌더 크기(rect.width)에서 viewBox 좌표계(WIDTH)로 환산한 뒤,
  // 그 지점에서 가장 가까운 데이터 포인트를 찾아 호버 상태로 표시한다.
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full" style={{ maxWidth: WIDTH }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img"
        onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)}>
        {/* recessive grid */}
        {gridLines.map(t => {
          const y = PADDING.top + innerH * (1 - t);
          return (
            <line key={t} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y}
              stroke="#f0e4e8" strokeWidth="1" />
          );
        })}

        {/* crosshair */}
        {hovered && (
          <line x1={hovered.x} x2={hovered.x} y1={PADDING.top} y2={PADDING.top + innerH}
            stroke="#ffd6e0" strokeWidth="1" />
        )}

        {/* line, thin with rounded caps */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* data-end markers */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === hoverIndex ? 4.5 : 3}
            fill={color} stroke="white" strokeWidth="1.5" />
        ))}

        {/* x-axis date labels (every point, short format) */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={HEIGHT - 8} textAnchor="middle" fontSize="9" fill="#a89aa0">
            {p.date.slice(5)}
          </text>
        ))}
      </svg>

      {hovered && (
        <div className="absolute pointer-events-none rounded-xl px-2.5 py-1.5 text-xs font-bold"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
            transform: 'translate(-50%, -130%)',
            background: '#3d2c35', color: 'white', whiteSpace: 'nowrap',
          }}>
          {hovered.date} · {hovered.count}
        </div>
      )}
    </div>
  );
}
