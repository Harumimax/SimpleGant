import { useQuery } from '@tanstack/react-query';

import { getPublicGantt } from './public-share.api';

export function usePublicGantt(publicToken: string) {
  return useQuery({
    queryKey: ['public-projects', publicToken, 'gantt'],
    queryFn: () => getPublicGantt(publicToken),
    enabled: Boolean(publicToken),
    retry: false,
  });
}
