import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  getISOWeek,
  isAfter,
  isBefore,
  isWeekend,
  parseISO,
} from 'date-fns';
import { ru } from 'date-fns/locale';

export const GANTT_DAY_WIDTH = 36;
export const GANTT_HEADER_HEIGHT = 90;
export const GANTT_ROW_HEIGHT = 44;

export type TimelineDay = {
  date: string;
  dayNumber: string;
  weekday: string;
  isWeekend: boolean;
};

export type TimelineGroup = {
  key: string;
  label: string;
  dayCount: number;
};

export type TimelineModel = {
  days: TimelineDay[];
  months: TimelineGroup[];
  weeks: TimelineGroup[];
  width: number;
};

export type TaskBarGeometry = {
  left: number;
  width: number;
  isClippedStart: boolean;
  isClippedEnd: boolean;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function groupConsecutive<T>(
  items: T[],
  keyFor: (item: T) => string,
  labelFor: (item: T) => string,
): TimelineGroup[] {
  return items.reduce<TimelineGroup[]>((groups, item) => {
    const key = keyFor(item);
    const previous = groups.at(-1);

    if (previous?.key === key) {
      previous.dayCount += 1;
      return groups;
    }

    groups.push({ key, label: labelFor(item), dayCount: 1 });
    return groups;
  }, []);
}

export function buildTimeline(startDate: string, endDate: string): TimelineModel {
  const dates = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  const days = dates.map<TimelineDay>((date) => ({
    date: format(date, 'yyyy-MM-dd'),
    dayNumber: format(date, 'd'),
    weekday: format(date, 'EEEEEE', { locale: ru }),
    isWeekend: isWeekend(date),
  }));
  const months = groupConsecutive(
    dates,
    (date) => format(date, 'yyyy-MM'),
    (date) => capitalize(format(date, 'LLLL yyyy', { locale: ru })),
  );
  const weeks = groupConsecutive(
    dates,
    (date) => `${format(date, 'RRRR')}-${getISOWeek(date)}`,
    (date) => `Неделя ${getISOWeek(date)}`,
  );

  return {
    days,
    months,
    weeks,
    width: days.length * GANTT_DAY_WIDTH,
  };
}

export function calculateTaskBarGeometry(
  taskStartDate: string | null,
  taskEndDate: string | null,
  timelineStartDate: string,
  timelineEndDate: string,
): TaskBarGeometry | null {
  if (!taskStartDate || !taskEndDate) return null;

  const taskStart = parseISO(taskStartDate);
  const taskEnd = parseISO(taskEndDate);
  const timelineStart = parseISO(timelineStartDate);
  const timelineEnd = parseISO(timelineEndDate);

  if (
    isAfter(taskStart, taskEnd) ||
    isBefore(taskEnd, timelineStart) ||
    isAfter(taskStart, timelineEnd)
  ) {
    return null;
  }

  const isClippedStart = isBefore(taskStart, timelineStart);
  const isClippedEnd = isAfter(taskEnd, timelineEnd);
  const visibleStart = isClippedStart ? timelineStart : taskStart;
  const visibleEnd = isClippedEnd ? timelineEnd : taskEnd;

  return {
    left: differenceInCalendarDays(visibleStart, timelineStart) * GANTT_DAY_WIDTH,
    width:
      (differenceInCalendarDays(visibleEnd, visibleStart) + 1) *
      GANTT_DAY_WIDTH,
    isClippedStart,
    isClippedEnd,
  };
}
