import { useEffect, useRef, useState } from 'react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateStr(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplay(value) {
  const date = parseDateStr(value);
  if (!date) return null;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// <input type="date">가 기기 OS가 그리는 네이티브 피커를 띄워서 앱 테마(핑크/퍼플)를 못 따르고
// 언어도 앱 코드가 아니라 기기 시스템 언어를 따라가는 문제(2026-09-02, "웹뷰를 대충 씌운 느낌"의
// 원인 중 하나)를 해결하기 위해 직접 구현한 커스텀 날짜 선택기. value/onChange 계약은
// <input type="date">와 똑같이 'YYYY-MM-DD' 문자열을 주고받아서, 기존 코드는 입력 요소만
// 이걸로 바꿔 끼우면 된다(onChange는 이벤트 객체가 아니라 새 문자열을 바로 받는 점만 다름).
export function DatePickerField({ value, onChange, max, min, placeholder = '날짜 선택', className = '', id }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateStr(value) || new Date());
  const rootRef = useRef(null);

  useEffect(() => {
    if (open) setViewDate(parseDateStr(value) || new Date());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const maxDate = parseDateStr(max);
  const minDate = parseDateStr(min);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selected = parseDateStr(value);
  const today = new Date();

  const cells = Array.from({ length: firstWeekday }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const isDisabled = (day) => {
    const date = new Date(year, month, day);
    if (maxDate && date > maxDate) return true;
    if (minDate && date < minDate) return true;
    return false;
  };

  const pick = (day) => {
    if (isDisabled(day)) return;
    onChange(toDateStr(new Date(year, month, day)));
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button type="button" id={id} onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left transition-all"
        style={{ border: '1.5px solid #f0dbe1', background: 'white', color: value ? '#5c4651' : '#b9a7ae' }}>
        <span>{formatDisplay(value) || placeholder}</span>
        <span aria-hidden="true">📅</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 rounded-2xl p-4"
          style={{ width: '272px', background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 12px 32px rgba(101,66,80,0.18)' }}>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-stone-100"
              style={{ color: '#5c4651' }} aria-label="이전 달">‹</button>
            <span className="text-sm font-extrabold" style={{ color: '#5c4651' }}>{year}년 {month + 1}월</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-stone-100"
              style={{ color: '#5c4651' }} aria-label="다음 달">›</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-bold" style={{ color: '#b9a7ae' }}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const disabled = isDisabled(day);
              const isSelected = selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              return (
                <button key={day} type="button" disabled={disabled} onClick={() => pick(day)}
                  className="mx-auto w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all disabled:opacity-30"
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #ff6b8a, #c98fd4)' : 'transparent',
                    color: isSelected ? 'white' : '#5c4651',
                    border: isToday && !isSelected ? '1.5px solid #ff6b8a' : '1.5px solid transparent',
                  }}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
