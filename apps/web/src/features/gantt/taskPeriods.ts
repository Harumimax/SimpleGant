import {
  isTaskColor,
  type Task,
  type TaskColor,
  type TaskPeriod,
} from '../tasks/tasks.api';
import { calculateTaskDuration } from './timeline';

export const MAX_TASK_PERIODS = 5;

export function taskPeriods(task: Task): TaskPeriod[] {
  const primary = task.startDate && task.endDate ? [{
    id: task.id,
    title: task.title,
    startDate: task.startDate,
    endDate: task.endDate,
    includeInDuration: task.includeInDuration,
    color: (isTaskColor(task.color) ? task.color : 'sage') as TaskColor,
  }] : [];
  return [...primary, ...task.periods];
}

export function taskDateBounds(task: Task) {
  const dates = [
    task.startDate,
    task.endDate,
    ...task.periods.flatMap((period) => [period.startDate, period.endDate]),
  ].filter((date): date is string => Boolean(date));
  if (dates.length === 0) return { startDate: null, endDate: null };
  return {
    startDate: dates.reduce((min, date) => date < min ? date : min, dates[0]!),
    endDate: dates.reduce((max, date) => date > max ? date : max, dates[0]!),
  };
}

export function taskPeriodsDuration(
  task: Task,
  excludeNonWorkingDays: boolean,
  nonWorkingDays: ReadonlyArray<{ date: string }>,
) {
  return taskPeriods(task)
    .filter(({ includeInDuration }) => includeInDuration)
    .reduce((total, period) => total + (calculateTaskDuration(
      period.startDate,
      period.endDate,
      excludeNonWorkingDays,
      nonWorkingDays,
    ) ?? 0), 0);
}

export function periodsOverlap(periods: TaskPeriod[]) {
  const sorted = [...periods].sort((left, right) => left.startDate.localeCompare(right.startDate));
  return sorted.some((period, index) => index > 0 && period.startDate <= sorted[index - 1]!.endDate);
}

export function canUsePeriodDates(
  task: Task,
  periodId: string,
  startDate: string,
  endDate: string,
) {
  const periods = [...taskPeriods(task)].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  );
  const index = periods.findIndex(({ id }) => id === periodId);
  if (index < 0) return false;
  const previous = periods[index - 1];
  const next = periods[index + 1];
  return (!previous || startDate > previous.endDate)
    && (!next || endDate < next.startDate);
}
