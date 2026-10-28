import { apiRequest } from '../../lib/api';

export type NonWorkingDay = {
  id: string;
  projectId: string;
  date: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NonWorkingDayInput = {
  date: string;
  label?: string;
};

export function listNonWorkingDays(projectId: string) {
  return apiRequest<NonWorkingDay[]>(`/projects/${projectId}/non-working-days`);
}

export function createNonWorkingDay(projectId: string, input: NonWorkingDayInput) {
  return apiRequest<NonWorkingDay>(`/projects/${projectId}/non-working-days`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteNonWorkingDay(projectId: string, dayId: string) {
  return apiRequest<void>(`/projects/${projectId}/non-working-days/${dayId}`, {
    method: 'DELETE',
  });
}
