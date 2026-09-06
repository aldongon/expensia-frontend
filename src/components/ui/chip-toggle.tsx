interface ChipToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  size?: 'sm' | 'xs';
}

/** The conmutable tag/filter chip used in expense filters and the expense dialog's tag picker. */
export function ChipToggle({ label, active, onToggle, size = 'sm' }: ChipToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="cursor-pointer rounded-md font-[inherit]"
      style={{
        fontSize: size === 'sm' ? 12 : 11,
        padding: size === 'sm' ? '4px 11px' : '3px 10px',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-divider)'}`,
        background: active ? 'var(--color-chip-bg)' : 'transparent',
        color: active ? 'var(--color-chip-ink)' : 'var(--color-text)',
      }}
    >
      {label}
    </button>
  );
}
