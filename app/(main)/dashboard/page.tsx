import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getVisibleUserIds } from '@/lib/server-finance';
import { currentPeriod, formatLempiras, money } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, WorkPanel } from '@/components/module-ui';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { month: currentMonth, year: currentYear } = currentPeriod();
  const visibleUserIds = await getVisibleUserIds(session);
  const visibleParams = visibleUserIds.length ? visibleUserIds : [session.id];

  const dbIncomes = await queryRows<{ amount: string }>(
    `select amount
     from incomes
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and extract(month from date) = $3
       and extract(year from date) = $4`,
    [session.id, visibleParams, currentMonth, currentYear],
  );

  const totalIncomes = dbIncomes.reduce((acc, curr) => acc + money(curr.amount), 0);

  const dbExpenses = await queryRows<{
    id: string;
    userId: string;
    type: string;
    category: string;
    amount: string;
    date: string;
    visibility: string;
  }>(
    `select id, user_id as "userId", type, category, amount, date::text, visibility
     from expenses
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and extract(month from date) = $3
       and extract(year from date) = $4
     order by date desc, created_at desc`,
    [session.id, visibleParams, currentMonth, currentYear],
  );

  const balances = await queryRows<{
    expenseId: string | null;
    payerId: string;
    owerId: string;
    amount: string;
  }>(
    `select expense_id as "expenseId", payer_id as "payerId", ower_id as "owerId", amount
     from couple_balances
     where status = 'PENDING' and (payer_id = $1 or ower_id = $1)`,
    [session.id],
  );

  const activeFixed = await queryRows<{ amount: string }>(
    `select amount from fixed_expenses
     where status = 'ACTIVE'
       and (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))`,
    [session.id, visibleParams],
  );

  const cards = await queryRows<{ minPayment: string }>(
    `select min_payment as "minPayment" from credit_cards
     where user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[]))`,
    [session.id, visibleParams],
  );

  const activeProjects = await queryRows<{ id: string; name: string; currentAmount: string; targetAmount: string }>(
    `select id, name, current_amount as "currentAmount", target_amount as "targetAmount"
     from projects
     where status = 'ACTIVE'
       and (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
     order by created_at desc`,
    [session.id, visibleParams],
  );

  const contributions = await queryRows<{ amount: string }>(
    `select amount from project_contributions
     where user_id = $1 and extract(month from date) = $2 and extract(year from date) = $3`,
    [session.id, currentMonth, currentYear],
  );

  const periodBudgets = await queryRows<{ id: string; category: string; monthlyLimit: string }>(
    `select id, category, monthly_limit as "monthlyLimit"
     from budgets
     where (user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[])))
       and month = $3 and year = $4`,
    [session.id, visibleParams, currentMonth, currentYear],
  );

  const privateExpenses = dbExpenses
    .filter((expense) => expense.userId === session.id && expense.visibility === 'PRIVATE')
    .reduce((acc, curr) => acc + money(curr.amount), 0);

  const sharedShare = dbExpenses
    .filter((expense) => expense.visibility === 'SHARED')
    .reduce((acc, expense) => {
      const balance = balances.find((item) => item.expenseId === expense.id);
      if (!balance) return acc + money(expense.amount) / 2;
      if (balance.payerId === session.id) return acc + Math.max(0, money(expense.amount) - money(balance.amount));
      if (balance.owerId === session.id) return acc + money(balance.amount);
      return acc;
    }, 0);

  const fixedTotal = activeFixed.reduce((acc, item) => acc + money(item.amount), 0);
  const projectContributionTotal = contributions.reduce((acc, item) => acc + money(item.amount), 0);
  const pendingCards = cards.reduce((acc, card) => acc + money(card.minPayment), 0);
  const totalExpenses = privateExpenses + sharedShare;
  const available = totalIncomes - totalExpenses - fixedTotal - projectContributionTotal - pendingCards;

  const budgetAlerts = periodBudgets.map((budget) => {
    const spent = dbExpenses
      .filter((expense) => expense.category === budget.category)
      .reduce((acc, expense) => acc + money(expense.amount), 0);
    const pct = money(budget.monthlyLimit) > 0 ? (spent / money(budget.monthlyLimit)) * 100 : 0;
    return { budget, spent, pct };
  }).filter((item) => item.pct >= 70);

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Centro de control"
        title="Dashboard financiero"
        description={`Resumen ejecutivo de ${new Date().toLocaleString('es', { month: 'long', year: 'numeric' })}. Aquí se ve tu liquidez, compromisos y señales importantes del mes.`}
      >
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Sesión: <span className="font-semibold text-slate-950">{session.name}</span>
        </div>
      </ModuleHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Disponible" value={formatLempiras(available)} tone="blue" detail="Ingresos menos gastos y compromisos" />
        <MetricTile label="Ingresos del mes" value={formatLempiras(totalIncomes)} tone="green" detail={`${dbIncomes.length} registros`} />
        <MetricTile label="Gastos del mes" value={formatLempiras(totalExpenses)} tone="red" detail="Personales y tu parte compartida" />
        <MetricTile label="Compromisos" value={formatLempiras(fixedTotal + projectContributionTotal + pendingCards)} tone="amber" detail="Fijos, proyectos y tarjetas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WorkPanel title="Fórmula del disponible" description="Desglose operativo del saldo que puedes usar.">
          <div className="space-y-3 text-sm">
            {[
              ['Ingresos', totalIncomes],
              ['Gastos personales', privateExpenses],
              ['Parte compartida', sharedShare],
              ['Gastos fijos', fixedTotal],
              ['Aportes a proyectos', projectContributionTotal],
              ['Pagos mínimos de tarjeta', pendingCards],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-950">{formatLempiras(value as number)}</span>
              </div>
            ))}
          </div>
        </WorkPanel>

        <WorkPanel title="Proyectos activos" description="Avance de tus metas principales.">
          <div className="space-y-4">
            {activeProjects.slice(0, 4).map((project) => (
              <div key={project.id} className="text-sm">
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-800">{project.name}</span>
                  <span className="font-semibold text-slate-950">{Math.min((money(project.currentAmount) / money(project.targetAmount)) * 100, 100).toFixed(0)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#102a4c]" style={{ width: `${Math.min((money(project.currentAmount) / money(project.targetAmount)) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
            {activeProjects.length === 0 && <p className="text-sm text-slate-500">No hay proyectos activos.</p>}
          </div>
        </WorkPanel>

        <WorkPanel title="Alertas" description="Presupuestos que requieren atención.">
          <div className="space-y-3">
            {budgetAlerts.slice(0, 4).map((item) => (
              <div key={item.budget.id} className="rounded-md border border-amber-100 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">{item.budget.category}</p>
                <p className="text-amber-700">{item.pct.toFixed(0)}% del presupuesto usado</p>
              </div>
            ))}
            {budgetAlerts.length === 0 && <p className="text-sm text-slate-500">Sin alertas importantes.</p>}
          </div>
        </WorkPanel>
      </div>
      
      <WorkPanel title="Últimos gastos" description="Movimientos recientes registrados en el periodo.">
        <div className="-m-5 overflow-hidden">
          {dbExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No hay gastos recientes</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dbExpenses.slice(0, 5).map((expense) => (
                <li key={expense.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/70">
                  <div>
                    <p className="font-medium text-slate-950 text-sm">{expense.category}</p>
                    <p className="text-xs text-slate-500">{expense.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600 text-sm">-{formatLempiras(expense.amount)}</p>
                    <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </WorkPanel>
    </div>
  );
}
