'use client';

import { ArrowsClockwise, WarningCircle } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface ErrorPanelProps {
  scope: string;
  statusLabel: string;
  detail: string;
  onRetry: () => void;
}

/** Shared error panel for network/5xx failures loading a screen's data. Never invents copy. */
export function ErrorPanel({ scope, statusLabel, detail, onRetry }: ErrorPanelProps) {
  const router = useRouter();

  return (
    <div
      role="alert"
      className="flex max-w-[560px] flex-col gap-6 rounded-lg p-8"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
          style={{ background: 'var(--color-chip-bg)', color: 'var(--color-warn)' }}
        >
          <WarningCircle size={20} />
        </span>
        <div className="flex flex-col gap-px">
          <h4>No pudimos cargar {scope}</h4>
          <span className="text-xs opacity-55">{statusLabel}</span>
        </div>
      </div>

      <div
        className="flex flex-col gap-1 rounded-md p-4"
        style={{ background: 'var(--color-chip-bg)' }}
      >
        <span className="text-[13px]" style={{ color: 'var(--color-chip-ink)' }}>
          {detail}
        </span>
        <code className="text-[10px]" style={{ color: 'var(--color-accent-ink)' }}>
          application/problem+json
        </code>
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <ArrowsClockwise size={16} />
          Reintentar
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push('/resumen')}>
          Ir al resumen
        </button>
      </div>
    </div>
  );
}
