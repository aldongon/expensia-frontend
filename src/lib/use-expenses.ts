'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCurrency,
  createExpense,
  createPaymentMethod,
  createTag,
  fetchCurrencies,
  fetchExpenses,
  fetchPaymentMethods,
  fetchTags,
  type CreateExpenseRequest,
} from '@/lib/expenses';

export function useExpenses(month: string) {
  return useQuery({
    queryKey: ['expenses', month],
    queryFn: () => fetchExpenses(month),
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: fetchPaymentMethods,
  });
}

export function useCreateExpense(month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateExpenseRequest) => createExpense(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', month] });
    },
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}
