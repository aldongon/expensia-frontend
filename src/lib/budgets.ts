'use client';

import { apiFetch } from '@/lib/api-fetch';
import { readJsonResponse, readProblemDetail } from '@/lib/auth-client';

export type BudgetSummary = {
  month: string;
  currencyCode: string;
  totalBudget: string;
  remainingBudget: string;
  dailyBudget: string;
};

export type Budget = {
  id: number;
  month: string;
  amount: string;
  currencyCode: string;
  createdAt: string;
};

export type CreateBudgetRequest = {
  amount: string;
  currencyCode: string;
  month: string;
};

/**
 * Current-month budget summary. The backend returns 200 with an EMPTY body when there is no budget
 * for the current month, so we can't reuse `readJsonResponse` (it calls `response.json()`, which
 * throws on an empty body). We read the text first and treat an empty body as "no budget" (`null`).
 */
export async function fetchCurrentBudget(): Promise<BudgetSummary | null> {
  const response = await apiFetch('/api/budgets/current');

  if (!response.ok) {
    await readProblemDetail(response, 'No se pudo cargar el presupuesto.');
  }

  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  return JSON.parse(text) as BudgetSummary;
}

export async function createBudget(body: CreateBudgetRequest): Promise<Budget> {
  const response = await apiFetch('/api/budgets', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<Budget>(response, 'No se pudo crear el presupuesto.');
}
