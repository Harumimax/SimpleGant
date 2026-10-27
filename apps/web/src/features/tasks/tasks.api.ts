import { apiRequest } from '../../lib/api';

export const TASK_STATUSES = [
  'Ожидает',
  'В работе',
  'На паузе',
  'Завершено',
  'Заблокировано',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

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
  status: TaskStatus;
  startDate?: string | null;
  endDate?: string | null;
  excludeWeekends?: boolean;
};

export function listTasks(projectId: string) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks`);
}

export function createTask(projectId: string, input: TaskInput) {
  return apiRequest<Task>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(projectId: string, taskId: string, input: TaskInput) {
  return apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTask(projectId: string, taskId: string) {
  return apiRequest<void>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}
