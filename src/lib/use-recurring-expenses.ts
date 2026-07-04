'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRecurringExpense, fetchRecurringExpenses } from '@/lib/recurring-expenses';

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: fetchRecurringExpenses,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      // A current-month create generates an occurrence the expenses list should reflect.
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
