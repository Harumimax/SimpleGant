import { apiRequest } from '../../lib/api';
import type { NonWorkingDay } from '../calendar/non-working-days.api';
import type { Milestone } from '../milestones/milestones.api';
import type { ProjectDetail } from '../projects/projects.api';
import type { Task } from '../tasks/tasks.api';
import { normalizeTaskOrder } from './taskHierarchy';

export type GanttAggregate = {
  project: ProjectDetail;
  tasks: Task[];
  milestones: Milestone[];
  nonWorkingDays: NonWorkingDay[];
};

export type GanttSaveInput = {
  columns: Array<Pick<ProjectDetail['columns'][number], 'id' | 'name' | 'isVisible'>>;
  tasks: Array<Pick<
    Task,
    | 'id'
    | 'parentId'
    | 'orderIndex'
    | 'title'
    | 'workType'
    | 'assignee'
    | 'estimate'
    | 'comment'
    | 'status'
    | 'startDate'
    | 'endDate'
    | 'color'
    | 'isCollapsed'
    | 'customFields'
  >>;
  milestones: Array<Pick<Milestone, 'id' | 'title' | 'date' | 'color'>>;
  nonWorkingDays: Array<Pick<NonWorkingDay, 'id' | 'date' | 'label'>>;
};

export function getGantt(projectId: string) {
  return apiRequest<GanttAggregate>(`/projects/${projectId}/gantt`);
}

export function saveGantt(
  projectId: string,
  aggregate: GanttAggregate,
  options: Pick<RequestInit, 'keepalive'> = {},
) {
  const tasks = normalizeTaskOrder(aggregate.tasks);
  const input: GanttSaveInput = {
    columns: aggregate.project.columns.map(({ id, name, isVisible }) => ({
      id,
      name,
      isVisible,
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      parentId: task.parentId,
      orderIndex: task.orderIndex,
      title: task.title,
      workType: task.workType,
      assignee: task.assignee,
      estimate: task.estimate,
      comment: task.comment,
      status: task.status,
      startDate: task.startDate,
      endDate: task.endDate,
      color: task.color,
      isCollapsed: task.isCollapsed,
      customFields: task.customFields,
    })),
    milestones: aggregate.milestones.map(({ id, title, date, color }) => ({
      id,
      title,
      date,
      color,
    })),
    nonWorkingDays: aggregate.nonWorkingDays.map(({ id, date, label }) => ({
      id,
      date,
      label,
    })),
  };
  return apiRequest<GanttAggregate>(`/projects/${projectId}/gantt`, {
    method: 'PUT',
    body: JSON.stringify(input),
    ...options,
  });
}
