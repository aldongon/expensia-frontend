'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Plus, Repeat } from 'lucide-react';
import { toast } from 'sonner';

import { Field, inputClass } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ApiRequestError } from '@/lib/auth-client';
import type { Currency, PaymentMethod, Tag } from '@/lib/expenses';
import { formatApiAmount, parseDecimalToUnits } from '@/lib/money';
import type { CreateRecurringExpenseRequest, RecurringExpense } from '@/lib/recurring-expenses';
import { useCurrencies, usePaymentMethods, useTags } from '@/lib/use-expenses';
import { useCreateRecurringExpense, useRecurringExpenses } from '@/lib/use-recurring-expenses';
import { cn } from '@/lib/utils';

const GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'minmax(160px,1.6fr) minmax(0,140px) 120px minmax(88px,116px)',
};

const DEFAULT_SCALE = 2;

const monthLabelFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatStartMonth(isoDate: string) {
  const [year, month] = isoDate.split('-').map(Number);
  return capitalize(monthLabelFormatter.format(new Date(year, month - 1, 1)));
}

export default function RecurringExpensesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const recurringQuery = useRecurringExpenses();
  const currenciesQuery = useCurrencies();
  const tagsQuery = useTags();
  const paymentMethodsQuery = usePaymentMethods();
  const createMutation = useCreateRecurringExpense();

  const currencies = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);
  const tags = tagsQuery.data ?? [];
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const recurringExpenses = recurringQuery.data ?? [];

  const scaleFor = useMemo(() => {
    const map = new Map<string, number>();
    for (const currency of currencies) {
      map.set(currency.code, currency.scale);
    }
    return (code: string) => map.get(code) ?? DEFAULT_SCALE;
  }, [currencies]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">Expensia</p>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
            Gastos recurrentes
          </h2>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus data-icon="inline-start" />
          Nuevo recurrente
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
        <div
          className="text-muted-foreground grid gap-3 border-b border-slate-200 bg-[#fafbfa] px-5 py-3 text-xs font-semibold tracking-[.03em] uppercase dark:border-slate-800 dark:bg-slate-900/40"
          style={GRID_STYLE}
        >
          <span>Nombre</span>
          <span>Tags</span>
          <span>Método</span>
          <span className="text-right">Monto</span>
        </div>

        {recurringExpenses.length === 0 ? (
          <EmptyState onCreate={() => setSheetOpen(true)} />
        ) : (
          recurringExpenses.map((recurring) => (
            <RecurringRow key={recurring.id} recurring={recurring} scaleFor={scaleFor} />
          ))
        )}
      </div>

      <NewRecurringSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-lg">
        <Repeat className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
        Sin gastos recurrentes
      </h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        Todavía no tenés gastos recurrentes. Creá el primero para que se registre automáticamente
        cada mes.
      </p>
      <Button onClick={onCreate}>
        <Plus data-icon="inline-start" />
        Nuevo recurrente
      </Button>
    </div>
  );
}

function RecurringRow({
  recurring,
  scaleFor,
}: {
  recurring: RecurringExpense;
  scaleFor: (code: string) => number;
}) {
  const rule = recurring.currentRule;
  const cancelled = rule === null;

  return (
    <div
      className="grid items-center gap-3 border-b border-[#f1f5f0] px-5 py-[15px] last:border-b-0 hover:bg-[#fafcfa] dark:border-slate-800/60 dark:hover:bg-slate-900/30"
      style={GRID_STYLE}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-950 dark:text-white">
            {recurring.name}
          </span>
          {cancelled && (
            <span className="text-muted-foreground bg-muted inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold">
              Cancelado
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {recurring.description
            ? recurring.description
            : rule
              ? `Desde ${formatStartMonth(rule.startMonth)}`
              : 'Sin regla activa'}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {recurring.tags.length === 0 ? (
          <span className="text-slate-300">—</span>
        ) : (
          recurring.tags.map((tag) => (
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
        {rule?.paymentMethod || <span className="text-slate-300">—</span>}
      </span>

      <span className="text-right text-sm font-semibold text-slate-950 tabular-nums dark:text-white">
        {rule ? (
          <>
            <span className="mr-1.5 text-[11px] font-bold text-slate-400">{rule.currencyCode}</span>
            {formatApiAmount(rule.amount, scaleFor(rule.currencyCode))}
          </>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </span>
    </div>
  );
}

type NewRecurringSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  tags: Tag[];
  paymentMethods: PaymentMethod[];
  onSubmit: (body: CreateRecurringExpenseRequest) => Promise<void>;
};

function NewRecurringSheet({
  open,
  onOpenChange,
  currencies,
  tags,
  paymentMethods,
  onSubmit,
}: NewRecurringSheetProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [paymentMethodName, setPaymentMethodName] = useState('');
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
    setName('');
    setAmount('');
    setCurrencyCode(currencies[0]?.code ?? '');
    setStartMonth(currentMonthValue());
    setDescription('');
    setSelectedTags([]);
    setPaymentMethodName('');
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amountScale = scaleByCode.get(currencyCode) ?? DEFAULT_SCALE;
  const amountUnits = parseDecimalToUnits(amount.replace(',', '.'), amountScale);
  const canSubmit =
    hasCurrencies &&
    name.trim().length > 0 &&
    amountUnits !== null &&
    amountUnits > BigInt(0) &&
    startMonth.length > 0 &&
    !submitting;

  const toggleTag = (tagName: string) => {
    setSelectedTags((current) =>
      current.includes(tagName) ? current.filter((tag) => tag !== tagName) : [...current, tagName]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setFormError(null);

    const body: CreateRecurringExpenseRequest = {
      name: name.trim(),
      amount: amount.replace(',', '.').trim(),
      currencyCode,
      startMonth: `${startMonth}-01`,
    };
    if (description.trim()) body.description = description.trim();
    if (selectedTags.length) body.tagNames = [...selectedTags].sort();
    if (paymentMethodName) body.paymentMethodName = paymentMethodName;

    setSubmitting(true);
    try {
      await onSubmit(body);
      toast.success('Recurrente creado', { duration: 2600 });
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.data?.detail || error.message
          : 'No se pudo crear el gasto recurrente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[440px]">
        <div className="border-b border-slate-200 p-4 pr-12 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Nuevo recurrente</h2>
          <p className="text-muted-foreground text-sm">
            Se registrará automáticamente cada mes desde el mes de inicio.
          </p>
        </div>

        {!hasCurrencies ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 p-8 dark:border-slate-700">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <Repeat className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                Necesitás una moneda
              </h3>
              <p className="text-muted-foreground max-w-xs text-sm">
                Antes de crear un gasto recurrente, creá al menos una moneda en tus datos de
                referencia.
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
            <Field label="Nombre">
              <input
                className={inputClass}
                maxLength={255}
                placeholder="Ej. Netflix"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>

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

            <Field label="Mes de inicio">
              <input
                className={inputClass}
                type="month"
                min={currentMonthValue()}
                value={startMonth}
                onChange={(event) => setStartMonth(event.target.value)}
              />
            </Field>

            <Field label="Descripción" optional>
              <input
                className={inputClass}
                maxLength={500}
                placeholder="Ej. Suscripción de streaming"
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
            Guardar recurrente
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
