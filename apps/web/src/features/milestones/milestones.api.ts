import { apiRequest } from '../../lib/api';

export const MILESTONE_COLORS = [
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

export type MilestoneColor = (typeof MILESTONE_COLORS)[number];

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  color: MilestoneColor;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneInput = {
  title: string;
  date: string;
  color: MilestoneColor;
};

export function listMilestones(projectId: string) {
  return apiRequest<Milestone[]>(`/projects/${projectId}/milestones`);
}

export function createMilestone(projectId: string, input: MilestoneInput) {
  return apiRequest<Milestone>(`/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMilestone(
  projectId: string,
  milestoneId: string,
  input: MilestoneInput,
) {
  return apiRequest<Milestone>(
    `/projects/${projectId}/milestones/${milestoneId}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export function deleteMilestone(projectId: string, milestoneId: string) {
  return apiRequest<void>(
    `/projects/${projectId}/milestones/${milestoneId}`,
    { method: 'DELETE' },
  );
}
