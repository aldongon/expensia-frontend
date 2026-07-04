'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { flattenNavigation, navigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const visibleNavItems = flattenNavigation(navigation);

  return (
    <nav
      aria-label="Navegación principal"
      className="border-t border-slate-200 bg-white px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden dark:border-slate-800 dark:bg-[#121a16]"
    >
      <div className="flex [scrollbar-width:none] gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {visibleNavItems.map((entry) => {
          const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);

          return (
            <Link
              key={entry.href}
              href={entry.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-20 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              <entry.icon className="h-5 w-5 shrink-0" />
              <span className="max-w-20 truncate">{entry.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
