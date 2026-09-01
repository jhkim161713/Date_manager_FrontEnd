import { useEffect, useMemo, useState } from 'react';
import { getCalendars, createCalendar, deleteCalendar } from '../lib/api';
import { formatDate } from '../lib/calendarDisplay';

function getMonthRange(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

// CalendarTab의 일정 데이터 페칭 + 생성/삭제 로직을 감싼 훅(2026-08-24 분리). 뷰(월간/주간/목록)
// 렌더링은 탭/컴포넌트 쪽에서, 데이터 쪽은 이 훅에서 담당한다.
export function useCalendarEvents(viewDate) {
  const [calendars, setCalendars] = useState([]);

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

  // 사이드바 MiniCalendar는 이 훅과 별개 컴포넌트라 상태를 공유하지 않는다 - 생성/삭제가 끝나면
  // 이 커스텀 이벤트로 알려줘야 MiniCalendar도 같이 갱신된다(2026-09-01, 머지 과정에서 빠졌던
  // dispatch를 복원). MiniCalendar.jsx가 이 이벤트를 구독한다.
  const notifyCalendarChanged = () => window.dispatchEvent(new CustomEvent('dm:calendar-changed'));

  const createEvent = ({ title, description, targetDate, coupleEvent }) => (
    createCalendar({ title, description, targetDate, courseGroupId: null, coupleEvent: !!coupleEvent })
      .then(() => { fetchCalendars(viewDate); notifyCalendarChanged(); })
  );

  const deleteEvent = (id) => (
    deleteCalendar(id)
      .then(() => { fetchCalendars(viewDate); notifyCalendarChanged(); })
      .catch((e) => console.log('일정 삭제 실패:', e))
  );

  return { calendars, eventsByDate, upcoming, createEvent, deleteEvent };
}
