'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { ChipToggle } from '@/components/ui/chip-toggle';
import { DialogShell } from '@/components/ui/dialog-shell';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { createRecurringExpense } from '@/lib/api/recurring-expenses';
import { scaleOf } from '@/lib/currency';
import { isPositiveAmount, validateAgainstScale } from '@/lib/decimal';
import { formatMonthYear } from '@/lib/format';
import { currentMonth, nextMonth } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { CurrencyResponse, PaymentMethodResponse, TagResponse } from '@/types/api';

interface NewRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: CurrencyResponse[];
  tags: TagResponse[];
  methods: PaymentMethodResponse[];
}

function blank(currencies: CurrencyResponse[]) {
  return {
    name: '',
    amount: '',
    currencyCode: currencies[0]?.code ?? '',
    startMonth: currentMonth(),
    description: '',
    paymentMethodName: '',
    tagNames: [] as string[],
  };
}

export function NewRecurringDialog({
  open,
  onOpenChange,
  currencies,
  tags,
  methods,
}: NewRecurringDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => blank(currencies));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  function patch(next: Partial<ReturnType<typeof blank>>) {
    setForm((current) => ({ ...current, ...next }));
    setError(null);
  }

  function close() {
    onOpenChange(false);
    setForm(blank(currencies));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError({ detail: 'El nombre es obligatorio.', status: '400 Bad Request' });
      return;
    }

    if (!isPositiveAmount(form.amount)) {
      setError({ detail: 'amount must be a positive amount', status: '400 Bad Request' });
      return;
    }

    const scale = scaleOf(currencies, form.currencyCode);

    if (!validateAgainstScale(form.amount, scale)) {
      setError({
        detail: `amount exceeds the scale of ${form.currencyCode}`,
        status: '400 Bad Request',
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createRecurringExpense({
        name: form.name.trim(),
        amount: Number(form.amount),
        currencyCode: form.currencyCode,
        startMonth: `${form.startMonth}-01`,
        description: form.description || undefined,
        paymentMethodName: form.paymentMethodName || undefined,
        tagNames: form.tagNames,
      });
      // A startMonth of the current month generates this month's occurrence immediately, so the
      // expenses list (and the budget it feeds) need to reflect it too, not just the recurring list.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(currentMonth()) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetCurrent() }),
      ]);
      toast.success('Recurrente creado');
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

  const next = nextMonth(currentMonth());

  return (
    <DialogShell
      open={open}
      onOpenChange={(value) => (value ? onOpenChange(value) : close())}
      title="Nuevo recurrente"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nombre</label>
          <input
            className="input"
            maxLength={255}
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-[1fr_110px] gap-3">
          <div className="field">
            <label>Monto</label>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => patch({ amount: event.target.value })}
            />
          </div>
          <div className="field">
            <label>Moneda</label>
            <select
              className="input"
              value={form.currencyCode}
              onChange={(event) => patch({ currencyCode: event.target.value })}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Empieza en</label>
          <select
            className="input"
            value={form.startMonth}
            onChange={(event) => patch({ startMonth: event.target.value })}
          >
            <option value={currentMonth()}>{formatMonthYear(currentMonth())} (este mes)</option>
            <option value={next}>{formatMonthYear(next)} (próximo mes)</option>
          </select>
        </div>

        <div className="field">
          <label>Descripción</label>
          <input
            className="input"
            maxLength={500}
            value={form.description}
            onChange={(event) => patch({ description: event.target.value })}
          />
        </div>

        <div className="field">
          <label>Método de pago</label>
          <select
            className="input"
            value={form.paymentMethodName}
            onChange={(event) => patch({ paymentMethodName: event.target.value })}
          >
            <option value="">— ninguno —</option>
            {methods.map((method) => (
              <option key={method.id} value={method.name}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <ChipToggle
                key={tag.id}
                label={tag.name}
                size="xs"
                active={form.tagNames.includes(tag.name)}
                onToggle={() =>
                  patch({
                    tagNames: form.tagNames.includes(tag.name)
                      ? form.tagNames.filter((name) => name !== tag.name)
                      : form.tagNames.concat(tag.name),
                  })
                }
              />
            ))}
          </div>
        </div>

        {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Crear
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
