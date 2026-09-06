'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <span className="text-sm opacity-60">Verificando sesión…</span>
      </div>
    );
  }

  return children;
}
