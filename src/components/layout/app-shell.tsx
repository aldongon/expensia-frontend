import { Sidebar } from '@/components/layout/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col gap-8 px-8 pt-8 pb-16">{children}</main>
    </div>
  );
}
