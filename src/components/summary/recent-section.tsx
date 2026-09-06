'use client';

import { useRouter } from 'next/navigation';

import { scaleOf } from '@/lib/currency';
import { sumScaled } from '@/lib/decimal';
import { formatAmount, formatDayMonth } from '@/lib/format';
import type { CurrencyResponse, ExpenseResponse, RecurringExpenseResponse } from '@/types/api';

interface RecentSectionProps {
  expenses: ExpenseResponse[];
  recurring: RecurringExpenseResponse[];
  currencies: CurrencyResponse[];
}

export function RecentSection({ expenses, recurring, currencies }: RecentSectionProps) {
  const router = useRouter();
  const recent = expenses.slice(0, 5);

  const byCurrency = new Map<string, string[]>();
  expenses.forEach((expense) => {
    const list = byCurrency.get(expense.currencyCode) ?? [];
    list.push(expense.amount);
    byCurrency.set(expense.currencyCode, list);
  });

  const activeRecurring = recurring.filter((item) => item.currentRule !== null);

  return (
    <section
      className="grid items-start gap-8"
      style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-baseline gap-4">
          <h4>Últimos gastos</h4>
          <button
            type="button"
            className="btn btn-ghost text-[13px]"
            onClick={() => router.push('/gastos')}
          >
            Ver el mes completo
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((expense) => (
              <tr key={expense.id}>
                <td className="whitespace-nowrap opacity-60">
                  {formatDayMonth(expense.expenseDate)}
                </td>
                <td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>{expense.description || '(sin descripción)'}</span>
                    {expense.recurringExpenseId !== null ? (
                      <span className="tag tag-neutral">auto</span>
                    ) : null}
                  </div>
                </td>
                <td className="text-right whitespace-nowrap tabular-nums">
                  {formatAmount(
                    expense.amount,
                    expense.currencyCode,
                    scaleOf(currencies, expense.currencyCode)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <h4>Totales por moneda</h4>
        <div className="flex flex-col gap-2">
          {Array.from(byCurrency.keys())
            .sort()
            .map((code) => {
              const scale = scaleOf(currencies, code);

              return (
                <div
                  key={code}
                  className="flex items-baseline justify-between gap-4 pb-1.5"
                  style={{ boxShadow: 'inset 0 -1px 0 var(--color-neutral-300)' }}
                >
                  <span className="text-[13px] opacity-60">{code}</span>
                  <span className="tabular-nums">
                    {formatAmount(sumScaled(byCurrency.get(code) ?? [], scale), code, scale)}
                  </span>
                </div>
              );
            })}
        </div>

        <h4 className="mt-3">Recurrentes activos</h4>
        <div className="flex flex-col gap-1.5">
          {activeRecurring.map((item) => (
            <div key={item.id} className="flex items-baseline justify-between gap-4 text-[13px]">
              <span>{item.name}</span>
              <span className="tabular-nums opacity-70">
                {item.currentRule
                  ? `${formatAmount(item.currentRule.amount, item.currentRule.currencyCode, scaleOf(currencies, item.currentRule.currencyCode))} / mes`
                  : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
