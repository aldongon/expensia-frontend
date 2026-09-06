'use client';

import { useRouter } from 'next/navigation';

import { BudgetBand } from '@/components/summary/budget-band';
import { RecentSection } from '@/components/summary/recent-section';
import { TagBreakdown } from '@/components/summary/tag-breakdown';
import { EmptyPanel } from '@/components/states/empty-panel';
import { ErrorPanel } from '@/components/states/error-panel';
import { LoadingSkeleton } from '@/components/states/loading-skeleton';
import { useCurrentBudget } from '@/hooks/use-budget';
import { useCurrencies } from '@/hooks/use-currencies';
import { useExpenses } from '@/hooks/use-expenses';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';
import { scaleOf } from '@/lib/currency';
import { capitalize, formatMonthYearFull } from '@/lib/format';
import { currentMonth } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';

export default function ResumenPage() {
  const router = useRouter();
  const month = currentMonth();
  const budgetQuery = useCurrentBudget();
  const expensesQuery = useExpenses(month);
  const currenciesQuery = useCurrencies();
  const recurringQuery = useRecurringExpenses();

  const isLoading =
    budgetQuery.isLoading ||
    expensesQuery.isLoading ||
    currenciesQuery.isLoading ||
    recurringQuery.isLoading;

  if (isLoading) {
    return <LoadingSkeleton scope="el resumen del mes" />;
  }

  const failedQuery = [budgetQuery, expensesQuery, currenciesQuery, recurringQuery].find(
    (query) => query.isError
  );

  if (failedQuery) {
    const error = failedQuery.error;

    return (
      <ErrorPanel
        scope="el resumen del mes"
        statusLabel={error instanceof ApiProblemError ? `${error.status}` : 'Error de red'}
        detail={
          error instanceof ApiProblemError
            ? error.message
            : 'Connection refused: no se pudo alcanzar el servidor.'
        }
        onRetry={() => {
          budgetQuery.refetch();
          expensesQuery.refetch();
          currenciesQuery.refetch();
          recurringQuery.refetch();
        }}
      />
    );
  }

  const budget = budgetQuery.data ?? null;
  const expenses = expensesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const recurring = recurringQuery.data ?? [];

  if (!budget && expenses.length === 0) {
    return (
      <EmptyPanel
        title="Todavía no hay nada este mes"
        body="Cuando cargues tu primer gasto o definas un presupuesto, acá vas a ver el disponible, el ritmo de gasto y a dónde se va la plata."
        actionLabel="Cargar un gasto"
        onAction={() => router.push('/gastos')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h2>{capitalize(formatMonthYearFull(month))}</h2>
      </header>

      {budget ? (
        <>
          <BudgetBand
            budget={budget}
            expenses={expenses}
            month={month}
            scale={scaleOf(currencies, budget.currencyCode)}
          />
          <TagBreakdown
            expenses={expenses}
            budgetCurrencyCode={budget.currencyCode}
            budgetScale={scaleOf(currencies, budget.currencyCode)}
          />
        </>
      ) : (
        <section className="card elev-sm max-w-[520px]" style={{ gap: 'var(--space-3)' }}>
          <span className="card-kicker">Sin presupuesto</span>
          <p className="card-body">
            No hay presupuesto configurado para este mes.{' '}
            <code className="text-[11px]">GET /api/budgets/current</code> devolvió 200 sin cuerpo.
          </p>
          <button
            type="button"
            className="btn btn-primary self-start"
            onClick={() => router.push('/presupuesto')}
          >
            Crear presupuesto
          </button>
        </section>
      )}

      <RecentSection expenses={expenses} recurring={recurring} currencies={currencies} />
    </div>
  );
}
