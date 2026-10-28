export const TASK_STATUSES = [
  'Ожидает',
  'В работе',
  'На паузе',
  'Завершено',
  'Заблокировано',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_WORK_TYPES = [
  'Бизнес-Анализ',
  'Архитектура',
  'Системный анализ',
  'Разработка',
  'Тестирование',
  'Интеграционное тестирование',
  'Приемка',
  'Релиз',
] as const;

export type TaskWorkType = (typeof TASK_WORK_TYPES)[number];

export function isTaskWorkType(value: string): value is TaskWorkType {
  return TASK_WORK_TYPES.some((workType) => workType === value);
}

export const TASK_COLORS = [
  'sage',
  'blue',
  'sky',
  'lavender',
  'plum',
  'rose',
  'coral',
  'sand',
  'amber',
  'teal',
] as const;

export type TaskColor = (typeof TASK_COLORS)[number];

export function isTaskColor(value: string): value is TaskColor {
  return TASK_COLORS.some((color) => color === value);
}

export const DEFAULT_TASK_COLOR: TaskColor = 'sage';
export const DEFAULT_TASK_DURATION = 10;
