'use client';

import { Plus, Trash } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { NameDialog } from '@/components/catalog/name-dialog';
import { createPaymentMethod, deletePaymentMethod } from '@/lib/api/payment-methods';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { PaymentMethodResponse } from '@/types/api';

interface PaymentMethodsPanelProps {
  methods: PaymentMethodResponse[];
  usedNames: Set<string>;
}

export function PaymentMethodsPanel({ methods, usedNames }: PaymentMethodsPanelProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lockedIds, setLockedIds] = useState<Set<number>>(new Set());

  async function handleDelete(method: PaymentMethodResponse) {
    try {
      await deletePaymentMethod(method.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() });
      toast.success('Método de pago eliminado');
    } catch (error) {
      if (error instanceof ApiProblemError && error.status === 409) {
        setLockedIds((current) => new Set(current).add(method.id));
      }

      toast.error(
        error instanceof ApiProblemError ? error.message : 'No se pudo eliminar el método de pago.'
      );
    }
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-lg p-6"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h4>Métodos de pago</h4>

      {methods.map((method) => {
        const locked = usedNames.has(method.name) || lockedIds.has(method.id);

        return (
          <div
            key={method.id}
            className="flex items-center gap-3 py-1.5"
            style={{ boxShadow: 'inset 0 -1px 0 var(--color-neutral-300)' }}
          >
            <span className="mr-auto text-sm">{method.name}</span>
            {locked ? (
              <span className="tag tag-outline" title="Usado por un gasto: el borrado devuelve 409">
                en uso
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                title="Eliminar"
                onClick={() => handleDelete(method)}
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
        Nuevo método
      </button>

      <NameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Nuevo método de pago"
        label="Nombre"
        maxLength={64}
        onSubmit={async (name) => {
          await createPaymentMethod({ name });
          await queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods() });
          toast.success('Método de pago creado');
        }}
      />
    </section>
  );
}
