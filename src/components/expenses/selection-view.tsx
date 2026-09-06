'use client';

import { ChipToggle } from '@/components/ui/chip-toggle';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { scaleOf } from '@/lib/currency';
import { sumScaled } from '@/lib/decimal';
import { formatAmount, formatDayMonth } from '@/lib/format';
import { dayOfMonth, todayIso } from '@/lib/month';
import { useExpenseFiltersStore } from '@/stores/expense-filters-store';
import type { CurrencyResponse, ExpenseResponse, TagResponse } from '@/types/api';

const REC_MODE_OPTIONS = [
  { value: 'incluir' as const, label: 'Incluir' },
  { value: 'excluir' as const, label: 'Excluir' },
  { value: 'solo' as const, label: 'Sólo recurrentes' },
];

const REC_MODE_LABELS = {
  incluir: 'con recurrentes',
  excluir: 'sin recurrentes',
  solo: 'sólo recurrentes',
};

interface SelectionViewProps {
  expenses: ExpenseResponse[];
  tags: TagResponse[];
  currencies: CurrencyResponse[];
}

export function SelectionView({ expenses, tags, currencies }: SelectionViewProps) {
  const selectedTags = useExpenseFiltersStore((state) => state.selectedTags);
  const recMode = useExpenseFiltersStore((state) => state.recMode);
  const toggleTag = useExpenseFiltersStore((state) => state.toggleTag);
  const setSelectedTags = useExpenseFiltersStore((state) => state.setSelectedTags);
  const setRecMode = useExpenseFiltersStore((state) => state.setRecMode);

  const chipNames = tags.map((tag) => tag.name).concat('sin tag');
  const selected = selectedTags ?? chipNames;

  const filtered = expenses.filter((expense) => {
    const auto = expense.recurringExpenseId !== null;

    if (recMode === 'excluir' && auto) {
      return false;
    }
    if (recMode === 'solo' && !auto) {
      return false;
    }

    const names = expense.tags.length ? expense.tags : ['sin tag'];

    return names.some((name) => selected.includes(name));
  });

  const byCurrency = new Map<string, string[]>();

  filtered.forEach((expense) => {
    const list = byCurrency.get(expense.currencyCode) ?? [];
    list.push(expense.amount);
    byCurrency.set(expense.currencyCode, list);
  });

  const elapsedDays = dayOfMonth(todayIso());
  const currencyCodes = Array.from(byCurrency.keys()).sort();

  const scopeLabel =
    (selected.length === chipNames.length
      ? 'todos los tags'
      : `${selected.length} de ${chipNames.length} tags`) +
    ' · ' +
    REC_MODE_LABELS[recMode];

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col gap-4 rounded-lg p-6"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <h6 className="mr-auto" style={{ color: 'var(--color-accent-700)' }}>
            Tags incluidos
          </h6>
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => setSelectedTags(null)}
          >
            Todos
          </button>
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => setSelectedTags([])}
          >
            Limpiar
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {chipNames.map((name) => (
            <ChipToggle
              key={name}
              label={name}
              active={selected.includes(name)}
              onToggle={() => toggleTag(name, chipNames)}
            />
          ))}
        </div>

        <div
          className="flex flex-wrap items-center gap-4 pt-3"
          style={{ boxShadow: 'inset 0 1px 0 var(--color-neutral-300)' }}
        >
          <span className="text-xs opacity-65">Gastos recurrentes</span>
          <SegmentedControl
            name="recmode"
            value={recMode}
            options={REC_MODE_OPTIONS}
            onChange={setRecMode}
          />
        </div>
      </div>

      <div
        className="grid overflow-hidden rounded-lg"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          className="flex flex-col gap-1 p-6"
          style={{ background: 'var(--color-band)', color: 'var(--color-band-ink)' }}
        >
          <span
            className="text-[10px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-band-dim)' }}
          >
            Gastos incluidos
          </span>
          <span className="font-heading text-4xl leading-tight tabular-nums">
            {filtered.length}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-band-dim)' }}>
            {scopeLabel}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-6" style={{ background: 'var(--color-surface)' }}>
          <span
            className="text-[10px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-accent-ink)' }}
          >
            Suma por moneda
          </span>
          {currencyCodes.length ? (
            currencyCodes.map((code) => {
              const scale = scaleOf(currencies, code);

              return (
                <span key={code} className="font-heading text-xl tabular-nums">
                  {formatAmount(sumScaled(byCurrency.get(code) ?? [], scale), code, scale)}
                </span>
              );
            })
          ) : (
            <span className="font-heading text-xl tabular-nums">—</span>
          )}
        </div>

        <div
          className="flex flex-col gap-2 p-6"
          style={{
            background: 'var(--color-surface)',
            boxShadow: 'inset 1px 0 0 var(--color-neutral-300)',
          }}
        >
          <span
            className="text-[10px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-accent-ink)' }}
          >
            Promedio diario
          </span>
          {currencyCodes.length ? (
            currencyCodes.map((code) => {
              const scale = scaleOf(currencies, code);
              const total = sumScaled(byCurrency.get(code) ?? [], scale);
              const average = (Number(total) / elapsedDays).toFixed(scale);

              return (
                <span key={code} className="font-heading text-xl tabular-nums">
                  {formatAmount(average, code, scale)}
                </span>
              );
            })
          ) : (
            <span className="font-heading text-xl tabular-nums">—</span>
          )}
          <span className="text-[11px] opacity-50">sobre {elapsedDays} días transcurridos</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {filtered.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-4 rounded-md px-4 py-2"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
          >
            <span className="min-w-[52px] text-xs whitespace-nowrap opacity-55">
              {formatDayMonth(expense.expenseDate)}
            </span>
            <div className="mr-auto flex flex-wrap items-center gap-1.5">
              <span className="text-sm">{expense.description || '(sin descripción)'}</span>
              {expense.recurringExpenseId !== null ? (
                <span className="tag tag-neutral">auto</span>
              ) : null}
              {expense.tags.map((tag) => (
                <span key={tag} className="tag tag-accent">
                  {tag}
                </span>
              ))}
            </div>
            <span className="whitespace-nowrap tabular-nums">
              {formatAmount(
                expense.amount,
                expense.currencyCode,
                scaleOf(currencies, expense.currencyCode)
              )}
            </span>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="text-[13px] opacity-55">Ningún gasto entra en la selección actual.</p>
        ) : null}
      </div>
    </div>
  );
}
