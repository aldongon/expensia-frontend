import { WarningCircle } from '@phosphor-icons/react/dist/ssr';

/** The RFC 9457 error banner used in dialogs and forms — never invents copy, always shows `detail`. */
export function ProblemBanner({ detail, status }: { detail: string; status?: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-md px-4 py-3"
      style={{
        background: 'var(--color-chip-bg)',
        boxShadow: 'inset 0 0 0 1px var(--color-chip-line)',
      }}
    >
      <WarningCircle size={16} style={{ color: 'var(--color-warn)', marginTop: 2 }} />
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px]" style={{ color: 'var(--color-chip-ink)' }}>
          {detail}
        </span>
        {status ? (
          <code className="text-[10px]" style={{ color: 'var(--color-accent-ink)' }}>
            {status} · application/problem+json
          </code>
        ) : null}
      </div>
    </div>
  );
}
