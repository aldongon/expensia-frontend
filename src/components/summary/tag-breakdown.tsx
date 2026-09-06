import { formatAmount } from '@/lib/format';
import type { ExpenseResponse } from '@/types/api';

const BAR_COLORS = [
  'var(--color-accent-700)',
  'var(--color-accent-600)',
  'var(--color-accent-500)',
  'var(--color-accent-400)',
  'var(--color-accent-300)',
];

interface TagBreakdownProps {
  expenses: ExpenseResponse[];
  budgetCurrencyCode: string;
  budgetScale: number;
}

/**
 * A tag's share of the month. A gasto's amount is split evenly across its tags for this purely
 * visual breakdown (never a value sent back to the backend), matching the design's own rule.
 */
export function TagBreakdown({ expenses, budgetCurrencyCode, budgetScale }: TagBreakdownProps) {
  const totals = new Map<string, number>();

  expenses.forEach((expense) => {
    if (expense.currencyCode !== budgetCurrencyCode) {
      return;
    }
    const names = expense.tags.length ? expense.tags : ['sin tag'];
    const share = Number(expense.amount) / names.length;

    names.forEach((name) => totals.set(name, (totals.get(name) ?? 0) + share));
  });

  const max = Math.max(...totals.values(), 1);
  const rows = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h4>Dónde se fue el mes</h4>
      <div
        className="grid gap-x-8 gap-y-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
      >
        {rows.map(([name, amount], index) => (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px]">{name}</span>
              <span className="text-[13px] tabular-nums opacity-65">
                {formatAmount(amount.toFixed(budgetScale), budgetCurrencyCode, budgetScale)}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: 'var(--color-neutral-300)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(amount / max) * 100}%`,
                  background: BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
