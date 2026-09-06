'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { createBudget } from '@/lib/api/budgets';
import { isPositiveAmount, validateAgainstScale } from '@/lib/decimal';
import { scaleOf } from '@/lib/currency';
import { formatAmount, formatMonthYear } from '@/lib/format';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { CurrencyResponse } from '@/types/api';

interface CreateBudgetFormProps {
  month: string;
  currencies: CurrencyResponse[];
}

export function CreateBudgetForm({ month, currencies }: CreateBudgetFormProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState(currencies[0]?.code ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!isPositiveAmount(amount)) {
      setMessage('amount must be a positive amount (400)');
      return;
    }

    const scale = scaleOf(currencies, currencyCode);

    if (!validateAgainstScale(amount, scale)) {
      setMessage(`amount exceeds the scale of ${currencyCode} (400)`);
      return;
    }

    setSubmitting(true);

    try {
      await createBudget({ amount: Number(amount), currencyCode, month });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetCurrent() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetHistory(6) }),
      ]);
      setMessage(
        `Presupuesto de ${formatMonthYear(month)} creado: ${formatAmount(amount, currencyCode, scale)}`
      );
      setAmount('');
    } catch (error) {
      setMessage(
        error instanceof ApiProblemError
          ? `${error.message} (${error.status})`
          : 'No pudimos conectarnos con el servidor.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg p-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <h4>Presupuesto de {formatMonthYear(month)}</h4>
      <form className="flex flex-wrap items-end gap-4" onSubmit={handleSubmit}>
        <div className="field min-w-[160px] flex-1">
          <label>Monto</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="field w-[120px]">
          <label>Moneda</label>
          <select
            className="input"
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          Crear
        </button>
      </form>
      {message ? (
        <span className="text-xs" style={{ color: 'var(--color-accent-ink)' }}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
