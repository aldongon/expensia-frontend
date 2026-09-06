import { apiFetch, ensureOk } from '@/lib/api-fetch';
import type { ExpenseRequest, ExpenseResponse } from '@/types/api';

export async function fetchExpenses(month: string): Promise<ExpenseResponse[]> {
  const response = await apiFetch(`/api/expenses?month=${month}`);

  await ensureOk(response, 'No se pudieron cargar los gastos.');

  return response.json() as Promise<ExpenseResponse[]>;
}

export async function createExpense(payload: ExpenseRequest): Promise<ExpenseResponse> {
  const response = await apiFetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo crear el gasto.');

  return response.json() as Promise<ExpenseResponse>;
}

export async function updateExpense(id: number, payload: ExpenseRequest): Promise<ExpenseResponse> {
  const response = await apiFetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo guardar el gasto.');

  return response.json() as Promise<ExpenseResponse>;
}

export async function deleteExpense(id: number): Promise<void> {
  const response = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });

  await ensureOk(response, 'No se pudo eliminar el gasto.');
}
