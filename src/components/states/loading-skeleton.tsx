const BARS = [58, 34, 72, 46, 88, 30, 64, 41, 76, 52, 68, 38];
const ROWS = [64, 48, 72, 40, 56, 68];

function pulseStyle(delaySeconds: number): React.CSSProperties {
  return {
    background: 'var(--color-neutral-300)',
    animation: 'ex-pulse 1.4s ease-in-out infinite',
    animationDelay: `${delaySeconds.toFixed(2)}s`,
  };
}

/** Shared loading skeleton, reserving the same layout every screen's real content takes. */
export function LoadingSkeleton({ scope }: { scope: string }) {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-3">
        <div className="h-[30px] w-[220px] rounded-md" style={pulseStyle(0)} />
        <div className="h-[11px] w-[320px] rounded" style={pulseStyle(0.1)} />
      </div>

      <div
        className="grid overflow-hidden rounded-lg"
        style={{
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="flex flex-col gap-4 p-8" style={{ background: 'var(--color-band)' }}>
          <div
            className="h-[10px] w-[120px] rounded"
            style={{
              background: 'var(--color-band-line)',
              animation: 'ex-pulse 1.4s ease-in-out infinite',
            }}
          />
          <div
            className="h-[44px] w-[70%] rounded-md"
            style={{
              background: 'var(--color-band-line)',
              animation: 'ex-pulse 1.4s ease-in-out infinite',
              animationDelay: '.15s',
            }}
          />
          <div className="h-[5px] rounded" style={{ background: 'var(--color-band-deep)' }} />
          <div className="flex gap-8 pt-4">
            {[0.2, 0.3, 0.4].map((delay) => (
              <div
                key={delay}
                className="h-7 w-16 rounded-md"
                style={{
                  background: 'var(--color-band-line)',
                  animation: 'ex-pulse 1.4s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
        <div
          className="flex min-h-[190px] flex-col justify-end gap-3 p-8"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="flex h-[110px] items-end gap-1.5">
            {BARS.map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t"
                style={{ height: `${height}%`, ...pulseStyle(index * 0.05) }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {ROWS.map((width, index) => (
          <div
            key={width}
            className="flex items-center gap-4 rounded-md p-4"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="h-3 w-11 rounded" style={pulseStyle(index * 0.08)} />
            <div
              className="h-3 rounded"
              style={{ width: `${width}%`, ...pulseStyle(index * 0.08) }}
            />
            <div className="ml-auto h-3 w-[90px] rounded" style={pulseStyle(index * 0.08)} />
          </div>
        ))}
      </div>

      <span className="text-xs opacity-50">Cargando {scope}…</span>
    </div>
  );
}
