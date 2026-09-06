import { useQuery } from '@tanstack/react-query';

import { fetchRecurringExpenses } from '@/lib/api/recurring-expenses';
import { queryKeys } from '@/lib/query-keys';

export function useRecurringExpenses() {
  return useQuery({
    queryKey: queryKeys.recurringExpenses(),
    queryFn: fetchRecurringExpenses,
  });
}
