import type { Task } from '../tasks/tasks.api';

export function taskValue(task: Task, key: string) {
  if (key === 'title') return task.title;
  if (key === 'workType') return task.workType || '—';
  if (key === 'assignee') return task.assignee || '—';
  if (key === 'duration' || key === 'estimate') {
    return task.duration === null || task.duration === undefined
      ? '—'
      : `${task.duration} дн.`;
  }
  if (key === 'status') return task.status;
  return task.customFields[key] || '—';
}
