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

  const createEvent = ({ title, description, targetDate }) => (
    createCalendar({ title, description, targetDate, courseGroupId: null })
      .then(() => fetchCalendars(viewDate))
  );

  const deleteEvent = (id) => (
    deleteCalendar(id)
      .then(() => fetchCalendars(viewDate))
      .catch((e) => console.log('일정 삭제 실패:', e))
  );

  return { calendars, eventsByDate, upcoming, createEvent, deleteEvent };
}
