import { useState } from 'react';
import { CALENDAR_EVENTS, CAT_COLOR, CAT_LABEL } from '../data/calendarData';

export function MiniCalendar() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayDate = now.getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const lastdaysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = now.toLocaleDateString('ko-KR', { month: 'long' })
  {/*달력 칸 개수 만드는 변수*/}
  const cells = Array.from({ length: firstDay + lastdaysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )
  {/*숫자 입력받아 xxxx(년)-xx(월)-xx(일) 형태로 출력해주는 함수*/}
  const pad = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  {/*일정 :xxxx(년)-xx(월)-xx(일) 형태로 출력 */}
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

      {/*아래 달력 본문 */}
      {open && (
        
        <div className="mt-1.5 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #ffd6e0' }}>
          
          {/* 달력 헤더 부분 */}
          <div className="px-3 py-2 items-center justify-between"
            style={{ background: 'linear-gradient(90deg, #fff0f3, #f5eef9)' }}>
              {/* xxxx년 xx월  */}
            <span className="text-xs font-bold" style={{ color: '#3d2c35' }}>{year}년 {monthLabel}</span>
              {/* 일정 이모지 표시 */}
            <div className="flex gap-1">
              {Object.entries(CAT_COLOR).map(([emoji, color]) => (
                <span key={emoji} className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: `${color}30` }}>{emoji}</span>
              ))}
            </div>
          </div>

            {/* 일수 표기 칸 설정*/}
          <div className="p-2" style={{ background: 'white' }}>
            {/* 월 ~ 금 표기*/}
            <div className="grid grid-cols-7 mb-1">
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <div key={d} className="text-center text-[9px] font-bold py-0.5 rounded-sm"
                  style={{ color: i === 0 ? '#ff6b8a' : i === 6 ? '#c4a0e8' : '#bbb' }}>{d}</div>
              ))}
            </div>

            {/* 일수 칸 */}
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => {
                {/*만약 일 수 null이면 빈칸 return*/}
                if (!day) return <div key={i}/>
                
                
                {/*xxxx-xx-xx로 출력 */}
                const key = pad(day)
                {/*입력된 이벤트랑 날짜 비교*/}
                const ev = CALENDAR_EVENTS[key]
                {/*달력속의 날짜가 오늘인지 확인 */}
                const isToday = day === todayDate
                {/*만약 이벤트가 있으면 해당하는 그 이벤트 색깔 가져오기*/}
                const dotColor = ev ? CAT_COLOR[ev] : undefined

                {/*달력 아래 이벤트 유뮤 점*/}
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        // 오늘 날짜 그라데이션 및 일정 있는 날 배경색 지정
                        background: isToday ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : ev ? `${dotColor}15` : undefined,
                        //일요일:분홍색/토요일:보라색/평일:일반택스트색/오늘 날짜 :흰색 
                        color: isToday ? 'white' : i % 7 === 0 ? '#ff6b8a' : i % 7 === 6 ? '#c4a0e8' : '#3d2c35',
                        // 일정 있는 날 원 테두리(Outline) 지정
                        outline: isToday ? 'none' : ev ? `1.5px solid ${dotColor}50` : 'none',
                      }}>
                      {/*일수표시*/}
                      {day}
                    </div>
                    {/*해당 날짜에 일정 있으면 아래 점표시 표시 */}
                    {ev && (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: dotColor }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/*다가오는 일정 표시*/}
              {/*구분선*/}
            <div className="mt-2 pt-2" style={{ borderTop: '1px dashed #f590aa' }}>
              <p className="text-[9px] font-bold text-stone-400 mb-1">다가오는 일정</p>
              {/*리스트에 있는 일정 구조분해 할당 후 d에 날자 값 할당(쵀대 3개까지)*/}
              {Object.entries(CALENDAR_EVENTS).slice(0, 3).map(([date, emoji]) => {
                const d = new Date(date)
                return (
                  //일정표 스타일
                  <div key={date} className="flex items-center gap-1.5 py-0.5">
                    {/*이모지 스타일*/} 
                    <span className="w-4 h-4 rounded flex items-center justify-center text-[9px]">{emoji}</span>
                    <span className="text-[11px] font-semibold" style={{ color: CAT_COLOR[emoji] }}>{CAT_LABEL[emoji]}</span>
                    <span className="text-[10px] ml-auto font-semibold 30" style={{ color: '#3d2c35' }}>
                      {/*일정 날짜 표시*/}
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