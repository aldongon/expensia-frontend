import { formatAmount, formatMonthYear } from '@/lib/format';
import { scaleOf } from '@/lib/currency';
import type { CurrencyResponse, RecurringExpenseResponse } from '@/types/api';

interface RecurringListProps {
  items: RecurringExpenseResponse[];
  currencies: CurrencyResponse[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function RecurringList({ items, currencies, selectedId, onSelect }: RecurringListProps) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {sorted.map((item) => {
        const cancelled = item.currentRule === null;
        const selected = item.id === selectedId;
        const firstRule = item.ruleHistory[0];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="card cursor-pointer gap-1.5 border-0 text-left hover:bg-[var(--color-hover)]"
            style={{ boxShadow: selected ? '0 0 0 1px var(--color-accent)' : 'var(--shadow-sm)' }}
          >
            <div className="flex items-center gap-2">
              <span className="card-title mr-auto">{item.name}</span>
              {cancelled ? <span className="tag tag-neutral">Cancelado</span> : null}
            </div>
            <span className="text-sm tabular-nums opacity-75">
              {item.currentRule
                ? `${formatAmount(item.currentRule.amount, item.currentRule.currencyCode, scaleOf(currencies, item.currentRule.currencyCode))} / mes`
                : 'sin regla activa'}
            </span>
            <div className="card-meta">
              {[
                ...item.tags,
                `desde ${firstRule ? formatMonthYear(firstRule.startMonth.slice(0, 7)) : '—'}`,
              ].join(' · ')}
            </div>
          </button>
        );
      })}
    </div>
  );
}
