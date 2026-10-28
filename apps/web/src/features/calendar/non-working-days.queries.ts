import { useQuery } from '@tanstack/react-query';

import { listNonWorkingDays } from './non-working-days.api';

export function nonWorkingDaysQueryKey(projectId: string) {
  return ['projects', projectId, 'non-working-days'] as const;
}

export function useNonWorkingDays(projectId: string) {
  return useQuery({
    queryKey: nonWorkingDaysQueryKey(projectId),
    queryFn: () => listNonWorkingDays(projectId),
    enabled: Boolean(projectId),
  });
}
