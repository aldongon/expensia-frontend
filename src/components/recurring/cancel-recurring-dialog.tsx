'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DialogShell } from '@/components/ui/dialog-shell';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cancelRecurringExpense } from '@/lib/api/recurring-expenses';
import { currentMonth } from '@/lib/month';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import type { RecurringExpenseResponse } from '@/types/api';

interface CancelRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RecurringExpenseResponse;
}

export function CancelRecurringDialog({ open, onOpenChange, item }: CancelRecurringDialogProps) {
  const queryClient = useQueryClient();
  const [effective, setEffective] = useState<'next' | 'current'>('next');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  useEffect(() => {
    if (open) {
      setEffective('next');
      setError(null);
    }
  }, [open]);

  function close() {
    onOpenChange(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await cancelRecurringExpense(item.id, { applyToCurrentMonth: effective === 'current' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(currentMonth()) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetCurrent() }),
      ]);
      toast.success('Recurrente cancelado');
      close();
    } catch (submitError) {
      if (submitError instanceof ApiProblemError) {
        setError({ detail: submitError.message, status: `${submitError.status}` });
      } else {
        setError({ detail: 'No pudimos conectarnos con el servidor.', status: 'Error de red' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(next) : close())}
      title="Cancelar recurrente"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="field">
          <label>Deja de generar desde</label>
          <SegmentedControl
            name="cancel-effective"
            value={effective}
            onChange={setEffective}
            options={[
              { value: 'next', label: 'Próximo mes' },
              { value: 'current', label: 'Este mes' },
            ]}
          />
        </div>
        <p className="dialog-body m-0">
          {effective === 'next'
            ? 'El gasto de este mes se conserva.'
            : 'Se elimina el gasto ya generado de este mes.'}
        </p>

        {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Volver
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Cancelar recurrente
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
