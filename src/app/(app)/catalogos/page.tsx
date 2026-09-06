'use client';

import { useMemo, useState } from 'react';

import { CurrenciesPanel } from '@/components/catalog/currencies-panel';
import { CurrencyDialog } from '@/components/catalog/currency-dialog';
import { PaymentMethodsPanel } from '@/components/catalog/payment-methods-panel';
import { TagsPanel } from '@/components/catalog/tags-panel';
import { EmptyPanel } from '@/components/states/empty-panel';
import { ErrorPanel } from '@/components/states/error-panel';
import { LoadingSkeleton } from '@/components/states/loading-skeleton';
import { useCurrencies } from '@/hooks/use-currencies';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';
import { useTags } from '@/hooks/use-tags';
import { createCurrency } from '@/lib/api/currencies';
import { ApiProblemError } from '@/lib/problem';
import { currentMonth } from '@/lib/month';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';

export default function CatalogosPage() {
  const month = currentMonth();
  const currenciesQuery = useCurrencies();
  const tagsQuery = useTags();
  const paymentMethodsQuery = usePaymentMethods();
  const expensesQuery = useExpenses(month);
  const recurringQuery = useRecurringExpenses();
  const queryClient = useQueryClient();
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);

  const usedCurrencyCodes = useMemo(() => {
    const codes = new Set<string>();

    (expensesQuery.data ?? []).forEach((expense) => {
      codes.add(expense.currencyCode);
      if (expense.settlementCurrencyCode) {
        codes.add(expense.settlementCurrencyCode);
      }
    });
    (recurringQuery.data ?? []).forEach((recurring) => {
      recurring.ruleHistory.forEach((rule) => codes.add(rule.currencyCode));
    });

    return codes;
  }, [expensesQuery.data, recurringQuery.data]);

  const usedPaymentMethodNames = useMemo(() => {
    const names = new Set<string>();

    (expensesQuery.data ?? []).forEach((expense) => {
      if (expense.paymentMethod) {
        names.add(expense.paymentMethod);
      }
    });
    (recurringQuery.data ?? []).forEach((recurring) => {
      recurring.ruleHistory.forEach((rule) => {
        if (rule.paymentMethod) {
          names.add(rule.paymentMethod);
        }
      });
    });

    return names;
  }, [expensesQuery.data, recurringQuery.data]);

  if (currenciesQuery.isLoading || tagsQuery.isLoading || paymentMethodsQuery.isLoading) {
    return <LoadingSkeleton scope="tus catálogos" />;
  }

  const failedQuery = [currenciesQuery, tagsQuery, paymentMethodsQuery].find(
    (query) => query.isError
  );

  if (failedQuery) {
    const error = failedQuery.error;

    return (
      <ErrorPanel
        scope="tus catálogos"
        statusLabel={error instanceof ApiProblemError ? `${error.status}` : 'Error de red'}
        detail={
          error instanceof ApiProblemError
            ? error.message
            : 'Connection refused: no se pudo alcanzar el servidor.'
        }
        onRetry={() => {
          currenciesQuery.refetch();
          tagsQuery.refetch();
          paymentMethodsQuery.refetch();
        }}
      />
    );
  }

  const currencies = currenciesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const methods = paymentMethodsQuery.data ?? [];

  if (currencies.length === 0) {
    return (
      <>
        <EmptyPanel
          title="Catálogos vacíos"
          body="Antes de cargar gastos necesitás al menos una moneda. Los tags y los métodos de pago son opcionales y se pueden crear al vuelo desde el formulario de gasto."
          actionLabel="Nueva moneda"
          onAction={() => setEmptyDialogOpen(true)}
        />
        <CurrencyDialog
          open={emptyDialogOpen}
          onOpenChange={setEmptyDialogOpen}
          onSubmit={async (payload) => {
            await createCurrency(payload);
            await queryClient.invalidateQueries({ queryKey: queryKeys.currencies() });
            toast.success('Moneda creada');
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2>Catálogos</h2>
      </header>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
      >
        <CurrenciesPanel currencies={currencies} usedCodes={usedCurrencyCodes} />
        <TagsPanel tags={tags} />
        <PaymentMethodsPanel methods={methods} usedNames={usedPaymentMethodNames} />
      </div>
    </div>
  );
}
