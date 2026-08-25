import { WEEKDAYS, colorFor, formatDate, isSameDate } from '../../lib/calendarDisplay';

export function WeekView({ weekDates, eventsByDate, today, goPrevWeek, goNextWeek }) {
  return (
    <div className="px-3 pb-4">
      {/* 주간 이동 */}
      <div className="flex items-center justify-between px-2 pb-3">
        <button
          onClick={goPrevWeek}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5"
          style={{ color: '#999' }}
        >
          ◁
        </button>

        <span className="text-[12px] font-bold" style={{ color: '#3d2c35' }}>
          {weekDates[0].getFullYear()}년 {weekDates[0].getMonth() + 1}월{' '}
          {weekDates[0].getDate()}일 ~{' '}
          {weekDates[6].getMonth() + 1}월 {weekDates[6].getDate()}일
        </span>

        <button
          onClick={goNextWeek}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5"
          style={{ color: '#999' }}
        >
          ▷
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 gap-[3px]">
        {weekDates.map((date, i) => {
          const key = formatDate(date);
          const events = eventsByDate[key] || [];
          const todayCheck = isSameDate(date, today);

          return (
            <div
              key={key}
              className="min-h-[150px] rounded-xl p-1.5 flex flex-col"
              style={{
                background: todayCheck ? '#fff0f4' : 'white',
                border: todayCheck
                  ? '1.5px solid #ff9fb5'
                  : '1px solid #f5eef1',
              }}
            >
              {/* 날짜 */}
              <div className="flex flex-col items-center mb-2">
                <span
                  className="text-[10px] font-bold mb-0.5"
                  style={{
                    color:
                      i === 0
                        ? '#ff6b8a'
                        : i === 6
                          ? '#7c9cff'
                          : '#a8909a',
                  }}
                >
                  {WEEKDAYS[i]}
                </span>

                <span
                  className="text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                  style={{
                    color: todayCheck
                      ? 'white'
                      : i === 0
                        ? '#ff6b8a'
                        : i === 6
                          ? '#7c9cff'
                          : '#3d2c35',
                    background: todayCheck
                      ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)'
                      : 'transparent',
                  }}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* 일정 */}
              <div className="flex flex-col gap-1">
                {events.length === 0 && (
                  <span
                    className="text-[9px] text-center py-2"
                    style={{ color: '#ddd2d8' }}
                  >
                    일정 없음
                  </span>
                )}

                {events.map((ev) => {
                  const c = colorFor(ev.id);

                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg px-1.5 py-1.5"
                      style={{
                        background: c.bg,
                        border: `1px solid ${c.bg}`,
                      }}
                    >
                      <div
                        className="text-[9px] font-bold truncate"
                        style={{ color: c.text }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>

                      {ev.description && (
                        <div
                          className="text-[8px] mt-0.5 truncate"
                          style={{ color: '#a8909a' }}
                          title={ev.description}
                        >
                          {ev.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
