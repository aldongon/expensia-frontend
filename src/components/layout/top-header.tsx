'use client';

import { ChevronDown, LogOut, Menu, UserCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { findNavigationItem } from '@/lib/navigation';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';

interface TopHeaderProps {
  onMobileMenuOpen: () => void;
}

export function TopHeader({ onMobileMenuOpen }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const email = useAuthStore((state) => state.email);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const signOut = useAuthStore((state) => state.signOut);
  const pageTitle = findNavigationItem(pathname)?.headerTitle ?? 'Dashboard';

  function handleLogout() {
    signOut();
    router.replace('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-[#121a16]">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="hidden lg:flex"
        aria-label="Alternar barra lateral"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onMobileMenuOpen}
        className="lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'h-9 max-w-[220px] gap-2 px-2'
            )}
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className="hidden min-w-0 truncate text-sm sm:block">{email ?? 'Usuario'}</span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="text-foreground block truncate text-sm font-medium">
                {email ?? 'Usuario'}
              </span>
              {expiresAt ? (
                <span className="text-muted-foreground block truncate text-xs font-normal">
                  Sesión hasta {formatDateTime(expiresAt)}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
