import {
  eachDayOfInterval,
  format,
  getISOWeek,
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
