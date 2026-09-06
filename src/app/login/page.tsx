'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { ProblemBanner } from '@/components/ui/problem-banner';
import { ApiProblemError } from '@/lib/problem';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ detail: string; status: string } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/resumen');
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError({ detail: 'Ingresá tu email y tu contraseña.', status: '400 Bad Request' });
      return;
    }

    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
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
            <p className="text-sm opacity-70">Usá tu email y contraseña para continuar.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="input"
                value={email}
                disabled={submitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                value={password}
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? <ProblemBanner detail={error.detail} status={error.status} /> : null}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
