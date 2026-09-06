'use client';

import { useState } from 'react';

import { DialogShell } from '@/components/ui/dialog-shell';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { ApiProblemError } from '@/lib/problem';
import type { CurrencyRequest } from '@/types/api';

interface CurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CurrencyRequest) => Promise<void>;
}

export function CurrencyDialog({ open, onOpenChange, onSubmit }: CurrencyDialogProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [scale, setScale] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  function close() {
    onOpenChange(false);
    setCode('');
    setName('');
    setScale('2');
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const scaleNumber = Number(scale);

    if (
      !code.trim() ||
      !name.trim() ||
      !Number.isInteger(scaleNumber) ||
      scaleNumber < 0 ||
      scaleNumber > 18
    ) {
      setError({
        detail: 'Completá código, nombre y una escala entera entre 0 y 18.',
        status: '400 Bad Request',
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({ code: code.trim().toUpperCase(), name: name.trim(), scale: scaleNumber });
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
      title="Nueva moneda"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[1fr_110px] gap-4">
          <div className="field">
            <label>Código</label>
            <input
              className="input"
              maxLength={16}
              placeholder="USD"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Escala</label>
            <input
              className="input"
              inputMode="numeric"
              value={scale}
              onChange={(event) => setScale(event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Nombre</label>
          <input
            className="input"
            maxLength={100}
            placeholder="US Dollar"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Guardar
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
