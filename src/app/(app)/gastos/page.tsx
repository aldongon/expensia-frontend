'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CalendarBlank, Plus, SlidersHorizontal } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { ByDayView } from '@/components/expenses/by-day-view';
import { ExpenseDialog } from '@/components/expenses/expense-dialog';
import { SelectionView } from '@/components/expenses/selection-view';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { EmptyPanel } from '@/components/states/empty-panel';
import { ErrorPanel } from '@/components/states/error-panel';
import { LoadingSkeleton } from '@/components/states/loading-skeleton';
import { useCurrencies } from '@/hooks/use-currencies';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useTags } from '@/hooks/use-tags';
import { deleteExpense } from '@/lib/api/expenses';
import { formatMonthYearFull } from '@/lib/format';
import { currentMonth } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { ExpenseResponse } from '@/types/api';

type GastosTab = 'dias' | 'analisis';

export default function GastosPage() {
  const router = useRouter();
  const month = currentMonth();
  const queryClient = useQueryClient();
  const expensesQuery = useExpenses(month);
  const currenciesQuery = useCurrencies();
  const tagsQuery = useTags();
  const methodsQuery = usePaymentMethods();

  const [tab, setTab] = useState<GastosTab>('dias');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);

  const isLoading =
    expensesQuery.isLoading ||
    currenciesQuery.isLoading ||
    tagsQuery.isLoading ||
    methodsQuery.isLoading;

  if (isLoading) {
    return <LoadingSkeleton scope="tus gastos" />;
  }

  const failedQuery = [expensesQuery, currenciesQuery, tagsQuery, methodsQuery].find(
    (query) => query.isError
  );

  if (failedQuery) {
    const error = failedQuery.error;

    return (
      <ErrorPanel
        scope="tus gastos"
        statusLabel={error instanceof ApiProblemError ? `${error.status}` : 'Error de red'}
        detail={
          error instanceof ApiProblemError
            ? error.message
            : 'Connection refused: no se pudo alcanzar el servidor.'
        }
        onRetry={() => {
          expensesQuery.refetch();
          currenciesQuery.refetch();
          tagsQuery.refetch();
          methodsQuery.refetch();
        }}
      />
    );
  }

  const expenses = expensesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const methods = methodsQuery.data ?? [];

  async function handleDelete(expense: ExpenseResponse) {
    try {
      await deleteExpense(expense.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(month) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetCurrent() }),
      ]);
      toast.success('Gasto eliminado');
    } catch (error) {
      toast.error(
        error instanceof ApiProblemError ? error.message : 'No se pudo eliminar el gasto.'
      );
    }
  }

  function openNew() {
    setEditingExpense(null);
    setDialogOpen(true);
  }

  function openEdit(expense: ExpenseResponse) {
    setEditingExpense(expense);
    setDialogOpen(true);
  }

  if (expenses.length === 0) {
    return (
      <>
        <EmptyPanel
          title={`Sin gastos en ${formatMonthYearFull(month).split(' ')[0]}`}
          body="Cargá un gasto manual o definí un recurrente para que la app genere la ocurrencia de cada mes automáticamente."
          actionLabel="Nuevo gasto"
          onAction={openNew}
        />
        <ExpenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          expense={editingExpense}
          currencies={currencies}
          tags={tags}
          methods={methods}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <h2 className="mr-auto">Gastos</h2>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          Nuevo gasto
        </button>
      </header>

      <SegmentedControl
        name="gtab"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'dias', label: 'Por día', icon: CalendarBlank },
          { value: 'analisis', label: 'Selección', icon: SlidersHorizontal },
        ]}
      />

      {tab === 'dias' ? (
        <ByDayView
          expenses={expenses}
          currencies={currencies}
          onEdit={openEdit}
          onDelete={handleDelete}
          onGoRecurring={(id) => router.push(`/recurrentes?id=${id}`)}
        />
      ) : (
        <SelectionView expenses={expenses} tags={tags} currencies={currencies} />
      )}

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
        currencies={currencies}
        tags={tags}
        methods={methods}
      />
    </div>
  );
}
