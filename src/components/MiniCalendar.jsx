import { useEffect, useState } from 'react';
import { getCalendars } from '../lib/api';

// yyyy-MM-dd 포맷 헬퍼(CalendarTab.jsx의 formatDate와 동일 로직).
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 2026-08-22 - 예전엔 data/calendarData.js의 하드코딩된 목업 일정(7월 날짜 고정)을 그대로
// 보여줘서, 오늘이 언제든 상관없이 항상 같은 지난 날짜가 "다가오는 일정"에 떴다. 이제 실제
// /calendar API(CalendarTab.jsx와 동일)에서 이번 달 일정을 가져와 보여준다. 카테고리별
// 색깔 점/이모지는 실제 데이터에 카테고리 필드가 없어서(원래 기획의 "프리미엄 매거진" 자동
// 이식 개념 - 최종 프로젝트 스코프) 뺐고, 지금은 일정 유무만 단색 점으로 표시한다.
export function MiniCalendar() {
  const [open, setOpen] = useState(true);
  const [events, setEvents] = useState([]);
  // 달력 그리드가 보고 있는 달(월 이동 가능) - 2026-08-22 추가. "오늘"과 분리해서, 사용자가
  // 다음/이전 달로 넘겨도 아래 todayDate/todayKey 계산은 항상 실제 오늘 기준을 유지한다.
  const [viewDate, setViewDate] = useState(new Date());

  const now = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayDate = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDaysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('ko-KR', { month: 'long' });
  const cells = Array.from({ length: firstDay + lastDaysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  useEffect(() => {
    const start = formatDate(new Date(year, month, 1));
    const end = formatDate(new Date(year, month + 1, 0));
    getCalendars(start, end).then(setEvents).catch(() => setEvents([]));
  }, [year, month]);

  // 날짜별 일정 존재 여부만 표시(day-dot). 같은 날 여러 개면 첫 번째 것만 대표로 씀.
  const eventsByDate = {};
  events.forEach((e) => {
    if (!eventsByDate[e.targetDate]) eventsByDate[e.targetDate] = [];
    eventsByDate[e.targetDate].push(e);
  });

  // "다가오는 일정" - 그리드가 보여주는 달(viewDate)과 무관하게 항상 실제 오늘 이후 일정을
  // 보여줘야 해서(2026-08-22, 달을 넘겨도 다음 일정이 계속 보이게), 그리드용 events와는
  // 별도로 오늘부터 60일 범위를 따로 조회한다.
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  useEffect(() => {
    const start = formatDate(now);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 60);
    getCalendars(start, formatDate(rangeEnd)).then(setUpcomingEvents).catch(() => setUpcomingEvents([]));
  }, []);

  const todayKey = formatDate(now);
  const upcoming = upcomingEvents
    .filter((e) => e.targetDate >= todayKey)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    .slice(0, 3);

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
            <p className="text-xs font-bold text-white leading-none">데이트 캘린더</p>
            {/* 2026-08-22 - 월 이동이 생기면서 "이번 달"이 항상 맞는 표현이 아니게 돼서, 지금
                보고 있는 달 기준으로 바꿈. */}
            <p className="text-[9px] text-white/70 mt-0.5">{month + 1}월 일정 {events.length}개</p>
          </div>

          {/* 옆에 있는 △ */}
          <span className="text-white/80 text-xs" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform .2s' }}>▾</span>
        </div>
      </button>

      {/*아래 달력 본문 */}
      {open && (
        <div className="mt-1.5 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #ffd6e0' }}>

          {/* 달력 헤더 부분 - 월 이동 버튼 추가(2026-08-22) */}
          <div className="px-3 py-2 flex items-center justify-between"
            style={{ background: 'linear-gradient(90deg, #fff0f3, #f5eef9)' }}>
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="text-xs font-bold px-1" style={{ color: '#c4a0e8' }}>◁</button>
            <span className="text-xs font-bold" style={{ color: '#3d2c35' }}>{year}년 {monthLabel}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="text-xs font-bold px-1" style={{ color: '#c4a0e8' }}>▷</button>
          </div>

          {/* 일수 표기 칸 설정*/}
          <div className="p-2" style={{ background: 'white' }}>
            {/* 일 ~ 토 표기*/}
            <div className="grid grid-cols-7 mb-1">
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <div key={d} className="text-center text-[9px] font-bold py-0.5 rounded-sm"
                  style={{ color: i === 0 ? '#ff6b8a' : i === 6 ? '#c4a0e8' : '#bbb' }}>{d}</div>
              ))}
            </div>

            {/* 일수 칸 */}
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i}/>;
                const key = formatDate(new Date(year, month, day));
                const hasEvent = !!eventsByDate[key];
                // 2026-08-22 - 예전엔 day === todayDate만 체크해서, 월 이동 후 다른 달에서도
                // 오늘과 "일"만 같으면(예: 지난달 22일) 오늘로 잘못 표시됐다. 연/월까지 같이 확인.
                const isToday = day === todayDate && year === now.getFullYear() && month === now.getMonth();

                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: isToday ? 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' : hasEvent ? '#ff6b8a15' : undefined,
                        color: isToday ? 'white' : i % 7 === 0 ? '#ff6b8a' : i % 7 === 6 ? '#c4a0e8' : '#3d2c35',
                        outline: isToday ? 'none' : hasEvent ? '1.5px solid #ff6b8a50' : 'none',
                      }}>
                      {day}
                    </div>
                    {hasEvent && (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#ff6b8a' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/*다가오는 일정 표시*/}
            <div className="mt-2 pt-2" style={{ borderTop: '1px dashed #f590aa' }}>
              <p className="text-[9px] font-bold text-stone-400 mb-1">다가오는 일정</p>
              {upcoming.length === 0 && (
                <p className="text-[10px] text-stone-300 py-1">다가오는 일정이 없어요</p>
              )}
              {upcoming.map((e) => {
                const d = new Date(e.targetDate);
                return (
                  <div key={e.id} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff6b8a' }} />
                    <span className="text-[11px] font-semibold truncate" style={{ color: '#3d2c35' }}>{e.title}</span>
                    <span className="text-[10px] ml-auto font-semibold flex-shrink-0" style={{ color: '#a08b94' }}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
