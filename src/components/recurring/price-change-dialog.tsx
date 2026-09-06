'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DialogShell } from '@/components/ui/dialog-shell';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { changeRecurringExpensePrice } from '@/lib/api/recurring-expenses';
import { isPositiveAmount, validateAgainstScale } from '@/lib/decimal';
import { scaleOf } from '@/lib/currency';
import { currentMonth } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { CurrencyResponse, RecurringExpenseResponse } from '@/types/api';

interface PriceChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RecurringExpenseResponse | null;
  currencies: CurrencyResponse[];
}

export function PriceChangeDialog({
  open,
  onOpenChange,
  item,
  currencies,
}: PriceChangeDialogProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  useEffect(() => {
    if (open && item?.currentRule) {
      setAmount('');
      setCurrencyCode(item.currentRule.currencyCode);
      setError(null);
    }
  }, [open, item]);

  function close() {
    onOpenChange(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item) {
      return;
    }

    if (!isPositiveAmount(amount)) {
      setError({ detail: 'amount must be a positive amount', status: '400 Bad Request' });
      return;
    }

    const scale = scaleOf(currencies, currencyCode);

    if (!validateAgainstScale(amount, scale)) {
      setError({
        detail: `amount exceeds the scale of ${currencyCode}`,
        status: '400 Bad Request',
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await changeRecurringExpensePrice(item.id, { amount: Number(amount), currencyCode });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(currentMonth()) }),
      ]);
      toast.success('Precio actualizado');
      close();
    } catch (submitError) {
      if (submitError instanceof ApiProblemError) {
        setError({ detail: submitError.message, status: `${submitError.status}` });
      } else {
        setError({ detail: 'No pudimos conectarnos con el servidor.', status: 'Error de red' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(next) : close())}
      title="Cambiar precio"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <p className="dialog-body m-0">
          Rige desde el próximo mes. La ocurrencia de este mes no cambia.
        </p>

        <div className="grid grid-cols-[1fr_110px] gap-3">
          <div className="field">
            <label>Nuevo monto</label>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
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
        </div>

        {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Aplicar
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
