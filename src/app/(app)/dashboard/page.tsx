import { CalendarDays, CircleDollarSign, CreditCard, Tags } from 'lucide-react';

const overviewItems = [
  {
    label: 'Gastos del mes',
    value: '0',
    icon: CircleDollarSign,
  },
  {
    label: 'Recurrentes',
    value: '0',
    icon: CalendarDays,
  },
  {
    label: 'Métodos de pago',
    value: '0',
    icon: CreditCard,
  },
  {
    label: 'Tags',
    value: '0',
    icon: Tags,
  },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">Expensia</p>
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Resumen principal</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewItems.map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#121a16]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-muted-foreground truncate text-sm">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                  {item.value}
                </p>
              </div>
              <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#121a16]">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            Actividad reciente
          </h3>
          <p className="text-muted-foreground text-sm">Sin actividad registrada.</p>
        </div>
      </section>
    </section>
  );
}
