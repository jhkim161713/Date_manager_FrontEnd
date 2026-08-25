import { WEEKDAYS, colorFor, formatDate } from '../../lib/calendarDisplay';

export function MonthView({ year, month, eventsByDate, isToday }) {
  // 달력 그리드 칸 계산 (앞쪽 빈칸 + 실제 날짜들)
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  return (
    <div className="px-3 pb-4">
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className="text-center text-[11px] font-bold py-1.5"
            style={{ color: i === 0 ? '#ff6b8a' : i === 6 ? '#7c9cff' : '#999' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-[74px] rounded-lg" style={{ background: '#fbfafa' }} />;

          const key = formatDate(new Date(year, month, day));
          const events = eventsByDate[key] || [];
          const col = i % 7;

          return (
            <div
              key={i}
              className="min-h-[74px] rounded-lg p-1 flex flex-col gap-0.5"
              style={{ background: isToday(day) ? '#fff0f4' : 'white', border: isToday(day) ? '1.5px solid #ff9fb5' : '1px solid #f5eef1' }}
            >
              <span
                className="text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                style={{
                  color: isToday(day) ? 'white' : col === 0 ? '#ff6b8a' : col === 6 ? '#7c9cff' : '#3d2c35',
                  background: isToday(day) ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : 'transparent',
                }}
              >
                {day}
              </span>
              <div className="flex flex-col gap-0.5">
                {events.slice(0, 2).map((ev) => {
                  const c = colorFor(ev.id);
                  return (
                    <span
                      key={ev.id}
                      className="text-[9px] font-semibold px-1 py-[1px] rounded truncate leading-tight"
                      style={{ background: c.bg, color: c.text }}
                      title={ev.title}
                    >
                      {ev.title}
                    </span>
                  );
                })}
                {events.length > 2 && (
                  <span className="text-[9px] font-semibold pl-1" style={{ color: '#c9b8c2' }}>
                    +{events.length - 2}개 더보기
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
