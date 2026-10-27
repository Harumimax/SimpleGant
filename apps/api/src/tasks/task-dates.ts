import { BadRequestException } from '@nestjs/common';

import { DEFAULT_TASK_DURATION } from './task.constants.js';

export function parseDateOnly(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export function calculateDuration(startDate: Date | null, endDate: Date | null) {
  if (!startDate || !endDate || startDate > endDate) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

function moveDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function isWorkingDay(date: Date) {
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

function moveWorkingDays(date: Date, count: number, direction: 1 | -1) {
  let next = new Date(date);
  let remaining = count;
  while (remaining > 0) {
    next = moveDays(next, direction);
    if (isWorkingDay(next)) remaining -= 1;
  }
  return next;
}

export function normalizeCreationDates(
  startValue?: string,
  endValue?: string,
  excludeWeekends = true,
  duration?: number,
) {
  let startDate = startValue ? parseDateOnly(startValue) : null;
  let endDate = endValue ? parseDateOnly(endValue) : null;

  if (duration !== undefined) {
    if (startDate) {
      endDate = moveDays(startDate, duration - 1);
    } else if (endDate) {
      startDate = moveDays(endDate, -(duration - 1));
    } else {
      throw new BadRequestException(
        'Для расчета длительности укажите начало или конец задачи',
      );
    }
    return { startDate, endDate };
  }

  const calendarDays = DEFAULT_TASK_DURATION * 7 / 5 - 1;

  if (startDate && !endDate) {
    endDate = excludeWeekends
      ? moveWorkingDays(
          startDate,
          DEFAULT_TASK_DURATION - (isWorkingDay(startDate) ? 1 : 0),
          1,
        )
      : moveDays(startDate, calendarDays);
  } else if (!startDate && endDate) {
    startDate = excludeWeekends
      ? moveWorkingDays(
          endDate,
          DEFAULT_TASK_DURATION - (isWorkingDay(endDate) ? 1 : 0),
          -1,
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
