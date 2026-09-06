import { useQuery } from '@tanstack/react-query';

import { fetchExpenses } from '@/lib/api/expenses';
import { queryKeys } from '@/lib/query-keys';

export function useExpenses(month: string) {
  return useQuery({
    queryKey: queryKeys.expenses(month),
    queryFn: () => fetchExpenses(month),
  });
}
