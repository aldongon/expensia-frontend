'use client';

import { apiFetch } from '@/lib/api-fetch';
import { readJsonResponse } from '@/lib/auth-client';

export type RecurringRule = {
  id: number;
  amount: string;
  currencyCode: string;
  paymentMethod: string | null;
  startMonth: string;
  endMonth: string | null;
};

export type RecurringExpense = {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  currentRule: RecurringRule | null;
  ruleHistory: RecurringRule[];
  createdAt: string;
};

export type CreateRecurringExpenseRequest = {
  name: string;
  amount: string;
  currencyCode: string;
  startMonth: string;
  description?: string;
  paymentMethodName?: string;
  tagNames?: string[];
};

export async function fetchRecurringExpenses(): Promise<RecurringExpense[]> {
  const response = await apiFetch('/api/recurring-expenses');

  return readJsonResponse<RecurringExpense[]>(
    response,
    'No se pudieron cargar los gastos recurrentes.'
  );
}

export async function createRecurringExpense(
  body: CreateRecurringExpenseRequest
): Promise<RecurringExpense> {
  const response = await apiFetch('/api/recurring-expenses', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<RecurringExpense>(response, 'No se pudo crear el gasto recurrente.');
}
