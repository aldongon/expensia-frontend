'use client';

import { useState, type ReactNode } from 'react';

import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SidebarContent } from '@/components/layout/sidebar';
import { TopHeader } from '@/components/layout/top-header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

export function AppShell({ children }: { children: ReactNode }) {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'hidden flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 lg:flex dark:border-slate-800 dark:bg-[#121a16]',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(open) => setMobileOpen(open)}>
        <SheetContent side="left" className="p-0" showCloseButton={false}>
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto bg-[#f7f8f5] p-4 sm:p-6 dark:bg-[#111814]">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
