'use client';

import { PencilSimple, Trash } from '@phosphor-icons/react';

import { scaleOf } from '@/lib/currency';
import { formatAmount } from '@/lib/format';
import type { CurrencyResponse, ExpenseResponse } from '@/types/api';

interface DayExpenseRowProps {
  expense: ExpenseResponse;
  currencies: CurrencyResponse[];
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  onGoRecurring: (recurringExpenseId: number) => void;
}

export function DayExpenseRow({
  expense,
  currencies,
  onEdit,
  onDelete,
  onGoRecurring,
}: DayExpenseRowProps) {
  const auto = expense.recurringExpenseId !== null;

  return (
    <div
      className="flex items-center gap-4 rounded-md py-1.5 pr-1.5 pl-3 hover:bg-[var(--color-hover)]"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="mr-auto flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm">{expense.description || '(sin descripción)'}</span>
          {auto ? (
            <span className="tag tag-neutral" title="Ocurrencia generada por un gasto recurrente">
              auto
            </span>
          ) : null}
          {expense.tags.map((tag) => (
            <span key={tag} className="tag tag-accent">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[11px] opacity-55">{expense.paymentMethod ?? '—'}</span>
      </div>

      <div className="flex flex-col items-end gap-px whitespace-nowrap">
        <span className="tabular-nums">
          {formatAmount(
            expense.amount,
            expense.currencyCode,
            scaleOf(currencies, expense.currencyCode)
          )}
        </span>
        {expense.settlementAmount && expense.settlementCurrencyCode ? (
          <span className="text-[11px] tabular-nums opacity-50">
            liq.{' '}
            {formatAmount(
              expense.settlementAmount,
              expense.settlementCurrencyCode,
              scaleOf(currencies, expense.settlementCurrencyCode)
            )}
          </span>
        ) : null}
      </div>

      <div className="flex gap-0.5">
        {auto ? (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => onGoRecurring(expense.recurringExpenseId as number)}
          >
            Ver recurrente
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              title="Editar"
              onClick={() => onEdit(expense)}
            >
              <PencilSimple size={16} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              title="Eliminar"
              onClick={() => onDelete(expense)}
            >
              <Trash size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
