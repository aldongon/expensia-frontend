'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, ReceiptText, Repeat } from 'lucide-react';
import { toast } from 'sonner';

import { Field, inputClass } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ApiRequestError } from '@/lib/auth-client';
import type { CreateExpenseRequest, Currency, Expense, PaymentMethod, Tag } from '@/lib/expenses';
import { formatApiAmount, formatUnits, parseDecimalToUnits, sumUnits } from '@/lib/money';
import {
  useCreateExpense,
  useCurrencies,
  useExpenses,
  usePaymentMethods,
  useTags,
} from '@/lib/use-expenses';
import { cn } from '@/lib/utils';

const GRID_STYLE: CSSProperties = {
  gridTemplateColumns: '64px minmax(140px,1.4fr) minmax(0,130px) 96px minmax(88px,116px)',
};

const DEFAULT_SCALE = 2;

const monthLabelFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });
const dayLabelFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function formatExpenseDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const label = dayLabelFormatter.format(new Date(year, month - 1, day));

  return label.replace(/\.$/, '');
}

export default function ExpensesPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [showRecurring, setShowRecurring] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const month = toMonthKey(monthDate);
  const monthTitle = capitalize(monthLabelFormatter.format(monthDate));

  const expensesQuery = useExpenses(month);
  const currenciesQuery = useCurrencies();
  const tagsQuery = useTags();
  const paymentMethodsQuery = usePaymentMethods();
  const createMutation = useCreateExpense(month);

  const currencies = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);
  const tags = tagsQuery.data ?? [];
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);

  const scaleByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const currency of currencies) {
      map.set(currency.code, currency.scale);
    }
    return map;
  }, [currencies]);

  const scaleFor = (code: string) => scaleByCode.get(code) ?? DEFAULT_SCALE;

  // Totals are computed over the full (unfiltered) month, one pill per currency.
  const totals = useMemo(() => {
    const byCode = new Map<string, string[]>();
    for (const expense of expenses) {
      const list = byCode.get(expense.currencyCode) ?? [];
      list.push(expense.amount);
      byCode.set(expense.currencyCode, list);
    }

    const ordered = currencies.map((currency) => currency.code).filter((code) => byCode.has(code));
    for (const code of byCode.keys()) {
      if (!ordered.includes(code)) ordered.push(code);
    }

    return ordered.map((code) => {
      const scale = scaleFor(code);
      return { code, formatted: formatUnits(sumUnits(byCode.get(code) ?? [], scale), scale) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, currencies, scaleByCode]);

  const visibleExpenses = showRecurring
    ? expenses
    : expenses.filter((expense) => expense.recurringExpenseId === null);

  const monthCount = expenses.length;
  const countLabel = monthCount === 1 ? '1 gasto' : `${monthCount} gastos`;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">Expensia</p>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Gastos del mes</h2>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus data-icon="inline-start" />
          Nuevo gasto
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => setMonthOffset((offset) => offset - 1)}
          >
            <ChevronLeft />
          </Button>
          <div className="min-w-[150px] text-center">
            <p className="text-[15px] font-semibold text-slate-950 dark:text-white">{monthTitle}</p>
            <p className="text-muted-foreground text-xs">{countLabel}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => setMonthOffset((offset) => offset + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Total</span>
            {totals.length === 0 ? (
              <span className="text-slate-300">—</span>
            ) : (
              totals.map((total) => (
                <span
                  key={total.code}
                  className="inline-flex items-baseline gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-semibold dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-muted-foreground text-[11px] font-bold">{total.code}</span>
                  {total.formatted}
                </span>
              ))
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowRecurring((value) => !value)}
            className={cn(showRecurring && 'bg-primary/10 text-primary border-transparent')}
          >
            <Repeat data-icon="inline-start" />
            {showRecurring ? 'Recurrentes visibles' : 'Recurrentes ocultos'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
        <div
          className="text-muted-foreground grid gap-3 border-b border-slate-200 bg-[#fafbfa] px-5 py-3 text-xs font-semibold tracking-[.03em] uppercase dark:border-slate-800 dark:bg-slate-900/40"
          style={GRID_STYLE}
        >
          <span>Fecha</span>
          <span>Descripción</span>
          <span>Tags</span>
          <span>Método</span>
          <span className="text-right">Monto</span>
        </div>

        {visibleExpenses.length === 0 ? (
          <EmptyState monthTitle={monthTitle} onCreate={() => setSheetOpen(true)} />
        ) : (
          visibleExpenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} scaleFor={scaleFor} />
          ))
        )}
      </div>

      <NewExpenseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        monthOffset={monthOffset}
        monthDate={monthDate}
        currencies={currencies}
        tags={tags}
        paymentMethods={paymentMethods}
        onSubmit={async (body) => {
          await createMutation.mutateAsync(body);
        }}
      />
    </section>
  );
}

function EmptyState({ monthTitle, onCreate }: { monthTitle: string; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-lg">
        <ReceiptText className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
        Sin gastos este mes
      </h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        No hay gastos registrados en {monthTitle}. Registrá el primero para empezar.
      </p>
      <Button onClick={onCreate}>
        <Plus data-icon="inline-start" />
        Nuevo gasto
      </Button>
    </div>
  );
}

function ExpenseRow({
  expense,
  scaleFor,
}: {
  expense: Expense;
  scaleFor: (code: string) => number;
}) {
  const isRecurring = expense.recurringExpenseId !== null;
  const hasSettlement =
    expense.settlementAmount !== null && expense.settlementCurrencyCode !== null;

  return (
    <div
      className="grid items-center gap-3 border-b border-[#f1f5f0] px-5 py-[15px] hover:bg-[#fafcfa] dark:border-slate-800/60 dark:hover:bg-slate-900/30"
      style={GRID_STYLE}
    >
      <span className="text-[13px] text-slate-700 tabular-nums dark:text-slate-300">
        {formatExpenseDate(expense.expenseDate)}
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium text-slate-950 dark:text-white',
              !expense.description && 'text-slate-400 dark:text-slate-500'
            )}
          >
            {expense.description || 'Sin descripción'}
          </span>
          {isRecurring && (
            <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
              <Repeat className="size-3" />
              Recurrente
            </span>
          )}
        </div>
        {hasSettlement && (
          <p className="mt-0.5 text-xs text-slate-400">
            Liquidado {expense.settlementCurrencyCode}{' '}
            {formatApiAmount(
              expense.settlementAmount as string,
              scaleFor(expense.settlementCurrencyCode as string)
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {expense.tags.length === 0 ? (
          <span className="text-slate-300">—</span>
        ) : (
          expense.tags.map((tag) => (
            <span
              key={tag}
              className="bg-accent text-accent-foreground inline-flex rounded-md px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))
        )}
      </div>

      <span className="truncate text-[13px] text-slate-700 dark:text-slate-300">
        {expense.paymentMethod || <span className="text-slate-300">—</span>}
      </span>

      <span className="text-right text-sm font-semibold text-slate-950 tabular-nums dark:text-white">
        <span className="mr-1.5 text-[11px] font-bold text-slate-400">{expense.currencyCode}</span>
        {formatApiAmount(expense.amount, scaleFor(expense.currencyCode))}
      </span>
    </div>
  );
}

type NewExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthOffset: number;
  monthDate: Date;
  currencies: Currency[];
  tags: Tag[];
  paymentMethods: PaymentMethod[];
  onSubmit: (body: CreateExpenseRequest) => Promise<void>;
};

function NewExpenseSheet({
  open,
  onOpenChange,
  monthOffset,
  monthDate,
  currencies,
  tags,
  paymentMethods,
  onSubmit,
}: NewExpenseSheetProps) {
  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [paymentMethodName, setPaymentMethodName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementCurrencyCode, setSettlementCurrencyCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasCurrencies = currencies.length > 0;
  const scaleByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const currency of currencies) {
      map.set(currency.code, currency.scale);
    }
    return map;
  }, [currencies]);

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    const defaultDate =
      monthOffset === 0 ? new Date() : new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    setAmount('');
    setCurrencyCode(currencies[0]?.code ?? '');
    setExpenseDate(toDateInput(defaultDate));
    setDescription('');
    setSelectedTags([]);
    setPaymentMethodName('');
    setShowAdvanced(false);
    setSettlementAmount('');
    setSettlementCurrencyCode(currencies[0]?.code ?? '');
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amountScale = scaleByCode.get(currencyCode) ?? DEFAULT_SCALE;
  const amountUnits = parseDecimalToUnits(amount.replace(',', '.'), amountScale);
  const canSubmit = hasCurrencies && amountUnits !== null && amountUnits > BigInt(0) && !submitting;

  const toggleTag = (name: string) => {
    setSelectedTags((current) =>
      current.includes(name) ? current.filter((tag) => tag !== name) : [...current, name]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setFormError(null);

    const body: CreateExpenseRequest = {
      amount: amount.replace(',', '.').trim(),
      currencyCode,
    };
    if (expenseDate) body.expenseDate = expenseDate;
    if (description.trim()) body.description = description.trim();
    if (selectedTags.length) body.tagNames = [...selectedTags].sort();
    if (paymentMethodName) body.paymentMethodName = paymentMethodName;

    const settlementScale = scaleByCode.get(settlementCurrencyCode) ?? DEFAULT_SCALE;
    const settlementUnits = parseDecimalToUnits(
      settlementAmount.replace(',', '.'),
      settlementScale
    );
    if (settlementUnits !== null && settlementUnits > BigInt(0) && settlementCurrencyCode) {
      body.settlementAmount = settlementAmount.replace(',', '.').trim();
      body.settlementCurrencyCode = settlementCurrencyCode;
    }

    setSubmitting(true);
    try {
      await onSubmit(body);
      toast.success('Gasto registrado', { duration: 2600 });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFormError(error.data?.detail || error.message);
      } else {
        setFormError('No se pudo registrar el gasto.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[440px]">
        <div className="border-b border-slate-200 p-4 pr-12 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Nuevo gasto</h2>
          <p className="text-muted-foreground text-sm">Registrá un gasto único de este mes.</p>
        </div>

        {!hasCurrencies ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 p-8 dark:border-slate-700">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <ReceiptText className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                Necesitás una moneda
              </h3>
              <p className="text-muted-foreground max-w-xs text-sm">
                Antes de registrar un gasto, creá al menos una moneda en tus datos de referencia.
              </p>
              <Button
                variant="outline"
                render={<Link href="/currencies" />}
                onClick={() => onOpenChange(false)}
              >
                Crear mi primera moneda
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 120px' }}>
              <Field label="Monto">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="0,00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </Field>
              <Field label="Moneda">
                <select
                  className={inputClass}
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                >
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.code}>
                      {currency.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Fecha">
              <input
                className={inputClass}
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
              />
            </Field>

            <Field label="Descripción" optional>
              <input
                className={inputClass}
                maxLength={500}
                placeholder="Ej. Almuerzo con el equipo"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>

            {tags.length > 0 && (
              <Field label="Tags" optional>
                <div className="flex flex-wrap gap-[7px]">
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={cn(
                          'rounded-full border px-3 py-[5px] text-[13px] transition-colors',
                          active
                            ? 'border-primary bg-primary/12 text-primary font-semibold'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-transparent dark:text-slate-300'
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}

            <Field label="Método de pago" optional>
              <select
                className={inputClass}
                value={paymentMethodName}
                onChange={(event) => setPaymentMethodName(event.target.value)}
              >
                <option value="">Sin método</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="text-primary flex items-center gap-1 text-[13px] font-medium"
              >
                <ChevronRight
                  className={cn('size-4 transition-transform', showAdvanced && 'rotate-90')}
                />
                Otra moneda de liquidación (FX)
              </button>
              {showAdvanced && (
                <div className="flex flex-col gap-2">
                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 120px' }}>
                    <Field label="Monto liquidado">
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="0,00"
                        value={settlementAmount}
                        onChange={(event) => setSettlementAmount(event.target.value)}
                      />
                    </Field>
                    <Field label="Moneda">
                      <select
                        className={inputClass}
                        value={settlementCurrencyCode}
                        onChange={(event) => setSettlementCurrencyCode(event.target.value)}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.code}>
                            {currency.code}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Lo que realmente se debitó, por ejemplo tras la conversión de moneda.
                  </p>
                </div>
              )}
            </div>

            {formError && (
              <p className="border-destructive/25 bg-destructive/[.08] text-destructive rounded-lg border px-3 py-2.5 text-[13px]">
                {formError}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2.5 border-t border-slate-200 p-4 dark:border-slate-800">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className={cn('flex-1', !canSubmit && 'bg-primary/45 cursor-not-allowed')}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Guardar gasto
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
