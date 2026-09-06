'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { NewRecurringDialog } from '@/components/recurring/new-recurring-dialog';
import { PriceChangeDialog } from '@/components/recurring/price-change-dialog';
import { RecurringDetail } from '@/components/recurring/recurring-detail';
import { RecurringList } from '@/components/recurring/recurring-list';
import { EmptyPanel } from '@/components/states/empty-panel';
import { ErrorPanel } from '@/components/states/error-panel';
import { LoadingSkeleton } from '@/components/states/loading-skeleton';
import { useCurrencies } from '@/hooks/use-currencies';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';
import { useTags } from '@/hooks/use-tags';
import { ApiProblemError } from '@/lib/problem';

export function RecurrentesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recurringQuery = useRecurringExpenses();
  const currenciesQuery = useCurrencies();
  const tagsQuery = useTags();
  const methodsQuery = usePaymentMethods();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  const isLoading =
    recurringQuery.isLoading ||
    currenciesQuery.isLoading ||
    tagsQuery.isLoading ||
    methodsQuery.isLoading;

  if (isLoading) {
    return <LoadingSkeleton scope="tus gastos recurrentes" />;
  }

  const failedQuery = [recurringQuery, currenciesQuery, tagsQuery, methodsQuery].find(
    (query) => query.isError
  );

  if (failedQuery) {
    const error = failedQuery.error;

    return (
      <ErrorPanel
        scope="tus gastos recurrentes"
        statusLabel={error instanceof ApiProblemError ? `${error.status}` : 'Error de red'}
        detail={
          error instanceof ApiProblemError
            ? error.message
            : 'Connection refused: no se pudo alcanzar el servidor.'
        }
        onRetry={() => {
          recurringQuery.refetch();
          currenciesQuery.refetch();
          tagsQuery.refetch();
          methodsQuery.refetch();
        }}
      />
    );
  }

  const items = recurringQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const methods = methodsQuery.data ?? [];

  if (items.length === 0) {
    return (
      <>
        <EmptyPanel
          title="Sin gastos recurrentes"
          body="Los recurrentes son cosas como el alquiler o una suscripción: se definen una vez y generan su gasto cada mes, con historial de cambios de precio."
          actionLabel="Nuevo recurrente"
          onAction={() => setNewDialogOpen(true)}
        />
        <NewRecurringDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          currencies={currencies}
          tags={tags}
          methods={methods}
        />
      </>
    );
  }

  const requestedId = searchParams.get('id');
  const selectedId = requestedId ? Number(requestedId) : (items[0]?.id ?? null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <h2 className="mr-auto">Gastos recurrentes</h2>
        <button type="button" className="btn btn-primary" onClick={() => setNewDialogOpen(true)}>
          Nuevo recurrente
        </button>
      </header>

      <div
        className="grid items-start gap-8"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)' }}
      >
        <RecurringList
          items={items}
          currencies={currencies}
          selectedId={selected?.id ?? null}
          onSelect={(id) => router.push(`/recurrentes?id=${id}`)}
        />
        {selected ? (
          <RecurringDetail
            item={selected}
            currencies={currencies}
            onChangePrice={() => setPriceDialogOpen(true)}
          />
        ) : null}
      </div>

      <NewRecurringDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        currencies={currencies}
        tags={tags}
        methods={methods}
      />
      <PriceChangeDialog
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
        item={selected}
        currencies={currencies}
      />
    </div>
  );
}
