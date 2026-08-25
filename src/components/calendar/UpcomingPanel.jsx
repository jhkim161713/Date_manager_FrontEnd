import { colorFor } from '../../lib/calendarDisplay';

export function UpcomingPanel({ upcoming, onDelete }) {
  return (
    <div className="rounded-2xl p-4 bg-white h-full" style={{ border: '1px solid #f0dbe4' }}>
      <p className="text-[11px] font-bold mb-2.5" style={{ color: '#a8909a' }}>다가오는 일정</p>

      {upcoming.length === 0 && (
        <p className="text-[11px] py-4 text-center h" style={{ color: '#c9b8c2' }}>다가오는 일정이 없어요</p>
      )}

      <div className="flex flex-col gap-2">
        {upcoming.map((ev) => {
          const c = colorFor(ev.id);
          return (
            <div key={ev.id} className="flex items-start gap-2 pl-2.5" style={{ borderLeft: `3px solid ${c.text}` }}>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-semibold truncate" style={{ color: '#3d2c35' }}>{ev.title}</span>
                <span className="text-[10px]" style={{ color: '#a8909a' }}>{ev.targetDate.slice(5).replace('-', '/')}</span>
              </div>
              <button onClick={() => onDelete(ev.id)} className="text-[10px] mt-0.5" style={{ color: '#c9b8c2' }} aria-label="삭제">✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
