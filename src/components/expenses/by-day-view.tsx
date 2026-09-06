'use client';

import { DayExpenseRow } from '@/components/expenses/day-expense-row';
import { scaleOf } from '@/lib/currency';
import { sumScaled } from '@/lib/decimal';
import { formatAmount, monthAbbrev, weekdayName } from '@/lib/format';
import { todayIso } from '@/lib/month';
import type { CurrencyResponse, ExpenseResponse } from '@/types/api';

interface DayGroup {
  date: string;
  items: ExpenseResponse[];
}

function groupByDay(expenses: ExpenseResponse[]): DayGroup[] {
  const order: string[] = [];
  const groups = new Map<string, ExpenseResponse[]>();

  expenses.forEach((expense) => {
    if (!groups.has(expense.expenseDate)) {
      groups.set(expense.expenseDate, []);
      order.push(expense.expenseDate);
    }
    groups.get(expense.expenseDate)?.push(expense);
  });

  return order.map((date) => ({ date, items: groups.get(date) ?? [] }));
}

function dayTotalLabel(items: ExpenseResponse[], currencies: CurrencyResponse[]): string {
  const byCurrency = new Map<string, string[]>();

  items.forEach((expense) => {
    const list = byCurrency.get(expense.currencyCode) ?? [];
    list.push(expense.amount);
    byCurrency.set(expense.currencyCode, list);
  });

  return Array.from(byCurrency.keys())
    .sort()
    .map((code) => {
      const scale = scaleOf(currencies, code);

      return formatAmount(sumScaled(byCurrency.get(code) ?? [], scale), code, scale);
    })
    .join('  ·  ');
}

interface ByDayViewProps {
  expenses: ExpenseResponse[];
  currencies: CurrencyResponse[];
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  onGoRecurring: (recurringExpenseId: number) => void;
}

export function ByDayView({
  expenses,
  currencies,
  onEdit,
  onDelete,
  onGoRecurring,
}: ByDayViewProps) {
  const groups = groupByDay(expenses);
  const today = todayIso();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const isToday = group.date === today;
          const weekday = weekdayName(group.date);

          return (
            <section key={group.date} className="flex flex-col gap-2">
              <header
                className="flex items-baseline gap-4 pb-2"
                style={{ boxShadow: 'inset 0 -1px 0 var(--color-neutral-300)' }}
              >
                <span
                  className="font-heading text-[25px] leading-none tabular-nums"
                  style={{
                    color: isToday
                      ? 'var(--color-accent)'
                      : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
                  }}
                >
                  {group.date.slice(8, 10)}
                </span>
                <div className="mr-auto flex flex-col gap-0">
                  <span className="text-xs">{isToday ? `hoy · ${weekday}` : weekday}</span>
                  <span className="text-[11px] opacity-50">
                    {monthAbbrev(group.date)} ·{' '}
                    {group.items.length === 1 ? '1 gasto' : `${group.items.length} gastos`}
                  </span>
                </div>
                <span className="font-heading text-base tabular-nums">
                  {dayTotalLabel(group.items, currencies)}
                </span>
              </header>

              <div className="flex flex-col gap-1.5">
                {group.items.map((expense) => (
                  <DayExpenseRow
                    key={expense.id}
                    expense={expense}
                    currencies={currencies}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onGoRecurring={onGoRecurring}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="max-w-[60ch] text-xs opacity-50">
        Las ocurrencias generadas por un recurrente no se editan acá: se cambia el precio o se
        cancela el recurrente que las produce.
      </p>
    </div>
  );
}
