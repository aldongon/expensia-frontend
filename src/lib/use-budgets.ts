'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createBudget, fetchCurrentBudget } from '@/lib/budgets';

export function useCurrentBudget() {
  return useQuery({
    queryKey: ['budget', 'current'],
    queryFn: fetchCurrentBudget,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', 'current'] });
    },
  });
}
