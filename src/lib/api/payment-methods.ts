import { apiFetch, ensureOk } from '@/lib/api-fetch';
import type { NameRequest, PaymentMethodResponse } from '@/types/api';

export async function fetchPaymentMethods(): Promise<PaymentMethodResponse[]> {
  const response = await apiFetch('/api/payment-methods');

  await ensureOk(response, 'No se pudieron cargar los métodos de pago.');

  return response.json() as Promise<PaymentMethodResponse[]>;
}

export async function createPaymentMethod(payload: NameRequest): Promise<PaymentMethodResponse> {
  const response = await apiFetch('/api/payment-methods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo crear el método de pago.');

  return response.json() as Promise<PaymentMethodResponse>;
}

export async function deletePaymentMethod(id: number): Promise<void> {
  const response = await apiFetch(`/api/payment-methods/${id}`, { method: 'DELETE' });

  await ensureOk(response, 'No se pudo eliminar el método de pago.');
}
