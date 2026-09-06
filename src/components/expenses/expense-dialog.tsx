'use client';

import { Plus } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ChipToggle } from '@/components/ui/chip-toggle';
import { DialogShell } from '@/components/ui/dialog-shell';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { NameDialog } from '@/components/catalog/name-dialog';
import { CurrencyDialog } from '@/components/catalog/currency-dialog';
import { createExpense, updateExpense } from '@/lib/api/expenses';
import { createTag } from '@/lib/api/tags';
import { createPaymentMethod } from '@/lib/api/payment-methods';
import { createCurrency } from '@/lib/api/currencies';
import { isPositiveAmount, validateAgainstScale } from '@/lib/decimal';
import { scaleOf } from '@/lib/currency';
import { currentMonth, todayIso } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type {
  CurrencyResponse,
  ExpenseResponse,
  PaymentMethodResponse,
  TagResponse,
} from '@/types/api';

interface FormState {
  amount: string;
  currencyCode: string;
  expenseDate: string;
  description: string;
  tagNames: string[];
  paymentMethodName: string;
  settle: boolean;
  settlementAmount: string;
  settlementCurrencyCode: string;
}

function blankForm(currencies: CurrencyResponse[]): FormState {
  const first = currencies[0]?.code ?? '';
  const second = currencies.find((c) => c.code !== first)?.code ?? first;

  return {
    amount: '',
    currencyCode: first,
    expenseDate: todayIso(),
    description: '',
    tagNames: [],
    paymentMethodName: '',
    settle: false,
    settlementAmount: '',
    settlementCurrencyCode: second,
  };
}

function formFromExpense(expense: ExpenseResponse, currencies: CurrencyResponse[]): FormState {
  const fallbackSettlement =
    currencies.find((c) => c.code !== expense.currencyCode)?.code ?? expense.currencyCode;

  return {
    amount: expense.amount,
    currencyCode: expense.currencyCode,
    expenseDate: expense.expenseDate,
    description: expense.description,
    tagNames: [...expense.tags],
    paymentMethodName: expense.paymentMethod ?? '',
    settle: expense.settlementAmount !== null,
    settlementAmount: expense.settlementAmount ?? '',
    settlementCurrencyCode: expense.settlementCurrencyCode ?? fallbackSettlement,
  };
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseResponse | null;
  currencies: CurrencyResponse[];
  tags: TagResponse[];
  methods: PaymentMethodResponse[];
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  currencies,
  tags,
  methods,
}: ExpenseDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => blankForm(currencies));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newMethodOpen, setNewMethodOpen] = useState(false);
  const [newCurrencyOpen, setNewCurrencyOpen] = useState(false);

  // currencies is deliberately excluded: it only picks the initial default currency and
  // shouldn't reset the form if the catalog refetches in the background while the dialog is open.
  useEffect(() => {
    if (open) {
      setForm(expense ? formFromExpense(expense, currencies) : blankForm(currencies));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
    setError(null);
  }

  function close() {
    onOpenChange(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    if (form.settle) {
      if (!isPositiveAmount(form.settlementAmount)) {
        setError({
          detail: 'settlementAmount and settlementCurrencyCode must be sent together',
          status: '400 Bad Request',
        });
        return;
      }

      if (form.settlementCurrencyCode === form.currencyCode) {
        setError({
          detail: 'settlementCurrencyCode must be different from currencyCode',
          status: '400 Bad Request',
        });
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      amount: Number(form.amount),
      currencyCode: form.currencyCode,
      expenseDate: form.expenseDate || undefined,
      description: form.description || undefined,
      tagNames: form.tagNames,
      paymentMethodName: form.paymentMethodName || undefined,
      settlementAmount: form.settle ? Number(form.settlementAmount) : undefined,
      settlementCurrencyCode: form.settle ? form.settlementCurrencyCode : undefined,
    };

    try {
      if (expense) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(currentMonth()) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetCurrent() }),
      ]);
      toast.success(expense ? 'Gasto actualizado' : 'Gasto creado');
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

  const settlementCurrencies = currencies.filter((c) => c.code !== form.currencyCode);

  return (
    <>
      <DialogShell
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(next) : close())}
        title={expense ? 'Editar gasto' : 'Nuevo gasto'}
        widthClassName="w-[min(560px,calc(100%-var(--space-8)*2))]"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {expense ? (
            <p className="m-0 text-xs" style={{ color: 'var(--color-accent-ink)' }}>
              PUT reemplaza el gasto completo: los campos que queden vacíos se borran.
            </p>
          ) : null}

          <div className="grid grid-cols-[1fr_110px_130px] gap-3">
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
              <div className="mb-1 flex items-center gap-1.5">
                <label className="mb-0">Moneda</label>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '0 4px' }}
                  onClick={() => setNewCurrencyOpen(true)}
                >
                  <Plus size={12} />
                </button>
              </div>
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
            <div className="field">
              <label>Fecha</label>
              <input
                className="input"
                type="date"
                value={form.expenseDate}
                onChange={(event) => patch({ expenseDate: event.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Descripción</label>
            <input
              className="input"
              type="text"
              maxLength={500}
              value={form.description}
              onChange={(event) => patch({ description: event.target.value })}
            />
          </div>

          <div className="field">
            <div className="mb-1 flex items-center gap-2">
              <label className="mb-0">Tags</label>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '0 4px' }}
                onClick={() => setNewTagOpen(true)}
              >
                <Plus size={12} />
                nuevo
              </button>
            </div>
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

          <div className="field">
            <div className="mb-1 flex items-center gap-2">
              <label className="mb-0">Método de pago</label>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '0 4px' }}
                onClick={() => setNewMethodOpen(true)}
              >
                <Plus size={12} />
                nuevo
              </button>
            </div>
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

          <div
            className="flex flex-col gap-3 pt-3"
            style={{ boxShadow: 'inset 0 1px 0 var(--color-neutral-300)' }}
          >
            <label className="radio self-start">
              <input
                type="checkbox"
                checked={form.settle}
                onChange={(event) => patch({ settle: event.target.checked })}
              />
              <span className="dot" />
              Se liquidó en otra moneda
            </label>

            {form.settle ? (
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div className="field">
                  <label>Monto liquidado</label>
                  <input
                    className="input"
                    type="text"
                    inputMode="decimal"
                    value={form.settlementAmount}
                    onChange={(event) => patch({ settlementAmount: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Moneda</label>
                  <select
                    className="input"
                    value={form.settlementCurrencyCode}
                    onChange={(event) => patch({ settlementCurrencyCode: event.target.value })}
                  >
                    {settlementCurrencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>

          {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Guardar gasto
            </button>
          </div>
        </form>
      </DialogShell>

      <NameDialog
        open={newTagOpen}
        onOpenChange={setNewTagOpen}
        title="Nuevo tag"
        label="Nombre"
        maxLength={64}
        onSubmit={async (name) => {
          const created = await createTag({ name });
          await queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
          patch({ tagNames: form.tagNames.concat(created.name) });
        }}
      />

      <NameDialog
        open={newMethodOpen}
        onOpenChange={setNewMethodOpen}
        title="Nuevo método de pago"
        label="Nombre"
        maxLength={64}
        onSubmit={async (name) => {
          const created = await createPaymentMethod({ name });
          await queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() });
          patch({ paymentMethodName: created.name });
        }}
      />

      <CurrencyDialog
        open={newCurrencyOpen}
        onOpenChange={setNewCurrencyOpen}
        onSubmit={async (currencyPayload) => {
          const created = await createCurrency(currencyPayload);
          await queryClient.invalidateQueries({ queryKey: queryKeys.currencies() });
          patch({ currencyCode: created.code });
        }}
      />
    </>
  );
}
