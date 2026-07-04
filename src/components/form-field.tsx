import type { ReactNode } from 'react';

export const inputClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-transparent dark:text-white';

export function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
        {optional && <span className="text-muted-foreground font-normal"> · opcional</span>}
      </span>
      {children}
    </label>
  );
}
