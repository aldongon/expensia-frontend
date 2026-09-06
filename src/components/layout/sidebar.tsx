'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { navigation } from '@/lib/navigation';
import { useAuthStore } from '@/stores/auth-store';

function formatSessionExpiry(expiresAt: string | null): string {
  if (!expiresAt) {
    return 'Sesión válida 24 h';
  }

  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(expiresAt)
  );

  return `Sesión válida hasta las ${time}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const email = useAuthStore((state) => state.email);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <nav
      className="flex w-[212px] flex-none flex-col gap-8 p-4"
      style={{ background: 'var(--color-rail)' }}
    >
      <div className="flex items-center gap-3 px-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: 'var(--color-accent)', boxShadow: '0 0 12px var(--color-accent)' }}
        />
        <span className="font-heading text-lg font-medium tracking-[-0.015em]">Expensia</span>
      </div>

      <div className="flex flex-col gap-1">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]"
              style={{ color: active ? 'var(--color-accent)' : 'var(--color-text)' }}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <ThemeToggle />

      <div className="flex flex-col gap-1 rounded-md p-3 shadow-sm">
        <span className="text-[13px]">{email ?? '—'}</span>
        <span className="text-[11px] opacity-50">{timezone}</span>
        <span className="text-[11px] opacity-50">{formatSessionExpiry(expiresAt)}</span>
      </div>
    </nav>
  );
}
