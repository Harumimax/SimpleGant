import { useQuery } from '@tanstack/react-query';

import { getGantt } from './gantt.api';

export function ganttQueryKey(projectId: string) {
  return ['projects', projectId, 'gantt'] as const;
}

export function useGantt(projectId: string) {
  return useQuery({
    queryKey: ganttQueryKey(projectId),
    queryFn: () => getGantt(projectId),
    enabled: Boolean(projectId),
  });
}
