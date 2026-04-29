import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getVisibleUserIds } from '@/lib/server-finance';
import { currentPeriod, formatLempiras, money } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, WorkPanel } from '@/components/module-ui';
import { BudgetForm } from './budget-form';

export default async function BudgetsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const period = currentPeriod();
  const visibleUserIds = await getVisibleUserIds(session);
  const visibleParams = visibleUserIds.length ? visibleUserIds : [session.id];
  const budgetItems = await queryRows<{ id: string; category: string; monthlyLimit: string }>(
    `select id, category, monthly_limit as "monthlyLimit"
     from budgets
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and month = $3 and year = $4
     order by category asc`,
    [session.id, visibleParams, period.month, period.year],
  );

  const monthExpenses = await queryRows<{ category: string; amount: string }>(
    `select category, amount
     from expenses
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and extract(month from date) = $3
       and extract(year from date) = $4`,
    [session.id, visibleParams, period.month, period.year],
  );

  const totalLimit = budgetItems.reduce((acc, budget) => acc + money(budget.monthlyLimit), 0);
  const totalSpent = monthExpenses.reduce((acc, expense) => acc + money(expense.amount), 0);
  const overLimit = budgetItems.filter((budget) => {
    const spent = monthExpenses.filter((expense) => expense.category === budget.category).reduce((acc, expense) => acc + money(expense.amount), 0);
    return spent >= money(budget.monthlyLimit);
  }).length;

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Disciplina de gasto"
        title="Presupuestos"
        description="Define límites mensuales por categoría y monitorea alertas de consumo contra el gasto real."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Límite total" value={formatLempiras(totalLimit)} tone="blue" detail="Presupuesto del mes" />
        <MetricTile label="Gastado" value={formatLempiras(totalSpent)} tone="amber" detail="Gastos visibles del periodo" />
        <MetricTile label="Sobre límite" value={overLimit} tone={overLimit ? 'red' : 'green'} detail="Categorías al 100%" />
      </div>

      <div className="module-grid">
        <WorkPanel title="Nuevo límite" description="Crea un presupuesto por categoría para el mes actual." className="sticky top-8 self-start">
          <BudgetForm />
        </WorkPanel>

        <div className="space-y-4">
          {budgetItems.length === 0 && <div className="panel p-8 text-center text-slate-500">No hay presupuestos para este mes.</div>}
          {budgetItems.map((budget) => {
            const spent = monthExpenses.filter((expense) => expense.category === budget.category).reduce((acc, expense) => acc + money(expense.amount), 0);
            const pct = Math.min((spent / money(budget.monthlyLimit)) * 100, 999);
            const tone = pct >= 100 ? 'bg-red-600' : pct >= 90 ? 'bg-amber-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-600';
            return (
              <div key={budget.id} className="panel p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{budget.category}</p>
                    <p className="text-sm text-slate-500">{formatLempiras(spent)} de {formatLempiras(budget.monthlyLimit)}</p>
                  </div>
                  <p className="font-semibold">{pct.toFixed(0)}%</p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
