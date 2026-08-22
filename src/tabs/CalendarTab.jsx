import { useEffect, useMemo, useRef, useState } from 'react';
import { getCalendars, createCalendar, deleteCalendar } from '../lib/api';
import { SectionTitle } from '../components/SectionTitle';

// yyyy-MM-dd 형태로 날짜를 맞춰주는 헬퍼
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthRange(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

// 주간 뷰에서 해당 주의 일요일 ~ 토요일 날짜를 구해주는 헬퍼
function getWeekDates(baseDate) {
  const date = new Date(baseDate);
  const day = date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// 일정마다 살짝 다른 색을 순환해서 입혀주는 팔레트 (카테고리 데이터가 없어서 id 기반으로 배정)
const PALETTE = [
  { bg: '#ffe3ea', text: '#ff6b8a' },
  { bg: '#efe3fb', text: '#a76bd6' },
  { bg: '#e3edfb', text: '#5b8dd6' },
  { bg: '#fff0d9', text: '#e2a23b' },
];
function colorFor(id) {
  return PALETTE[Math.abs(id) % PALETTE.length];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarTab({ prefill, onPrefillConsumed }) {
  const [calendars, setCalendars] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [view, setView] = useState('월간');
  const [showForm, setShowForm] = useState(false);
  const [titleMsg, setTitleMsg] = useState('');

  const titleRef = useRef();
  const descriptionRef = useRef();
  const targetDateRef = useRef();

  // 큐레이션 탭 "캘린더에 담기"로 넘어온 값(2026-08-22) - 제목은 항상 채우고, 날짜는 공연류처럼
  // 실제 날짜를 아는 경우만 채운다(그 외엔 빈 값으로 둬서 사용자가 직접 입력). showForm이 켜진
  // 다음 렌더에서야 ref가 실제 DOM에 붙으므로, 폼을 먼저 연 뒤 다음 이펙트에서 값을 채운다.
  useEffect(() => {
    if (prefill) setShowForm(true);
  }, [prefill]);
  useEffect(() => {
    if (!showForm || !prefill) return;
    if (titleRef.current) titleRef.current.value = prefill.title || '';
    if (targetDateRef.current) targetDateRef.current.value = prefill.targetDate || '';
    onPrefillConsumed?.();
  }, [showForm, prefill]);

  const fetchCalendars = (baseDate) => {
    const { start, end } = getMonthRange(baseDate);
    getCalendars(start, end)
      .then((data) => setCalendars(data || []))
      .catch((e) => console.log('캘린더 조회 실패:', e));
  };

  useEffect(() => {
    fetchCalendars(viewDate);
  }, [viewDate]);

  const eventsByDate = useMemo(() => {
    const map = {};
    calendars.forEach((cal) => {
      if (!map[cal.targetDate]) map[cal.targetDate] = [];
      map[cal.targetDate].push(cal);
    });
    return map;
  }, [calendars]);

  const upcoming = useMemo(() => {
    const todayStr = formatDate(new Date());
    return [...calendars]
      .filter((c) => c.targetDate >= todayStr)
      .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
      .slice(0, 5);
  }, [calendars]);

  // 달력 그리드 칸 계산 (앞쪽 빈칸 + 실제 날짜들)
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

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

const isSameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

  const handleCreate = (e) => {
    e.preventDefault();

    const titleNode = titleRef.current;
    const descriptionNode = descriptionRef.current;
    const targetDateNode = targetDateRef.current;

    if (titleNode.value.trim() === '') {
      setTitleMsg('제목을 입력해주세요');
      titleNode.focus();
      return;
    }
    if (targetDateNode.value === '') {
      setTitleMsg('날짜를 선택해주세요');
      targetDateNode.focus();
      return;
    }
    setTitleMsg('');

    const title = titleNode.value.trim();
    const description = descriptionNode.value.trim();
    const targetDate = targetDateNode.value;

    createCalendar({ title, description, targetDate, courseGroupId: null })
      .then(() => {
        fetchCalendars(viewDate);
        titleNode.value = '';
        descriptionNode.value = '';
        targetDateNode.value = '';
        setShowForm(false);
      })
      .catch((e) => console.log('일정 등록 실패:', e));
  };

  const handleDelete = (id) => {
    deleteCalendar(id)
      .then(() => fetchCalendars(viewDate))
      .catch((e) => console.log('일정 삭제 실패:', e));
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

        {/* 월간 그리드 뷰 */}
        {view === '월간' && (
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
        )}

        {/* 주간 뷰 (아직 준비 중) */}
 {/* 주간 뷰 */}
{view === '주간' && (
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
)}
        {/* 목록 뷰: 전체 일정 나열 */}
        {view === '목록' && (
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
                    <button onClick={() => handleDelete(ev.id)} className="text-[11px] px-1" style={{ color: '#c9b8c2' }} aria-label="삭제">✕</button>
                  </div>
                );
              })}
          </div>
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
                  <button onClick={() => handleDelete(ev.id)} className="text-[10px] mt-0.5" style={{ color: '#c9b8c2' }} aria-label="삭제">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 일정 등록 용*/}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'rgba(61, 44, 53, 0.35)' }}
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-2xl p-5 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm" style={{ color: '#3d2c35' }}>새 일정 등록</span>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm" style={{ color: '#c9b8c2' }}>✕</button>
            </div>

            <div className="mb-3">
              <label htmlFor="title" className="block text-[11px] font-bold mb-1" style={{ color: '#3d2c35' }}>제목</label>
              <input
                ref={titleRef}
                type="text"
                id="title"
                name="title"
                placeholder="예: 영화 데이트"
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
                style={{ borderColor: '#f0dbe4' }}
              />
              {titleMsg && <span className="text-[11px]" style={{ color: '#ff4d6d' }}>{titleMsg}</span>}
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="block text-[11px] font-bold mb-1" style={{ color: '#3d2c35' }}>메모</label>
              <textarea
                ref={descriptionRef}
                id="description"
                name="description"
                rows={2}
                placeholder="메모를 입력해주세요"
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none"
                style={{ borderColor: '#f0dbe4' }}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="targetDate" className="block text-[11px] font-bold mb-1" style={{ color: '#3d2c35' }}>날짜</label>
              <input
                ref={targetDateRef}
                type="date"
                id="targetDate"
                name="targetDate"
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
                style={{ borderColor: '#f0dbe4' }}
              />
            </div>

            <button
              type="submit"
              className="w-full text-sm font-bold py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}
            >
              등록하기
            </button>
          </form>
        </div>
      )}
      </div>
    </div>
  );
}
