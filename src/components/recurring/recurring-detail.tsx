'use client';

import { useState } from 'react';

import { CancelRecurringDialog } from '@/components/recurring/cancel-recurring-dialog';
import { scaleOf } from '@/lib/currency';
import { formatAmount, formatMonthYear } from '@/lib/format';
import type { CurrencyResponse, RecurringExpenseResponse } from '@/types/api';

interface RecurringDetailProps {
  item: RecurringExpenseResponse;
  currencies: CurrencyResponse[];
  onChangePrice: () => void;
}

export function RecurringDetail({ item, currencies, onChangePrice }: RecurringDetailProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelled = item.currentRule === null;
  const timeline = [...item.ruleHistory].reverse();

  return (
    <div
      className="flex min-w-0 flex-col gap-4 rounded-lg p-6"
      style={{ boxShadow: 'var(--shadow-md)', background: 'var(--color-surface)' }}
    >
      <div className="flex flex-col gap-1">
        <h3>{item.name}</h3>
        <span className="text-[13px] opacity-60">{item.description || '—'}</span>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="tag tag-accent">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h6 style={{ color: 'var(--color-accent)' }}>Historial de precios</h6>
        <div className="flex flex-col">
          {timeline.map((rule) => {
            const open = rule.endMonth === null;

            return (
              <div
                key={rule.id}
                className="flex items-start gap-4 py-2"
                style={{ boxShadow: 'inset 0 -1px 0 var(--color-neutral-300)' }}
              >
                <span
                  className="mt-1.5 h-[7px] w-[7px] flex-none rounded-full"
                  style={{ background: open ? 'var(--color-accent)' : 'var(--color-neutral-400)' }}
                />
                <div className="flex min-w-0 flex-col gap-px">
                  <span className="tabular-nums">
                    {formatAmount(
                      rule.amount,
                      rule.currencyCode,
                      scaleOf(currencies, rule.currencyCode)
                    )}
                  </span>
                  <span className="text-xs opacity-55">
                    {open
                      ? `desde ${formatMonthYear(rule.startMonth.slice(0, 7))} · vigente`
                      : `${formatMonthYear(rule.startMonth.slice(0, 7))} → ${formatMonthYear((rule.endMonth as string).slice(0, 7))}`}
                  </span>
                </div>
                <span className="ml-auto text-xs whitespace-nowrap opacity-55">
                  {rule.paymentMethod ?? '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {cancelled ? (
        <p className="text-xs opacity-55">Cancelado: ya no genera ocurrencias.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={onChangePrice}>
            Cambiar precio
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setCancelOpen(true)}>
            Cancelar
          </button>
        </div>
      )}

      <CancelRecurringDialog open={cancelOpen} onOpenChange={setCancelOpen} item={item} />
    </div>
  );
}
