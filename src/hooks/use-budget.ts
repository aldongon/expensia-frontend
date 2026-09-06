import { useQuery } from '@tanstack/react-query';

import { fetchBudgetHistory, fetchCurrentBudget } from '@/lib/api/budgets';
import { queryKeys } from '@/lib/query-keys';

export function useCurrentBudget() {
  return useQuery({
    queryKey: queryKeys.budgetCurrent(),
    queryFn: fetchCurrentBudget,
  });
}

export function useBudgetHistory(months = 6) {
  return useQuery({
    queryKey: queryKeys.budgetHistory(months),
    queryFn: () => fetchBudgetHistory(months),
    retry: false,
  });
}
