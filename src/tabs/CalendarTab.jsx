import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { ListView } from '../components/calendar/ListView';
import { UpcomingPanel } from '../components/calendar/UpcomingPanel';
import { EventFormModal } from '../components/calendar/EventFormModal';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { getWeekDates } from '../lib/calendarDisplay';
import { getCoupleStatus } from '../lib/api';

export function CalendarTab({ prefill, onPrefillConsumed }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [view, setView] = useState('월간');
  const [showForm, setShowForm] = useState(Boolean(prefill));

  // "커플 일정으로 등록" 체크박스 잠금용(2026-09-01 재구현) - HomeTab과 동일한 패턴으로 연결
  // 여부를 가져와 EventFormModal에 넘긴다.
  const [coupleLinked, setCoupleLinked] = useState(false);
  useEffect(() => {
    getCoupleStatus().then((status) => setCoupleLinked(!!status.linked)).catch(() => setCoupleLinked(false));
  }, []);

  const { calendars, eventsByDate, upcoming, createEvent, deleteEvent } = useCalendarEvents(viewDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const weekDates = getWeekDates(viewDate);

  const goPrevWeek = () => {
    const date = new Date(viewDate);
    date.setDate(date.getDate() - 7);
    setViewDate(date);
  };

  const goNextWeek = () => {
    const date = new Date(viewDate);
    date.setDate(date.getDate() + 7);
    setViewDate(date);
  };

  return (
    <div className="space-y-4">
      <SectionTitle sub="만나기로 한 날짜와 일정을 캘린더로 관리해보세요">
        📅 데이트 캘린더
      </SectionTitle>
      <div className="w-full max-w-[960px] mx-auto flex flex-col md:flex-row gap-4 p-3">
        {/* 왼쪽: 캘린더 카드 */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-sm bg-white" style={{ border: '1px solid #f0dbe4' }}>
          {/* 상단 타이틀 바 */}
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: '#fff0f4' }}>
            <span className="font-bold text-xxl" style={{ color: '#3d2c35' }}>데이트 캘린더</span>
          </div>

          {/* 월 이동 + 뷰 전환 */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <button onClick={goPrevMonth} className="w-4 h-6 flex items-center justify-center text-sm rounded-full hover:bg-black/5" style={{ color: '#999' }}>◁</button>
              <span className="font-bold text-base" style={{ color: '#3d2c35' }}>{year}년 {month + 1}월</span>
              <button onClick={goNextMonth} className="w-4 h-6 flex items-center justify-center text-sm rounded-full hover:bg-black/5" style={{ color: '#999' }}>▷</button>
            </div>
            <div className="flex gap-1 rounded-full p-0.5" style={{ background: '#fdf1f5' }}>
              {['월간', '주간', '목록'].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    // 월간 뷰에서 다른 달로 이동해둔 상태로 "주간" 탭을 누르면, 그 이동한 달의
                    // 1일이 속한 주가 나와버렸다(2026-08-22 발견) - 주간 탭을 누르는 순간엔
                    // 항상 오늘이 속한 실제 이번 주로 보여주는 게 맞다고 판단해 여기서 리셋한다.
                    if (v === '주간') setViewDate(new Date());
                    setView(v);
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
                  style={{
                    background: view === v ? '#ff6b8a' : 'transparent',
                    color: view === v ? 'white' : '#a8909a',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {view === '월간' && (
            <MonthView year={year} month={month} eventsByDate={eventsByDate} isToday={isToday} />
          )}
          {view === '주간' && (
            <WeekView
              weekDates={weekDates}
              eventsByDate={eventsByDate}
              today={today}
              goPrevWeek={goPrevWeek}
              goNextWeek={goNextWeek}
            />
          )}
          {view === '목록' && (
            <ListView calendars={calendars} onDelete={deleteEvent} />
          )}
        </div>

        {/* 오른쪽: 등록 버튼 + 다가오는 일정 패널 */}
        <div className="w-full md:w-[220px] flex flex-col gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="w-full text-sm font-bold py-3 rounded-2xl text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #ff6b8a 0%, #c4a0e8 100%)' }}
          >
            + 일정 설정하기
          </button>

          <UpcomingPanel upcoming={upcoming} onDelete={deleteEvent} />
        </div>

        {showForm && (
          <EventFormModal
            prefill={prefill}
            onPrefillConsumed={onPrefillConsumed}
            onClose={() => setShowForm(false)}
            onSubmit={createEvent}
            coupleLinked={coupleLinked}
          />
        )}
      </div>
    </div>
  );
}
