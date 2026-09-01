import { colorFor } from '../../lib/calendarDisplay';

export function ListView({ calendars, onDelete }) {
  return (
    <div className="px-4 pb-4 flex flex-col gap-1.5">
      {calendars.length === 0 && (
        <p className="text-[12px] py-8 text-center" style={{ color: '#c9b8c2' }}>이번 달 일정이 없어요</p>
      )}
      {[...calendars]
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
        .map((ev) => {
          const c = colorFor(ev.id);
          return (
            <div key={ev.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ border: '1px solid #f5eef1' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.text }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-semibold truncate" style={{ color: '#3d2c35' }}>{ev.title}</span>
                {ev.description && <span className="text-[10px] truncate" style={{ color: '#a8909a' }}>{ev.description}</span>}
              </div>
              <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: '#ff6b8a' }}>{ev.targetDate}</span>
              {/* 기념일(가상 항목)이거나 파트너의 커플 일정이면 삭제 불가 - 눌러도 403/404만 나서
                  아예 숨긴다(2026-09-01 재구현). */}
              {!ev.anniversary && ev.mine && (
                <button onClick={() => onDelete(ev.id)} className="text-[11px] px-1" style={{ color: '#c9b8c2' }} aria-label="삭제">✕</button>
              )}
            </div>
          );
        })}
    </div>
  );
}
