import { formatScaledPlain, ratio, subScaled } from '@/lib/decimal';
import { formatAmount, monthLabelUppercase } from '@/lib/format';
import { computeDailyScaled } from '@/lib/chart';
import { dayOfMonth, todayIso } from '@/lib/month';
import type { BudgetSummaryResponse, ExpenseResponse } from '@/types/api';

interface BudgetRingProps {
  budget: BudgetSummaryResponse;
  expenses: ExpenseResponse[];
  month: string;
  scale: number;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetRing({ budget, expenses, month, scale }: BudgetRingProps) {
  const spent = subScaled(budget.totalBudget, budget.remainingBudget, scale);
  const spentPct = Math.max(0, Math.min(100, ratio(spent, budget.totalBudget, scale) * 100));
  const dash = `${((CIRCUMFERENCE * spentPct) / 100).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`;

  const daily = computeDailyScaled(expenses, month, budget.currencyCode, scale);
  const today = dayOfMonth(todayIso());
  const dayValues = daily.slice(1).map((value) => Number(formatScaledPlain(value, scale)));
  const dayMax = Math.max(...dayValues, 1);

  return (
    <div
      className="grid overflow-hidden rounded-lg"
      style={{
        gridTemplateColumns: 'minmax(0,220px) minmax(0,1fr)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        className="flex flex-col items-center justify-center gap-3 p-8"
        style={{ background: 'var(--color-band)', color: 'var(--color-band-ink)' }}
      >
        <svg viewBox="0 0 140 140" width={150} height={150}>
          <circle
            cx={70}
            cy={70}
            r={RADIUS}
            fill="none"
            strokeWidth={14}
            style={{ stroke: 'var(--color-band-deep)' }}
          />
          <circle
            cx={70}
            cy={70}
            r={RADIUS}
            fill="none"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={dash}
            transform="rotate(-90 70 70)"
            style={{ stroke: 'var(--color-band-dim)' }}
          />
          <text
            x={70}
            y={66}
            textAnchor="middle"
            style={{
              fill: 'var(--color-band-ink)',
              fontFamily: 'var(--font-heading)',
              fontSize: 30,
            }}
          >
            {spentPct.toFixed(0)}%
          </text>
          <text
            x={70}
            y={86}
            textAnchor="middle"
            style={{ fill: 'var(--color-band-dim)', fontSize: 11, letterSpacing: '0.08em' }}
          >
            CONSUMIDO
          </text>
        </svg>
        <span
          className="text-[11px] tracking-[0.1em] uppercase"
          style={{ color: 'var(--color-band-dim)' }}
        >
          {monthLabelUppercase(month)}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-8" style={{ background: 'var(--color-surface)' }}>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
        >
          <div className="flex flex-col gap-px">
            <span className="text-[11px] opacity-55">Total</span>
            <span className="font-heading text-xl tabular-nums">
              {formatAmount(budget.totalBudget, budget.currencyCode, scale)}
            </span>
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[11px] opacity-55">Disponible</span>
            <span
              className="font-heading text-xl tabular-nums"
              style={{
                color: budget.remainingBudget.trim().startsWith('-')
                  ? 'var(--color-warn)'
                  : 'var(--color-text)',
              }}
            >
              {formatAmount(budget.remainingBudget, budget.currencyCode, scale)}
            </span>
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[11px] opacity-55">Por día</span>
            <span className="font-heading text-xl tabular-nums">
              {formatAmount(budget.dailyBudget, budget.currencyCode, scale)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] opacity-55">Gasto por día del mes</span>
          <div className="flex h-[52px] items-end gap-0.5">
            {dayValues.map((value, index) => {
              const day = index + 1;
              const height = value > 0 ? Math.max(4, (value / dayMax) * 100) : 2;
              const color =
                value > 0
                  ? day === today
                    ? 'var(--color-accent)'
                    : 'var(--color-accent-400)'
                  : 'var(--color-neutral-300)';

              return (
                <div
                  key={day}
                  title={`${day} · ${formatAmount(value.toFixed(scale), budget.currencyCode, scale)}`}
                  className="min-w-[2px] flex-1 rounded-t"
                  style={{ height: `${height}%`, background: color }}
                />
              );
            })}
          </div>
        </div>

        <p className="text-xs opacity-55">
          Un presupuesto no se edita ni se borra. Se recalcula solo a partir de los gastos del mes.
        </p>
      </div>
    </div>
  );
}
