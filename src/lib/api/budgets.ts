import { apiFetch, ensureOk, readOptionalJson } from '@/lib/api-fetch';
import type {
  BudgetHistoryEntry,
  BudgetResponse,
  BudgetSummaryResponse,
  CreateBudgetRequest,
} from '@/types/api';

/** Returns null when the user has no budget for the current month (a valid 200-empty-body response). */
export async function fetchCurrentBudget(): Promise<BudgetSummaryResponse | null> {
  const response = await apiFetch('/api/budgets/current');

  await ensureOk(response, 'No se pudo cargar el presupuesto.');

  return readOptionalJson<BudgetSummaryResponse>(response);
}

export async function fetchBudgetHistory(months: number): Promise<BudgetHistoryEntry[]> {
  const response = await apiFetch(`/api/budgets/history?months=${months}`);

  await ensureOk(response, 'No se pudo cargar el histórico de presupuestos.');

  return response.json() as Promise<BudgetHistoryEntry[]>;
}

export async function createBudget(payload: CreateBudgetRequest): Promise<BudgetResponse> {
  const response = await apiFetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo crear el presupuesto.');

  return response.json() as Promise<BudgetResponse>;
}
