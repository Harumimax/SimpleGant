import type { NonWorkingDay } from '../calendar/non-working-days.api';

const DEFAULT_WORKING_DURATION = 10;

function moveDays(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function isWorkingDay(value: string, nonWorkingDates: Set<string>) {
  const day = new Date(`${value}T00:00:00.000Z`).getUTCDay();
  return day !== 0 && day !== 6 && !nonWorkingDates.has(value);
}

function moveWorkingDays(
  value: string,
  count: number,
  direction: 1 | -1,
  nonWorkingDates: Set<string>,
) {
  let result = value;
  let remaining = count;
  while (remaining > 0) {
    result = moveDays(result, direction);
    if (isWorkingDay(result, nonWorkingDates)) remaining -= 1;
  }
  return result;
}

export function normalizeDraftTaskDates(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  duration: number | undefined,
  excludeWeekends: boolean,
  nonWorkingDays: NonWorkingDay[],
) {
  if (startDate && endDate) return { startDate, endDate };
  if (!startDate && !endDate) return { startDate: null, endDate: null };

  const nonWorkingDates = new Set(nonWorkingDays.map(({ date }) => date));
  const effectiveDuration = duration ?? DEFAULT_WORKING_DURATION;
  const calendarDuration = duration ?? 14;

  if (startDate) {
    return {
      startDate,
      endDate: excludeWeekends
        ? moveWorkingDays(
            startDate,
            effectiveDuration - (isWorkingDay(startDate, nonWorkingDates) ? 1 : 0),
            1,
            nonWorkingDates,
          )
        : moveDays(startDate, calendarDuration - 1),
    };
  }

  return {
    startDate: excludeWeekends
      ? moveWorkingDays(
          endDate!,
          effectiveDuration - (isWorkingDay(endDate!, nonWorkingDates) ? 1 : 0),
          -1,
          nonWorkingDates,
        )
      : moveDays(endDate!, -(calendarDuration - 1)),
    endDate: endDate!,
  };
}
