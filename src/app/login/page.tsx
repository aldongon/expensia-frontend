'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { ProblemBanner } from '@/components/ui/problem-banner';
import { ApiProblemError } from '@/lib/problem';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/resumen');
    }
  }, [router, status]);

  async function handleCredential(credential: string) {
    setError(null);
    setSubmitting(true);

    try {
      await signInWithGoogle(credential);
      router.replace('/resumen');
    } catch (submitError) {
      if (submitError instanceof ApiProblemError) {
        setError({ detail: submitError.message, status: `${submitError.status}` });
      } else {
        setError({ detail: 'No pudimos conectarnos con el servidor.', status: 'Error de red' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <section
        className="grid w-full max-w-[860px] overflow-hidden rounded-lg md:grid-cols-[0.85fr_1.15fr]"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div
          className="hidden flex-col justify-between p-8 md:flex"
          style={{ background: 'var(--color-band)', color: 'var(--color-band-ink)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 0 12px var(--color-accent)',
              }}
            />
            <span className="font-heading text-lg font-medium tracking-[-0.015em]">Expensia</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-tight">Tus finanzas personales, en un vistazo</h1>
            <p className="max-w-sm text-sm" style={{ color: 'var(--color-band-dim)' }}>
              Registrá tus gastos, definí un presupuesto mensual y llevá el control de tus gastos
              recurrentes.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-8" style={{ background: 'var(--color-surface)' }}>
          <div className="flex flex-col gap-1">
            <h2>Iniciar sesión</h2>
            <p className="text-sm opacity-70">Usá tu cuenta de Google para continuar.</p>
          </div>

          <div className="flex flex-col gap-4">
            <GoogleSignInButton onCredential={handleCredential} disabled={submitting} />

            {submitting ? (
              <p className="text-center text-sm opacity-70" role="status">
                Entrando…
              </p>
            ) : null}

            {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
