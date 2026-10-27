import { useQuery } from '@tanstack/react-query';

import { listTasks } from './tasks.api';

export function tasksQueryKey(projectId: string) {
  return ['projects', projectId, 'tasks'] as const;
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: tasksQueryKey(projectId),
    queryFn: () => listTasks(projectId),
    enabled: Boolean(projectId),
  });
}
