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

  // 사이드바의 MiniCalendar는 이 훅과 완전히 분리된 컴포넌트라, 여기서 일정을 만들거나 지워도
  // MiniCalendar가 그 사실을 알 방법이 없어서 새로고침 전까진 계속 옛날 상태로 보였다
  // (2026-08-25 발견 - "미니 캘린더에 일정이 안 떠"). 전역 상태 라이브러리가 없어서, 가장 가벼운
  // 방법으로 커스텀 window 이벤트를 쏴서 MiniCalendar가 자기 데이터를 다시 받아오게 한다.
  const notifyCalendarChanged = () => window.dispatchEvent(new Event('dm:calendar-changed'));

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
