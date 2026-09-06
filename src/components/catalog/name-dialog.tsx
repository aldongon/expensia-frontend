'use client';

import { useState } from 'react';

import { DialogShell } from '@/components/ui/dialog-shell';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { ApiProblemError } from '@/lib/problem';

interface NameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  maxLength: number;
  onSubmit: (name: string) => Promise<void>;
}

export function NameDialog({
  open,
  onOpenChange,
  title,
  label,
  maxLength,
  onSubmit,
}: NameDialogProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  function close() {
    onOpenChange(false);
    setName('');
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError({ detail: 'El nombre es obligatorio.', status: '400 Bad Request' });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(name.trim());
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
      title={title}
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="field">
          <label>{label}</label>
          <input
            className="input"
            maxLength={maxLength}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
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
