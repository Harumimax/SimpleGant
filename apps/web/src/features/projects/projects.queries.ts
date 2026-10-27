import { useQuery } from '@tanstack/react-query';

import { getProject, listProjects } from './projects.api';

export const projectsQueryKey = ['projects'] as const;

export function projectQueryKey(id: string) {
  return [...projectsQueryKey, id] as const;
}

export function useProjects() {
  return useQuery({ queryKey: projectsQueryKey, queryFn: listProjects });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectQueryKey(id),
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  });
}
