import { cn } from '@/lib/utils';

export function ModuleHeader({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#102a4c]" />
      <div className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#102a4c]">{eyebrow}</p> : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </section>
  );
}

export function MetricTile({
  label,
  value,
  tone = 'neutral',
  detail,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'green' | 'red' | 'blue' | 'amber';
  detail?: string;
}) {
  const tones = {
    neutral: 'border-slate-200 bg-white text-slate-950',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    red: 'border-red-100 bg-red-50 text-red-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-950',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
  };

  return (
    <div className={cn('rounded-lg border p-5 shadow-sm', tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-65">{label}</p>
      <div className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
      {detail ? <p className="mt-2 text-xs opacity-65">{detail}</p> : null}
    </div>
  );
}

export function WorkPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'red' | 'blue' | 'amber' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return <span className={cn('inline-flex rounded-md px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>;
}
