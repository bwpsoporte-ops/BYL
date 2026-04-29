import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getVisibleUserIds } from '@/lib/server-finance';
import { currentPeriod, formatLempiras, money } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, WorkPanel } from '@/components/module-ui';

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const period = currentPeriod();
  const visibleUserIds = await getVisibleUserIds(session);
  const visibleParams = visibleUserIds.length ? visibleUserIds : [session.id];
  const monthIncomes = await queryRows<{ amount: string }>(
    `select amount from incomes
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and extract(month from date) = $3
       and extract(year from date) = $4`,
    [session.id, visibleParams, period.month, period.year],
  );
  const monthExpenses = await queryRows<{ category: string; amount: string }>(
    `select category, amount from expenses
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and extract(month from date) = $3
       and extract(year from date) = $4`,
    [session.id, visibleParams, period.month, period.year],
  );
  const sharedBalances = await queryRows<{ status: string; owerId: string; amount: string }>(
    `select status, ower_id as "owerId", amount
     from couple_balances
     where payer_id = $1 or ower_id = $1`,
    [session.id],
  );
  const sharedProjects = await queryRows<{ id: string; name: string; currentAmount: string; targetAmount: string }>(
    `select id, name, current_amount as "currentAmount", target_amount as "targetAmount"
     from projects
     where visibility = 'SHARED' and user_id = any($1::uuid[])
     order by created_at desc`,
    [visibleParams],
  );

  const incomeTotal = monthIncomes.reduce((acc, income) => acc + money(income.amount), 0);
  const expenseTotal = monthExpenses.reduce((acc, expense) => acc + money(expense.amount), 0);
  const byCategory = monthExpenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + money(expense.amount);
    return acc;
  }, {});
  const internalDebt = sharedBalances
    .filter((balance) => balance.status !== 'SETTLED')
    .reduce((acc, balance) => acc + (balance.owerId === session.id ? -money(balance.amount) : money(balance.amount)), 0);

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Analítica"
        title="Reportes"
        description="Vista mensual para analizar ingresos, gastos, ahorro, categorías y balance compartido."
      />

      <div className="grid gap-6 md:grid-cols-4">
        <MetricTile label="Ingresos" value={formatLempiras(incomeTotal)} tone="green" detail="Periodo actual" />
        <MetricTile label="Gastos" value={formatLempiras(expenseTotal)} tone="red" detail="Periodo actual" />
        <MetricTile label="Ahorro neto" value={formatLempiras(incomeTotal - expenseTotal)} tone="blue" detail="Ingresos menos gastos" />
        <MetricTile label="Balance pareja" value={formatLempiras(internalDebt)} tone="amber" detail="Deuda interna abierta" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <WorkPanel title="Gastos por categoría" description="Distribución del gasto visible en el periodo." className="overflow-hidden">
          <div className="-m-5">
          {Object.entries(byCategory).map(([category, total]) => (
            <div key={category} className="data-row text-sm">
              <span>{category}</span>
              <span className="font-medium">{formatLempiras(total)}</span>
            </div>
          ))}
          {Object.entries(byCategory).length === 0 && <div className="p-8 text-center text-sm text-slate-500">Sin gastos en el periodo.</div>}
          </div>
        </WorkPanel>

        <WorkPanel title="Proyectos compartidos" description="Metas visibles para ambos usuarios." className="overflow-hidden">
          <div className="-m-5">
          {sharedProjects.map((project) => (
            <div key={project.id} className="data-row text-sm">
              <span>{project.name}</span>
              <span className="font-medium">{formatLempiras(project.currentAmount)} / {formatLempiras(project.targetAmount)}</span>
            </div>
          ))}
          {sharedProjects.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No hay proyectos compartidos.</div>}
          </div>
        </WorkPanel>
      </div>
    </div>
  );
}
