'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, Mail, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { ApiRequestError } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Ingresá email y contraseña.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await signIn(trimmedEmail, password);
      router.replace('/dashboard');
    } catch (loginError) {
      if (loginError instanceof ApiRequestError && loginError.status === 401) {
        setError('Email o contraseña inválidos.');
      } else {
        setError('No pudimos iniciar sesión. Intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || status === 'checking' || status === 'authenticated';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-10 dark:bg-[#111814]">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[0.92fr_1.08fr] dark:border-slate-800 dark:bg-[#121a16]">
        <div className="hidden bg-[#173927] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <BrandLogo className="h-11 w-[192px] text-white" />
            <p className="mt-2 text-xs text-emerald-100">Finanzas personales</p>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xs text-3xl leading-tight font-semibold">
              Control diario de gastos
            </h1>
            <p className="max-w-sm text-sm leading-6 text-emerald-100">
              Registrá gastos, pagos recurrentes y datos de referencia desde un solo panel.
            </p>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 md:px-12 md:py-14">
          <div className="mb-8 md:hidden">
            <BrandLogo className="h-10 w-[178px]" />
            <p className="text-muted-foreground text-xs">Finanzas personales</p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Iniciar sesión
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Usá tus credenciales para continuar.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={disabled}
                  onChange={(event) => setEmail(event.target.value)}
                  className={cn(
                    'border-input bg-background text-foreground focus:border-primary focus:ring-primary/20 h-10 w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60',
                    error &&
                      !email.trim() &&
                      'border-destructive focus:border-destructive focus:ring-destructive/20'
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  disabled={disabled}
                  onChange={(event) => setPassword(event.target.value)}
                  className={cn(
                    'border-input bg-background text-foreground focus:border-primary focus:ring-primary/20 h-10 w-full rounded-lg border py-2 pr-10 pl-9 text-sm transition outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60',
                    error &&
                      !password &&
                      'border-destructive focus:border-destructive focus:ring-destructive/20'
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  disabled={disabled}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error ? (
              <p className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={disabled}>
              {submitting || status === 'checking' ? (
                <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
              ) : (
                <LogIn className="h-4 w-4" data-icon="inline-start" />
              )}
              Entrar
            </Button>
          </form>

          <div className="mt-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              render={<Link href="/register" />}
            >
              <UserPlus className="h-4 w-4" data-icon="inline-start" />
              Crear cuenta
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
