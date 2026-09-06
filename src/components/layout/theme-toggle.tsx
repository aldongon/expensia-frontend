'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] hover:bg-[var(--color-hover)]"
      style={{ marginTop: 'auto' }}
    >
      <span
        className="relative h-[18px] w-[34px] flex-none rounded-full transition-colors duration-[.18s]"
        style={{
          background: isDark ? 'var(--color-chip-bg)' : 'transparent',
          boxShadow: 'inset 0 0 0 1px var(--color-divider)',
        }}
      >
        <input
          type="checkbox"
          checked={isDark}
          onChange={() => setTheme(isDark ? 'light' : 'dark')}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
        <span
          className="absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full transition-transform duration-[.18s]"
          style={{
            background: 'var(--color-accent)',
            transform: `translateX(${isDark ? '16px' : '0px'})`,
          }}
        />
      </span>
      {isDark ? <Moon size={15} /> : <Sun size={15} />}
      {isDark ? 'Modo oscuro' : 'Modo claro'}
    </label>
  );
}
