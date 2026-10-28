import { apiRequest } from '../../lib/api';

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

export type Task = {
  id: string;
  projectId: string;
  parentId: string | null;
  orderIndex: number;
  level: number;
  title: string;
  workType: string | null;
  assignee: string;
  estimate: string | null;
  duration: number | null;
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
  color: string;
  isCollapsed: boolean;
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  workType?: string | null;
  assignee: string;
  estimate?: string | null;
  duration?: number;
  status: TaskStatus;
  color?: TaskColor;
  startDate?: string | null;
  endDate?: string | null;
  excludeWeekends?: boolean;
  customFields?: Record<string, string>;
};

export type TaskUpdateInput = Partial<
  Omit<TaskInput, 'excludeWeekends'>
> & { isCollapsed?: boolean };

export type TaskPositionInput = Pick<
  Task,
  'id' | 'parentId' | 'orderIndex'
>;

export function listTasks(projectId: string) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks`);
}

export function createTask(projectId: string, input: TaskInput) {
  return apiRequest<Task>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(
  projectId: string,
  taskId: string,
  input: TaskUpdateInput,
) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTask(projectId: string, taskId: string) {
  return apiRequest<void>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export function reorderTasks(projectId: string, tasks: TaskPositionInput[]) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks/order`, {
    method: 'PUT',
    body: JSON.stringify({ tasks }),
  });
}
