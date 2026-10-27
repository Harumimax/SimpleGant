import {
  addDays,
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

export type TaskDateChangeMode = 'move' | 'resize-start' | 'resize-end';

export type TaskDateRange = {
  startDate: string;
  endDate: string;
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

export function calculateTaskDuration(
  taskStartDate: string | null,
  taskEndDate: string | null,
) {
  if (!taskStartDate || !taskEndDate) return null;
  const taskStart = parseISO(taskStartDate);
  const taskEnd = parseISO(taskEndDate);
  if (isAfter(taskStart, taskEnd)) return null;
  return differenceInCalendarDays(taskEnd, taskStart) + 1;
}

export function calculateMilestoneLeft(
  milestoneDate: string,
  timelineStartDate: string,
  timelineEndDate: string,
) {
  const milestone = parseISO(milestoneDate);
  const timelineStart = parseISO(timelineStartDate);
  const timelineEnd = parseISO(timelineEndDate);
  if (isBefore(milestone, timelineStart) || isAfter(milestone, timelineEnd)) {
    return null;
  }
  return differenceInCalendarDays(milestone, timelineStart) * GANTT_DAY_WIDTH
    + GANTT_DAY_WIDTH / 2;
}

export function calculateTaskDateChange(
  taskStartDate: string,
  taskEndDate: string,
  dayDelta: number,
  mode: TaskDateChangeMode,
  timelineStartDate: string,
  timelineEndDate: string,
): TaskDateRange {
  const taskStart = parseISO(taskStartDate);
  const taskEnd = parseISO(taskEndDate);
  const timelineStart = parseISO(timelineStartDate);
  const timelineEnd = parseISO(timelineEndDate);

  let nextStart = taskStart;
  let nextEnd = taskEnd;

  if (mode === 'move') {
    const minimumDelta = differenceInCalendarDays(timelineStart, taskStart);
    const maximumDelta = differenceInCalendarDays(timelineEnd, taskEnd);
    const boundedDelta = minimumDelta <= maximumDelta
      ? Math.min(Math.max(dayDelta, minimumDelta), maximumDelta)
      : 0;
    nextStart = addDays(taskStart, boundedDelta);
    nextEnd = addDays(taskEnd, boundedDelta);
  } else if (mode === 'resize-start') {
    const candidate = addDays(taskStart, dayDelta);
    nextStart = isBefore(candidate, timelineStart)
      ? timelineStart
      : isAfter(candidate, taskEnd) ? taskEnd : candidate;
  } else {
    const candidate = addDays(taskEnd, dayDelta);
    nextEnd = isAfter(candidate, timelineEnd)
      ? timelineEnd
      : isBefore(candidate, taskStart) ? taskStart : candidate;
  }

  return {
    startDate: format(nextStart, 'yyyy-MM-dd'),
    endDate: format(nextEnd, 'yyyy-MM-dd'),
  };
}
