'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Field, inputClass } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiRequestError } from '@/lib/auth-client';
import type { BudgetSummary, CreateBudgetRequest } from '@/lib/budgets';
import type { Currency } from '@/lib/expenses';
import { formatApiAmount, formatUnits, parseDecimalToUnits } from '@/lib/money';
import { useCreateBudget, useCurrentBudget } from '@/lib/use-budgets';
import { useCurrencies } from '@/lib/use-expenses';
import { cn } from '@/lib/utils';

const DEFAULT_SCALE = 2;

const monthLabelFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function monthValueFrom(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthValue() {
  return monthValueFrom(new Date());
}

function nextMonthValue() {
  const now = new Date();
  return monthValueFrom(new Date(now.getFullYear(), now.getMonth() + 1, 1));
}

function monthLabel(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number);
  return capitalize(monthLabelFormatter.format(new Date(year, month - 1, 1)));
}

export default function BudgetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const budgetQuery = useCurrentBudget();
  const currenciesQuery = useCurrencies();
  const createMutation = useCreateBudget();

  const currencies = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);
  const summary = budgetQuery.data ?? null;

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
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Presupuesto</h2>
        </div>
        {summary === null && !budgetQuery.isPending && (
          <Button onClick={() => setSheetOpen(true)}>
            <Wallet data-icon="inline-start" />
            Crear presupuesto
          </Button>
        )}
      </div>

      {summary === null ? (
        <EmptyState onCreate={() => setSheetOpen(true)} />
      ) : (
        <BudgetSummaryCard summary={summary} scale={scaleFor(summary.currencyCode)} />
      )}

      <NewBudgetSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currencies={currencies}
        onSubmit={async (body) => {
          await createMutation.mutateAsync(body);
        }}
      />
    </section>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-lg">
        <Wallet className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
        Sin presupuesto este mes
      </h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        Todavía no definiste un presupuesto para este mes. Creá uno para visualizar tu progreso y
        cuánto podés gastar por día.
      </p>
      <Button onClick={onCreate}>
        <Wallet data-icon="inline-start" />
        Crear presupuesto
      </Button>
    </div>
  );
}

function BudgetSummaryCard({ summary, scale }: { summary: BudgetSummary; scale: number }) {
  const totalUnits = parseDecimalToUnits(summary.totalBudget, scale);
  const remainingUnits = parseDecimalToUnits(summary.remainingBudget, scale);
  const spentUnits =
    totalUnits !== null && remainingUnits !== null ? totalUnits - remainingUnits : null;

  const overspent = remainingUnits !== null && remainingUnits < BigInt(0);
  const percent =
    totalUnits !== null && totalUnits > BigInt(0) && spentUnits !== null
      ? Math.min(100, Math.max(0, (Number(spentUnits) / Number(totalUnits)) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs font-semibold tracking-[.03em] uppercase">
            Presupuesto de {monthLabel(summary.month)}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-slate-400">{summary.currencyCode}</span>
            <span className="text-3xl font-semibold text-slate-950 tabular-nums dark:text-white">
              {formatApiAmount(summary.totalBudget, scale)}
            </span>
          </div>
        </div>
        <span className="text-muted-foreground bg-muted inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold">
          No editable
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Gastado{' '}
            {spentUnits !== null && (
              <span className="text-slate-700 tabular-nums dark:text-slate-300">
                {formatUnits(spentUnits, scale)}
              </span>
            )}
          </span>
          <span className="text-muted-foreground">
            de{' '}
            <span className="text-slate-700 tabular-nums dark:text-slate-300">
              {formatApiAmount(summary.totalBudget, scale)}
            </span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={cn('h-full rounded-full', overspent ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryFigure
          label="Restante"
          currencyCode={summary.currencyCode}
          value={summary.remainingBudget}
          scale={scale}
        />
        <SummaryFigure
          label="Presupuesto diario"
          currencyCode={summary.currencyCode}
          value={summary.dailyBudget}
          scale={scale}
          tooltip="Monto que podés gastar por día durante el resto del mes."
        />
      </div>
    </div>
  );
}

function SummaryFigure({
  label,
  currencyCode,
  value,
  scale,
  tooltip,
}: {
  label: string;
  currencyCode: string;
  value: string;
  scale: number;
  tooltip?: string;
}) {
  const units = parseDecimalToUnits(value, scale);
  const negative = units !== null && units < BigInt(0);

  return (
    <div className="rounded-lg border border-slate-200 bg-[#fafbfa] p-4 dark:border-slate-800 dark:bg-slate-900/30">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <span>{label}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button type="button" className="text-slate-400 hover:text-slate-600">
                  <Info className="size-3.5" />
                </button>
              }
            />
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[11px] font-bold text-slate-400">{currencyCode}</span>
        <span
          className={cn(
            'text-xl font-semibold tabular-nums',
            negative ? 'text-destructive' : 'text-slate-950 dark:text-white'
          )}
        >
          {formatApiAmount(value, scale)}
        </span>
      </div>
    </div>
  );
}

type NewBudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  onSubmit: (body: CreateBudgetRequest) => Promise<void>;
};

function NewBudgetSheet({ open, onOpenChange, currencies, onSubmit }: NewBudgetSheetProps) {
  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [month, setMonth] = useState('');
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

  const monthOptions = useMemo(
    () => [currentMonthValue(), nextMonthValue()],
    // Re-derive only when the sheet opens; months don't change mid-session in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setAmount('');
    setCurrencyCode(currencies[0]?.code ?? '');
    setMonth(currentMonthValue());
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amountScale = scaleByCode.get(currencyCode) ?? DEFAULT_SCALE;
  const amountUnits = parseDecimalToUnits(amount.replace(',', '.'), amountScale);
  const canSubmit =
    hasCurrencies &&
    amountUnits !== null &&
    amountUnits > BigInt(0) &&
    month.length > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setFormError(null);

    const body: CreateBudgetRequest = {
      amount: amount.replace(',', '.').trim(),
      currencyCode,
      month,
    };

    setSubmitting(true);
    try {
      await onSubmit(body);
      toast.success('Presupuesto creado', { duration: 2600 });
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.data?.detail || error.message
          : 'No se pudo crear el presupuesto.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[440px]">
        <div className="border-b border-slate-200 p-4 pr-12 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Nuevo presupuesto
          </h2>
          <p className="text-muted-foreground text-sm">
            Un presupuesto por mes. No se puede editar ni eliminar luego de crearlo.
          </p>
        </div>

        {!hasCurrencies ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 p-8 dark:border-slate-700">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <Wallet className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                Necesitás una moneda
              </h3>
              <p className="text-muted-foreground max-w-xs text-sm">
                Antes de crear un presupuesto, creá al menos una moneda en tus datos de referencia.
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
            <Field label="Mes">
              <select
                className={inputClass}
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              >
                {monthOptions.map((option) => (
                  <option key={option} value={option}>
                    {monthLabel(option)}
                  </option>
                ))}
              </select>
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
            Guardar presupuesto
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
