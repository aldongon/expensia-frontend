'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BrandLogo } from '@/components/brand-logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { isNavGroup, navigation } from '@/lib/navigation';

interface SidebarContentProps {
  onNavClick?: () => void;
}

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const pathname = usePathname();
  const activeGroupLabels = useMemo(
    () =>
      new Set(
        navigation
          .filter(isNavGroup)
          .filter((entry) =>
            entry.children.some(
              (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
            )
          )
          .map((entry) => entry.label)
      ),
    [pathname]
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => activeGroupLabels);

  useEffect(() => {
    if (activeGroupLabels.size === 0) {
      return;
    }

    setOpenGroups((current) => {
      const next = new Set(current);

      activeGroupLabels.forEach((label) => next.add(label));

      return next;
    });
  }, [activeGroupLabels]);

  function toggleGroup(label: string) {
    setOpenGroups((current) => {
      const next = new Set(current);

      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }

      return next;
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-6 py-5">
        <BrandLogo className="h-10 w-[178px]" />
        <p className="text-muted-foreground mt-1 truncate text-xs">Finanzas personales</p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4">
        <nav className="space-y-1 py-2">
          {navigation.map((entry) => {
            if (isNavGroup(entry)) {
              const active = entry.children.some(
                (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
              );
              const open = openGroups.has(entry.label);

              return (
                <div key={entry.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.label)}
                    aria-expanded={open}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    <entry.icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
                    />
                  </button>

                  {open ? (
                    <div className="space-y-1 pl-7">
                      {entry.children.map((child) => {
                        const childActive =
                          pathname === child.href || pathname.startsWith(`${child.href}/`);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavClick}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              childActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            )}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);

            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <entry.icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{entry.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
