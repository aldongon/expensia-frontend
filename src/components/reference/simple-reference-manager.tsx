'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Field, inputClass } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { ApiRequestError } from '@/lib/auth-client';

type NamedItem = { id: number; name: string };

type SimpleReferenceManagerProps = {
  title: string;
  formHeading: string;
  fieldLabel: string;
  placeholder: string;
  addLabel: string;
  emptyLabel: string;
  successMessage: string;
  errorMessage: string;
  icon: ReactNode;
  items: NamedItem[];
  isPending: boolean;
  onCreate: (name: string) => Promise<unknown>;
};

/** Create-and-view manager for reference data that is just a unique name (tags, payment methods). */
export function SimpleReferenceManager({
  title,
  formHeading,
  fieldLabel,
  placeholder,
  addLabel,
  emptyLabel,
  successMessage,
  errorMessage,
  icon,
  items,
  isPending,
  onCreate,
}: SimpleReferenceManagerProps) {
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !isPending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setFormError(null);

    try {
      await onCreate(name.trim());
      toast.success(successMessage, { duration: 2600 });
      setName('');
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.data?.detail || error.message : errorMessage
      );
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Expensia</p>
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{title}</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#121a16]"
      >
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">{formHeading}</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label={fieldLabel}>
              <input
                className={inputClass}
                maxLength={64}
                placeholder={placeholder}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {addLabel}
          </Button>
        </div>
        {formError && (
          <p className="border-destructive/25 bg-destructive/[.08] text-destructive rounded-lg border px-3 py-2.5 text-[13px]">
            {formError}
          </p>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-lg">
              {icon}
            </div>
            <p className="text-muted-foreground text-sm">{emptyLabel}</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border-b border-[#f1f5f0] px-5 py-3 text-sm text-slate-700 last:border-b-0 dark:border-slate-800/60 dark:text-slate-300"
            >
              {item.name}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
