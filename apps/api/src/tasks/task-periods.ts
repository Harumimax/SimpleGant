import { BadRequestException } from '@nestjs/common';

import { isTaskColor, type TaskColor } from './task.constants.js';
import { calculateDuration, dateOnly, parseDateOnly, validateDateRange } from './task-dates.js';

export const MAX_TASK_PERIODS = 5;

export type TaskPeriod = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  includeInDuration: boolean;
  color: TaskColor;
};

export type TaskWithPeriods = {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  includeInDuration: boolean;
  color: string;
  periods: unknown;
};

export function readTaskPeriods(value: unknown): TaskPeriod[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const period = item as Partial<TaskPeriod>;
    if (
      typeof period.id !== 'string' ||
      typeof period.title !== 'string' ||
      typeof period.startDate !== 'string' ||
      typeof period.endDate !== 'string' ||
      typeof period.includeInDuration !== 'boolean' ||
      typeof period.color !== 'string' ||
      !isTaskColor(period.color)
    ) return [];
    return [{
      id: period.id,
      title: period.title,
      startDate: period.startDate,
      endDate: period.endDate,
      includeInDuration: period.includeInDuration,
      color: period.color,
    }];
  });
}

export function allTaskPeriods(task: TaskWithPeriods): TaskPeriod[] {
  const primaryStart = dateOnly(task.startDate);
  const primaryEnd = dateOnly(task.endDate);
  const primary = primaryStart && primaryEnd ? [{
    id: task.id,
    title: task.title,
    startDate: primaryStart,
    endDate: primaryEnd,
    includeInDuration: task.includeInDuration !== false,
    color: isTaskColor(task.color) ? task.color : 'sage' as TaskColor,
  }] : [];
  return [...primary, ...readTaskPeriods(task.periods)];
}

export function validateTaskPeriods(task: TaskWithPeriods) {
  const additional = readTaskPeriods(task.periods);
  if (!Array.isArray(task.periods) || additional.length !== task.periods.length) {
    throw new BadRequestException('Периоды задачи имеют неверный формат');
  }
  if (additional.length > MAX_TASK_PERIODS - 1) {
    throw new BadRequestException('У задачи может быть не более пяти периодов');
  }
  const periods = allTaskPeriods(task);
  if (periods.length > 0 && !periods.some(({ includeInDuration }) => includeInDuration)) {
    throw new BadRequestException('Хотя бы один период должен учитываться в общей длительности');
  }
  const ids = periods.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException('Периоды задачи не должны повторяться');
  }
  for (const period of periods) {
    if (!period.title.trim()) {
      throw new BadRequestException('Укажите название каждого периода');
    }
    const start = parseDateOnly(period.startDate);
    const end = parseDateOnly(period.endDate);
    validateDateRange(start, end);
  }
  const sorted = [...periods].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  );
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index]!.startDate <= sorted[index - 1]!.endDate) {
      throw new BadRequestException('Периоды одной задачи не должны пересекаться');
    }
  }
  return additional.map((period) => ({ ...period, title: period.title.trim() }));
}

export function taskPeriodBounds(task: TaskWithPeriods) {
  const dates = [
    dateOnly(task.startDate),
    dateOnly(task.endDate),
    ...readTaskPeriods(task.periods).flatMap((period) => [period.startDate, period.endDate]),
  ].filter((date): date is string => Boolean(date));
  if (dates.length === 0) return { startDate: null, endDate: null };
  return {
    startDate: parseDateOnly(dates.reduce((min, date) => date < min ? date : min, dates[0]!)),
    endDate: parseDateOnly(dates.reduce((max, date) => date > max ? date : max, dates[0]!)),
  };
}

export function calculateTaskPeriodsDuration(
  task: TaskWithPeriods,
  excludeNonWorkingDays: boolean,
  nonWorkingDates: ReadonlySet<string>,
) {
  return allTaskPeriods(task)
    .filter(({ includeInDuration }) => includeInDuration)
    .reduce((total, period) => total + (calculateDuration(
      parseDateOnly(period.startDate),
      parseDateOnly(period.endDate),
      excludeNonWorkingDays,
      nonWorkingDates,
    ) ?? 0), 0);
}
