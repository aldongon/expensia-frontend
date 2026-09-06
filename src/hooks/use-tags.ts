import { useQuery } from '@tanstack/react-query';

import { fetchTags } from '@/lib/api/tags';
import { queryKeys } from '@/lib/query-keys';

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags(),
    queryFn: fetchTags,
  });
}
