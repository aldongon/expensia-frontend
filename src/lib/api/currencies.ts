import { apiFetch, ensureOk } from '@/lib/api-fetch';
import type { CurrencyRequest, CurrencyResponse } from '@/types/api';

export async function fetchCurrencies(): Promise<CurrencyResponse[]> {
  const response = await apiFetch('/api/currencies');

  await ensureOk(response, 'No se pudieron cargar las monedas.');

  return response.json() as Promise<CurrencyResponse[]>;
}

export async function createCurrency(payload: CurrencyRequest): Promise<CurrencyResponse> {
  const response = await apiFetch('/api/currencies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo crear la moneda.');

  return response.json() as Promise<CurrencyResponse>;
}

export async function deleteCurrency(id: number): Promise<void> {
  const response = await apiFetch(`/api/currencies/${id}`, { method: 'DELETE' });

  await ensureOk(response, 'No se pudo eliminar la moneda.');
}
