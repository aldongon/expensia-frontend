'use client';

import { useState, type FormEvent } from 'react';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';

import { Field, inputClass } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { ApiRequestError } from '@/lib/auth-client';
import { useCreateCurrency, useCurrencies } from '@/lib/use-expenses';

export default function CurrenciesPage() {
  const currenciesQuery = useCurrencies();
  const createMutation = useCreateCurrency();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [scale, setScale] = useState('2');
  const [formError, setFormError] = useState<string | null>(null);

  const currencies = currenciesQuery.data ?? [];
  const scaleNumber = Number(scale);
  const scaleValid = Number.isInteger(scaleNumber) && scaleNumber >= 0 && scaleNumber <= 18;
  const canSubmit =
    code.trim().length > 0 && name.trim().length > 0 && scaleValid && !createMutation.isPending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setFormError(null);

    try {
      await createMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        scale: scaleNumber,
      });
      toast.success('Moneda creada', { duration: 2600 });
      setCode('');
      setName('');
      setScale('2');
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.data?.detail || error.message
          : 'No se pudo crear la moneda.'
      );
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Expensia</p>
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Monedas</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#121a16]"
      >
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">Nueva moneda</h3>
        <div className="grid gap-4 sm:grid-cols-[120px_1fr_120px]">
          <Field label="Código">
            <input
              className={inputClass}
              maxLength={16}
              placeholder="USD"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </Field>
          <Field label="Nombre">
            <input
              className={inputClass}
              maxLength={100}
              placeholder="Dólar estadounidense"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Escala">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={18}
              step={1}
              value={scale}
              onChange={(event) => setScale(event.target.value)}
            />
          </Field>
        </div>
        <p className="text-muted-foreground text-xs">
          La escala es la cantidad de decimales (0 a 18) con la que se registran los montos.
        </p>
        {formError && (
          <p className="border-destructive/25 bg-destructive/[.08] text-destructive rounded-lg border px-3 py-2.5 text-[13px]">
            {formError}
          </p>
        )}
        <div>
          <Button type="submit" disabled={!canSubmit}>
            Agregar moneda
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
        <div className="text-muted-foreground grid grid-cols-[100px_1fr_80px] gap-3 border-b border-slate-200 bg-[#fafbfa] px-5 py-3 text-xs font-semibold tracking-[.03em] uppercase dark:border-slate-800 dark:bg-slate-900/40">
          <span>Código</span>
          <span>Nombre</span>
          <span className="text-right">Escala</span>
        </div>
        {currencies.length === 0 ? (
          <EmptyRow icon={<Coins className="size-6" />} label="Aún no tenés monedas." />
        ) : (
          currencies.map((currency) => (
            <div
              key={currency.id}
              className="grid grid-cols-[100px_1fr_80px] items-center gap-3 border-b border-[#f1f5f0] px-5 py-3 text-sm last:border-b-0 dark:border-slate-800/60"
            >
              <span className="font-semibold text-slate-950 dark:text-white">{currency.code}</span>
              <span className="truncate text-slate-700 dark:text-slate-300">{currency.name}</span>
              <span className="text-right text-slate-700 tabular-nums dark:text-slate-300">
                {currency.scale}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EmptyRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-lg">
        {icon}
      </div>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
