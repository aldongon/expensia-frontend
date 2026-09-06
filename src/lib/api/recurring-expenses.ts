import { apiFetch, ensureOk } from '@/lib/api-fetch';
import type {
  CreateRecurringExpenseRequest,
  PriceChangeRequest,
  RecurringExpenseResponse,
  UpdateRecurringExpenseRequest,
} from '@/types/api';

export async function fetchRecurringExpenses(): Promise<RecurringExpenseResponse[]> {
  const response = await apiFetch('/api/recurring-expenses');

  await ensureOk(response, 'No se pudieron cargar los gastos recurrentes.');

  return response.json() as Promise<RecurringExpenseResponse[]>;
}

export async function createRecurringExpense(
  payload: CreateRecurringExpenseRequest
): Promise<RecurringExpenseResponse> {
  const response = await apiFetch('/api/recurring-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo crear el recurrente.');

  return response.json() as Promise<RecurringExpenseResponse>;
}

export async function updateRecurringExpense(
  id: number,
  payload: UpdateRecurringExpenseRequest
): Promise<RecurringExpenseResponse> {
  const response = await apiFetch(`/api/recurring-expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo actualizar el recurrente.');

  return response.json() as Promise<RecurringExpenseResponse>;
}

export async function changeRecurringExpensePrice(
  id: number,
  payload: PriceChangeRequest
): Promise<RecurringExpenseResponse> {
  const response = await apiFetch(`/api/recurring-expenses/${id}/price-changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo cambiar el precio.');

  return response.json() as Promise<RecurringExpenseResponse>;
}

export async function cancelRecurringExpense(id: number): Promise<RecurringExpenseResponse> {
  const response = await apiFetch(`/api/recurring-expenses/${id}/cancellation`, {
    method: 'POST',
  });

  await ensureOk(response, 'No se pudo cancelar el recurrente.');

  return response.json() as Promise<RecurringExpenseResponse>;
}
