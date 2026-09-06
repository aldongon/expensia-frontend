'use client';

import { Plus, Trash } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { CurrencyDialog } from '@/components/catalog/currency-dialog';
import { createCurrency, deleteCurrency } from '@/lib/api/currencies';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { CurrencyResponse } from '@/types/api';

interface CurrenciesPanelProps {
  currencies: CurrencyResponse[];
  usedCodes: Set<string>;
}

export function CurrenciesPanel({ currencies, usedCodes }: CurrenciesPanelProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lockedIds, setLockedIds] = useState<Set<number>>(new Set());

  async function handleDelete(currency: CurrencyResponse) {
    try {
      await deleteCurrency(currency.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.currencies() });
      toast.success('Moneda eliminada');
    } catch (error) {
      if (error instanceof ApiProblemError && error.status === 409) {
        setLockedIds((current) => new Set(current).add(currency.id));
      }

      toast.error(
        error instanceof ApiProblemError ? error.message : 'No se pudo eliminar la moneda.'
      );
    }
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-lg p-6"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h4>Monedas</h4>

      {currencies.map((currency) => {
        const locked = usedCodes.has(currency.code) || lockedIds.has(currency.id);

        return (
          <div
            key={currency.id}
            className="flex items-center gap-3 py-1.5"
            style={{ boxShadow: 'inset 0 -1px 0 var(--color-neutral-300)' }}
          >
            <div className="mr-auto flex min-w-0 flex-col">
              <span className="text-sm">
                {currency.code} · escala {currency.scale}
              </span>
              <span className="text-[11px] opacity-50">{currency.name}</span>
            </div>
            {locked ? (
              <span
                className="tag tag-outline"
                title="Referenciada por un gasto: no se puede borrar ni cambiar la escala"
              >
                en uso
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                title="Eliminar"
                onClick={() => handleDelete(currency)}
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="btn btn-ghost self-start"
        onClick={() => setDialogOpen(true)}
      >
        <Plus size={16} />
        Nueva moneda
      </button>

      <CurrencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (payload) => {
          await createCurrency(payload);
          await queryClient.invalidateQueries({ queryKey: queryKeys.currencies() });
          toast.success('Moneda creada');
        }}
      />
    </section>
  );
}
