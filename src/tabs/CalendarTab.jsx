import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export function CalendarTab() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('월간');

  return (
    <div className="max-w-[70%] h-full mx-[10px] rounded-2xl overflow-hidden shadow-sm" style={{ border: '3px solid #f5d0dc' }}>
      {/* 상단 타이틀 바 */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#fff0f4' }}>
        <span className="text-lg">📅</span>
        <span className="font-bold text-sm" style={{ color: '#3d2c35' }}>데이트 캘린더</span>
      </div>

      <div className="bg-white px-4 py-3">
        {/* 뷰 전환 버튼 (라이브러리엔 없어서 직접 추가) */}
        <div className="flex justify-end gap-1 mb-2">
          {['월간', '주간', '목록'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-2 py-1 rounded-md text-[11px] font-semibold"
              style={{
                background: view === v ? '#ff6b8a' : 'transparent',
                color: view === v ? 'white' : '#999',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* react-calendar 본체 */}
        <Calendar
          value={date}
          onChange={setDate}
          calendarType="gregory"          // 일요일 시작
          formatDay={(locale, d) => d.getDate()}  // "1일" 대신 "1"만 표시
          next2Label={null}
          prev2Label={null}
          nextLabel="›"
          prevLabel="‹"
          tileClassName={({ date: d, view }) => {
            if (view !== 'month') return '';
            const day = d.getDay();
            if (day === 0) return 'text-pink-500';
            if (day === 6) return 'text-blue-400';
            return '';
          }}
          className="mini-date-calendar"
        />
      </div>

      {/* react-calendar 기본 스타일 오버라이드 */}
      <style>{`
        .mini-date-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .mini-date-calendar .react-calendar__navigation {
          margin-bottom: 8px;
        }
        .mini-date-calendar .react-calendar__navigation button {
          font-weight: bold;
          color: #3d2c35;
          font-size: 14px;
        }
        .mini-date-calendar .react-calendar__navigation button:disabled {
          background: none;
        }
        .mini-date-calendar .react-calendar__navigation button:enabled:hover,
        .mini-date-calendar .react-calendar__navigation button:enabled:focus {
          background-color: #fff0f4;
          border-radius: 8px;
        }
        .mini-date-calendar .react-calendar__month-view__weekdays {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          color: #999;
          text-decoration: none;
        }
        .mini-date-calendar .react-calendar__month-view__weekdays abbr {
          text-decoration: none;
        }
        .mini-date-calendar .react-calendar__tile {
          padding: 8px 0;
          font-size: 12px;
          border-radius: 999px;
          color: #3d2c35;
        }
        .mini-date-calendar .react-calendar__tile:enabled:hover,
        .mini-date-calendar .react-calendar__tile:enabled:focus {
          background: #fff0f4;
        }
        .mini-date-calendar .react-calendar__tile--now {
          background: linear-gradient(135deg, #ff6b8a, #c4a0e8);
          color: white;
          font-weight: bold;
        }
        .mini-date-calendar .react-calendar__tile--active {
          background: #ffd6e0;
          color: #3d2c35;
        }
        .mini-date-calendar .text-pink-500 { color: #ff6b8a; }
        .mini-date-calendar .text-blue-400 { color: #7c9cff; }
      `}</style>
    </div>
  );
}