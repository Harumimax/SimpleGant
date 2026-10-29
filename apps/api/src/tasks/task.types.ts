import type { TaskStatus } from './task.constants.js';
import type { TaskPeriod } from './task-periods.js';

export type TaskView = {
  id: string;
  projectId: string;
  parentId: string | null;
  orderIndex: number;
  level: number;
  title: string;
  workType: string | null;
  assignee: string;
  estimate: string | null;
  comment: string | null;
  duration: number | null;
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
  color: string;
  includeInDuration: boolean;
  periods: TaskPeriod[];
  isCollapsed: boolean;
  customFields: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
};
