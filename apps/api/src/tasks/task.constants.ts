export const TASK_STATUSES = [
  'Ожидает',
  'В работе',
  'На паузе',
  'Завершено',
  'Заблокировано',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const DEFAULT_TASK_COLOR = 'sage';
export const DEFAULT_TASK_DURATION = 10;
