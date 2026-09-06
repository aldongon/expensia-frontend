import { subScaled, ratio, isNegative } from '@/lib/decimal';
import { formatAmount } from '@/lib/format';
import { daysRemaining } from '@/lib/month';
import { computeAccumulatedChart } from '@/lib/chart';
import type { BudgetSummaryResponse, ExpenseResponse } from '@/types/api';

interface BudgetBandProps {
  budget: BudgetSummaryResponse;
  expenses: ExpenseResponse[];
  month: string;
  scale: number;
}

export function BudgetBand({ budget, expenses, month, scale }: BudgetBandProps) {
  const spent = subScaled(budget.totalBudget, budget.remainingBudget, scale);
  const spentPct = Math.max(0, Math.min(100, ratio(spent, budget.totalBudget, scale) * 100));
  const remainingNegative = isNegative(budget.remainingBudget);
  const chart = computeAccumulatedChart(
    expenses,
    month,
    budget.currencyCode,
    scale,
    budget.totalBudget
  );
  const days = daysRemaining(month);

  return (
    <section
      className="grid overflow-hidden rounded-lg"
      style={{
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        className="flex flex-col gap-4 p-8"
        style={{ background: 'var(--color-band)', color: 'var(--color-band-ink)' }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-[10px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-band-dim)' }}
          >
            Disponible este mes
          </span>
          <span
            className="font-heading text-[44px] leading-[1.05] tabular-nums"
            style={{
              color: remainingNegative ? 'var(--color-warn-on-band)' : 'var(--color-band-ink)',
            }}
          >
            {formatAmount(budget.remainingBudget, budget.currencyCode, scale)}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            className="h-[5px] overflow-hidden rounded-full"
            style={{ background: 'var(--color-band-deep)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ background: 'var(--color-band-dim)', width: `${spentPct}%` }}
            />
          </div>
          <div
            className="flex justify-between gap-4 text-[11px]"
            style={{ color: 'var(--color-band-dim)' }}
          >
            <span>Gastado {formatAmount(spent, budget.currencyCode, scale)}</span>
            <span>de {formatAmount(budget.totalBudget, budget.currencyCode, scale)}</span>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-8 pt-3"
          style={{ boxShadow: 'inset 0 1px 0 var(--color-band-line)' }}
        >
          <div className="flex flex-col gap-px">
            <span className="text-[11px]" style={{ color: 'var(--color-band-dim)' }}>
              Por día
            </span>
            <span className="font-heading text-xl tabular-nums">
              {formatAmount(budget.dailyBudget, budget.currencyCode, scale)}
            </span>
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[11px]" style={{ color: 'var(--color-band-dim)' }}>
              Días restantes
            </span>
            <span className="font-heading text-xl tabular-nums">{days}</span>
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[11px]" style={{ color: 'var(--color-band-dim)' }}>
              Ritmo
            </span>
            <span className="font-heading text-xl">{chart.paceHigh ? 'alto' : 'en línea'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-8" style={{ background: 'var(--color-surface)' }}>
        <div className="flex items-baseline gap-3">
          <h6 style={{ color: 'var(--color-accent-ink)' }}>Acumulado del mes</h6>
          <span className="ml-auto flex items-center gap-4 text-[11px] opacity-55">
            <span className="flex items-center gap-1.5">
              <span className="h-[2px] w-3.5" style={{ background: 'var(--color-accent)' }} />
              real
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-0 w-3.5"
                style={{ borderTop: '2px dashed var(--color-neutral-400)' }}
              />
              ideal
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-0 w-3.5"
                style={{ borderTop: '2px dotted var(--color-accent-400)' }}
              />
              proyección
            </span>
          </span>
        </div>

        <svg
          viewBox="0 0 600 168"
          className="h-auto w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path d={chart.areaPath} style={{ fill: 'var(--color-chart-area)' }} />
          <path
            d={chart.idealPath}
            fill="none"
            strokeWidth={2}
            strokeDasharray="5 5"
            style={{ stroke: 'var(--color-neutral-400)' }}
          />
          <path
            d={chart.projectionPath}
            fill="none"
            strokeWidth={2}
            strokeDasharray="2 4"
            style={{ stroke: 'var(--color-accent-400)' }}
          />
          <path
            d={chart.linePath}
            fill="none"
            strokeWidth={2.5}
            strokeLinejoin="round"
            style={{ stroke: 'var(--color-accent)' }}
          />
          <line
            x1={chart.todayX}
            y1={8}
            x2={chart.todayX}
            y2={chart.baseY}
            strokeWidth={1}
            style={{ stroke: 'var(--color-neutral-400)' }}
          />
          <circle cx={chart.dotX} cy={chart.dotY} r={4} style={{ fill: 'var(--color-accent)' }} />
        </svg>

        <div className="flex justify-between text-[10px] opacity-50">
          {chart.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
