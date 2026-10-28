import { apiRequest } from '../../lib/api';
import type { GanttAggregate } from '../gantt/gantt.api';
import type { MilestoneColor } from '../milestones/milestones.api';
import type { TaskStatus } from '../tasks/tasks.api';

type PublicGanttResponse = {
  project: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    columns: GanttAggregate['project']['columns'];
  };
  tasks: Array<{
    id: string;
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
  }>;
  milestones: Array<{
    id: string;
    title: string;
    date: string;
    color: MilestoneColor;
  }>;
  nonWorkingDays: Array<{
    id: string;
    date: string;
    label: string | null;
  }>;
};

export async function getPublicGantt(publicToken: string): Promise<GanttAggregate> {
  const response = await apiRequest<PublicGanttResponse>(
    `/public/projects/${publicToken}/gantt`,
  );
  return {
    project: {
      ...response.project,
      createdAt: '',
      updatedAt: '',
    },
    tasks: response.tasks.map((task) => ({
      ...task,
      projectId: response.project.id,
      createdAt: '',
      updatedAt: '',
    })),
    milestones: response.milestones.map((milestone) => ({
      ...milestone,
      projectId: response.project.id,
      createdAt: '',
      updatedAt: '',
    })),
    nonWorkingDays: response.nonWorkingDays.map((day) => ({
      ...day,
      projectId: response.project.id,
      createdAt: '',
      updatedAt: '',
    })),
  };
}
