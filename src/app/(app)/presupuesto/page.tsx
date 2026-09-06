'use client';

import { useState } from 'react';

import { BudgetHistorySection } from '@/components/budget/budget-history';
import { BudgetRing } from '@/components/budget/budget-ring';
import { CreateBudgetForm } from '@/components/budget/create-budget-form';
import { EmptyPanel } from '@/components/states/empty-panel';
import { ErrorPanel } from '@/components/states/error-panel';
import { LoadingSkeleton } from '@/components/states/loading-skeleton';
import { useBudgetHistory, useCurrentBudget } from '@/hooks/use-budget';
import { useCurrencies } from '@/hooks/use-currencies';
import { useExpenses } from '@/hooks/use-expenses';
import { scaleOf } from '@/lib/currency';
import { formatMonthYearFull } from '@/lib/format';
import { currentMonth, nextMonth } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';

export default function PresupuestoPage() {
  const month = currentMonth();
  const budgetQuery = useCurrentBudget();
  const expensesQuery = useExpenses(month);
  const currenciesQuery = useCurrencies();
  const historyQuery = useBudgetHistory(6);
  const [showCreateForCurrent, setShowCreateForCurrent] = useState(false);

  const isLoading = budgetQuery.isLoading || expensesQuery.isLoading || currenciesQuery.isLoading;

  if (isLoading) {
    return <LoadingSkeleton scope="el presupuesto" />;
  }

  const failedQuery = [budgetQuery, expensesQuery, currenciesQuery].find((query) => query.isError);

  if (failedQuery) {
    const error = failedQuery.error;

    return (
      <ErrorPanel
        scope="el presupuesto"
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
        }}
      />
    );
  }

  const budget = budgetQuery.data ?? null;
  const expenses = expensesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];

  if (!budget && !showCreateForCurrent) {
    return (
      <EmptyPanel
        title="Sin presupuesto para este mes"
        body={`Definí cuánto querés gastar en ${formatMonthYearFull(month)} y la app calcula el disponible y cuánto te queda por día. Una vez creado no se edita.`}
        actionLabel="Crear presupuesto"
        onAction={() => setShowCreateForCurrent(true)}
      />
    );
  }

  return (
    <div className="flex max-w-[900px] flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h2>Presupuesto</h2>
      </header>

      {budget ? (
        <>
          <BudgetRing
            budget={budget}
            expenses={expenses}
            month={month}
            scale={scaleOf(currencies, budget.currencyCode)}
          />
          {historyQuery.data ? (
            <BudgetHistorySection entries={historyQuery.data} currencies={currencies} />
          ) : null}
          <CreateBudgetForm month={nextMonth(month)} currencies={currencies} />
        </>
      ) : (
        <CreateBudgetForm month={month} currencies={currencies} />
      )}
    </div>
  );
}
