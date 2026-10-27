import { apiRequest } from '../../lib/api';

export type Project = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectColumn = {
  id: string;
  name: string;
  key: string;
  orderIndex: number;
  isVisible: boolean;
  isDefault: boolean;
};

export type ProjectDetail = Project & { columns: ProjectColumn[] };

export type ProjectColumnConfigurationInput = {
  id?: string;
  name: string;
  isVisible: boolean;
};

export type ProjectInput = {
  name: string;
  startDate: string;
  endDate: string;
};

export function listProjects() {
  return apiRequest<Project[]>('/projects');
}

export function getProject(id: string) {
  return apiRequest<ProjectDetail>(`/projects/${id}`);
}

export function createProject(input: ProjectInput) {
  return apiRequest<ProjectDetail>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProject(id: string, input: ProjectInput) {
  return apiRequest<ProjectDetail>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string) {
  return apiRequest<void>(`/projects/${id}`, { method: 'DELETE' });
}

export function configureProjectColumns(
  projectId: string,
  columns: ProjectColumnConfigurationInput[],
) {
  return apiRequest<ProjectColumn[]>(`/projects/${projectId}/columns`, {
    method: 'PUT',
    body: JSON.stringify({ columns }),
  });
}
