import { useState } from 'react';
import { CALENDAR_EVENTS, CAT_COLOR, CAT_LABEL } from '../data/calendarData';

export function MiniCalendar() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayDate = now.getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = now.toLocaleDateString('ko-KR', { month: 'long' })
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )
  const pad = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const eventCount = Object.keys(CALENDAR_EVENTS).length

  return (
    <div className="mx-3 my-3">
      {/* 트리거 버튼 — 프리미엄 캘린더 */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full rounded-2xl overflow-hidden transition-all hover:scale-[1.13]"
        style={{ border: '#ffd6e0' }}>
        {/* 헤더 그라데이션 */}
        <div className="px-2 py-2 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ff6b8a 0%, #c4a0e8 100%)' }}>
          {/* 미니달력 장식 */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="3" width="20" height="18" rx="4" fill="white" fillOpacity="0.25"/>
            <rect x="1" y="3" width="20" height="18" rx="4" stroke="white" strokeWidth="1"/>
            <rect x="1" y="3" width="20" height="7" rx="4" fill="white" fillOpacity="0.3"/>
            <line x1="1" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
            <circle cx="7" cy="14.5" r="1.5" fill="white" fillOpacity="0.7"/>
            <circle cx="11" cy="14.5" r="1.5" fill="white"/>
            <circle cx="15" cy="14.5" r="1.5" fill="#ffd6e0"/>
            <line x1="6" y1="1" x2="6" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="16" y1="1" x2="16" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          
          {/*헤더 문구 */}
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white leading-none">프리미엄 캘린더</p>
            <p className="text-[9px] text-white/70 mt-0.5">이번 달 일정 {eventCount}개</p>
          </div>

          {/* 옆에 있는 △ */}
          <span className="text-white/80 text-xs" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform .2s' }}>▾</span>
        </div>

        
        {/* 접었을때 미리보기 */}
        {!open && (
          <div className="px-2 py-1.5 flex gap-1.5 flex-wrap" style={{ background: '#fff8f4' }}>
            {Object.entries(CAT_LABEL).map(([emoji, label]) => (
              <span key={label} className="rounded-full px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5"
                style={{ background: `${CAT_COLOR[emoji]}20`, color: CAT_COLOR[emoji] }}>
                {emoji} {label}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Expanded — full premium calendar */}
      {open && (
        <div className="mt-1.5 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #ffd6e0' }}>
          {/* Month header */}
          <div className="px-3 py-2 flex items-center justify-between"
            style={{ background: 'linear-gradient(90deg, #fff0f3, #f5eef9)' }}>
            <span className="text-xs font-bold" style={{ color: '#3d2c35' }}>{year}년 {monthLabel}</span>
            <div className="flex gap-1">
              {Object.entries(CAT_COLOR).map(([emoji, color]) => (
                <span key={emoji} className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: `${color}25` }}>{emoji}</span>
              ))}
            </div>
          </div>

          <div className="p-2" style={{ background: 'white' }}>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <div key={d} className="text-center text-[9px] font-bold py-0.5 rounded-sm"
                  style={{ color: i === 0 ? '#ff6b8a' : i === 6 ? '#c4a0e8' : '#bbb' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const key = pad(day)
                const ev = CALENDAR_EVENTS[key]
                const isToday = day === todayDate
                const dotColor = ev ? CAT_COLOR[ev] : undefined
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: isToday ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : ev ? `${dotColor}15` : undefined,
                        color: isToday ? 'white' : i % 7 === 0 ? '#ff6b8a' : i % 7 === 6 ? '#c4a0e8' : '#3d2c35',
                        outline: isToday ? 'none' : ev ? `1.5px solid ${dotColor}50` : 'none',
                      }}>
                      {day}
                    </div>
                    {ev && (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: dotColor }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Upcoming events strip */}
            <div className="mt-2 pt-2" style={{ borderTop: '1px dashed #ffd6e0' }}>
              <p className="text-[9px] font-bold text-stone-400 mb-1">다가오는 일정</p>
              {Object.entries(CALENDAR_EVENTS).slice(0, 3).map(([date, emoji]) => {
                const d = new Date(date)
                return (
                  <div key={date} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-4 h-4 rounded flex items-center justify-center text-[9px]"
                      style={{ background: `${CAT_COLOR[emoji]}20` }}>{emoji}</span>
                    <span className="text-[9px] font-semibold" style={{ color: CAT_COLOR[emoji] }}>{CAT_LABEL[emoji]}</span>
                    <span className="text-[9px] text-stone-400 ml-auto">
                      {d.getMonth() + 1}/{d.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}