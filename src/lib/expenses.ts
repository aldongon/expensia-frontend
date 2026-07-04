'use client';

import { apiFetch } from '@/lib/api-fetch';
import { readJsonResponse } from '@/lib/auth-client';

export type Expense = {
  id: number;
  amount: string;
  currencyCode: string;
  expenseDate: string;
  description: string | null;
  tags: string[];
  paymentMethod: string | null;
  settlementAmount: string | null;
  settlementCurrencyCode: string | null;
  recurringExpenseId: number | null;
  createdAt: string;
};

export type Currency = {
  id: number;
  code: string;
  name: string;
  scale: number;
};

export type Tag = {
  id: number;
  name: string;
};

export type PaymentMethod = {
  id: number;
  name: string;
};

export type CreateExpenseRequest = {
  amount: string;
  currencyCode: string;
  expenseDate?: string;
  description?: string;
  tagNames?: string[];
  paymentMethodName?: string;
  settlementAmount?: string;
  settlementCurrencyCode?: string;
};

export type CreateCurrencyRequest = {
  code: string;
  name: string;
  scale: number;
};

export type CreateTagRequest = {
  name: string;
};

export type CreatePaymentMethodRequest = {
  name: string;
};

export async function fetchExpenses(month: string): Promise<Expense[]> {
  const response = await apiFetch(`/api/expenses?month=${encodeURIComponent(month)}`);

  return readJsonResponse<Expense[]>(response, 'No se pudieron cargar los gastos.');
}

export async function createExpense(body: CreateExpenseRequest): Promise<Expense> {
  const response = await apiFetch('/api/expenses', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<Expense>(response, 'No se pudo registrar el gasto.');
}

export async function fetchCurrencies(): Promise<Currency[]> {
  const response = await apiFetch('/api/currencies');

  return readJsonResponse<Currency[]>(response, 'No se pudieron cargar las monedas.');
}

export async function createCurrency(body: CreateCurrencyRequest): Promise<Currency> {
  const response = await apiFetch('/api/currencies', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<Currency>(response, 'No se pudo crear la moneda.');
}

export async function fetchTags(): Promise<Tag[]> {
  const response = await apiFetch('/api/tags');

  return readJsonResponse<Tag[]>(response, 'No se pudieron cargar los tags.');
}

export async function createTag(body: CreateTagRequest): Promise<Tag> {
  const response = await apiFetch('/api/tags', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<Tag>(response, 'No se pudo crear el tag.');
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await apiFetch('/api/payment-methods');

  return readJsonResponse<PaymentMethod[]>(response, 'No se pudieron cargar los métodos de pago.');
}

export async function createPaymentMethod(
  body: CreatePaymentMethodRequest
): Promise<PaymentMethod> {
  const response = await apiFetch('/api/payment-methods', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<PaymentMethod>(response, 'No se pudo crear el método de pago.');
}
