import { ratio } from '@/lib/decimal';
import { formatAmount, formatMonthYear } from '@/lib/format';
import { currentMonth } from '@/lib/month';
import { scaleOf } from '@/lib/currency';
import type { BudgetHistoryEntry, CurrencyResponse } from '@/types/api';

interface BudgetHistoryProps {
  entries: BudgetHistoryEntry[];
  currencies: CurrencyResponse[];
}

export function BudgetHistorySection({ entries, currencies }: BudgetHistoryProps) {
  const rows = entries.filter((entry) => entry.month !== currentMonth());

  if (rows.length === 0) {
    return null;
  }

  const byCurrency = new Map<string, BudgetHistoryEntry[]>();
  rows.forEach((entry) => {
    const list = byCurrency.get(entry.currencyCode) ?? [];
    list.push(entry);
    byCurrency.set(entry.currencyCode, list);
  });

  const currencyGroups = Array.from(byCurrency.entries());

  return (
    <section className="flex flex-col gap-3">
      <h4>Meses anteriores</h4>

      {currencyGroups.map(([code, groupEntries]) => {
        const scale = scaleOf(currencies, code);
        const max = Math.max(
          ...groupEntries.map((entry) =>
            Math.max(Number(entry.spentAmount), Number(entry.budgetAmount))
          ),
          1
        );

        return (
          <div key={code} className="flex flex-col gap-3">
            {currencyGroups.length > 1 ? <span className="text-xs opacity-55">{code}</span> : null}
            {groupEntries.map((entry) => {
              const spentPct = Math.min(
                100,
                ratio(entry.spentAmount, max.toFixed(scale), scale) * 100
              );
              const budgetPct = Math.min(
                100,
                ratio(entry.budgetAmount, max.toFixed(scale), scale) * 100
              );

              return (
                <div
                  key={entry.month}
                  className="grid items-center gap-4"
                  style={{ gridTemplateColumns: '88px minmax(0,1fr) 150px' }}
                >
                  <span className="text-[13px] opacity-65">{formatMonthYear(entry.month)}</span>
                  <div
                    className="relative h-5 rounded-md"
                    style={{
                      background: 'var(--color-neutral-200)',
                      boxShadow: 'inset 0 0 0 1px var(--color-neutral-300)',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-md"
                      style={{
                        width: `${spentPct}%`,
                        background: entry.overBudget
                          ? 'var(--color-warn)'
                          : 'var(--color-accent-600)',
                      }}
                    />
                    <div
                      className="absolute -top-[3px] -bottom-[3px] w-0.5"
                      style={{ left: `${budgetPct}%`, background: 'var(--color-neutral-700)' }}
                    />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[13px] tabular-nums">
                      {formatAmount(entry.spentAmount, code, scale)}
                    </span>
                    <span className="text-[11px] opacity-50">
                      de {formatAmount(entry.budgetAmount, code, scale)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <span className="text-[11px] opacity-50">
        La línea vertical marca el presupuesto del mes; la barra, lo gastado.
      </span>
    </section>
  );
}
