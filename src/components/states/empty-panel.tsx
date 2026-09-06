interface EmptyPanelProps {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}

const BAR_HEIGHTS = [30, 55, 22, 70];

/** Shared empty-state panel — a calm state, not an alert, so it carries no surface fill. */
export function EmptyPanel({ title, body, actionLabel, onAction }: EmptyPanelProps) {
  return (
    <div
      className="flex max-w-[520px] flex-col gap-6 rounded-lg p-8"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex h-11 items-end gap-1" style={{ opacity: 0.5 }}>
        {BAR_HEIGHTS.map((height, index) => (
          <div
            key={height}
            className="w-3 rounded-t"
            style={{
              height: `${height}%`,
              background:
                index === BAR_HEIGHTS.length - 1
                  ? 'var(--color-accent-400)'
                  : 'var(--color-neutral-400)',
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <h4>{title}</h4>
        <p className="max-w-[46ch] text-[13px] opacity-60">{body}</p>
      </div>

      <button type="button" className="btn btn-primary self-start" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
