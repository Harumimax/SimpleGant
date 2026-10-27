import { useQuery } from '@tanstack/react-query';

import { listMilestones } from './milestones.api';

export function milestonesQueryKey(projectId: string) {
  return ['projects', projectId, 'milestones'] as const;
}

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: milestonesQueryKey(projectId),
    queryFn: () => listMilestones(projectId),
    enabled: Boolean(projectId),
  });
}
