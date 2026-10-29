import { BadRequestException } from '@nestjs/common';

import { DEFAULT_TASK_DURATION } from './task.constants.js';

export function parseDateOnly(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export function calculateDuration(
  startDate: Date | null,
  endDate: Date | null,
  excludeNonWorkingDays = false,
  nonWorkingDates: ReadonlySet<string> = new Set(),
) {
  if (!startDate || !endDate || startDate > endDate) return null;
  if (!excludeNonWorkingDays) {
    return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
  }

  let duration = 0;
  let current = new Date(startDate);
  while (current <= endDate) {
    if (isWorkingDay(current, nonWorkingDates)) duration += 1;
    current = moveDays(current, 1);
  }
  return duration;
}

function moveDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function isWorkingDay(date: Date, nonWorkingDates: ReadonlySet<string>) {
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6 && !nonWorkingDates.has(dateOnly(date)!);
}

function moveWorkingDays(
  date: Date,
  count: number,
  direction: 1 | -1,
  nonWorkingDates: ReadonlySet<string>,
) {
  let next = new Date(date);
  let remaining = count;
  while (remaining > 0) {
    next = moveDays(next, direction);
    if (isWorkingDay(next, nonWorkingDates)) remaining -= 1;
  }
  return next;
}

export function normalizeCreationDates(
  startValue?: string,
  endValue?: string,
  excludeNonWorkingDays = true,
  duration?: number,
  nonWorkingDates: ReadonlySet<string> = new Set(),
) {
  let startDate = startValue ? parseDateOnly(startValue) : null;
  let endDate = endValue ? parseDateOnly(endValue) : null;

  if (startDate && endDate) {
    validateDateRange(startDate, endDate);
    return { startDate, endDate };
  }

  if (duration !== undefined) {
    if (startDate) {
      endDate = excludeNonWorkingDays
        ? moveWorkingDays(
            startDate,
            duration - (isWorkingDay(startDate, nonWorkingDates) ? 1 : 0),
            1,
            nonWorkingDates,
          )
        : moveDays(startDate, duration - 1);
    } else if (endDate) {
      startDate = excludeNonWorkingDays
        ? moveWorkingDays(
            endDate,
            duration - (isWorkingDay(endDate, nonWorkingDates) ? 1 : 0),
            -1,
            nonWorkingDates,
          )
        : moveDays(endDate, -(duration - 1));
    } else {
      throw new BadRequestException(
        'Для расчета длительности укажите начало или конец задачи',
      );
    }
    return { startDate, endDate };
  }

  const calendarDays = DEFAULT_TASK_DURATION * 7 / 5 - 1;

  if (startDate && !endDate) {
    endDate = excludeNonWorkingDays
      ? moveWorkingDays(
          startDate,
          DEFAULT_TASK_DURATION - (isWorkingDay(startDate, nonWorkingDates) ? 1 : 0),
          1,
          nonWorkingDates,
        )
      : moveDays(startDate, calendarDays);
  } else if (!startDate && endDate) {
    startDate = excludeNonWorkingDays
      ? moveWorkingDays(
          endDate,
          DEFAULT_TASK_DURATION - (isWorkingDay(endDate, nonWorkingDates) ? 1 : 0),
          -1,
          nonWorkingDates,
        )
      : moveDays(endDate, -calendarDays);
  }

  validateDateRange(startDate, endDate);
  return { startDate, endDate };
}

export function validateDateRange(startDate: Date | null, endDate: Date | null) {
  if (startDate && endDate && startDate > endDate) {
    throw new BadRequestException(
      'Дата окончания не может быть раньше даты начала',
    );
  }
}
