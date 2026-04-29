import { payFixedExpense } from '@/app/actions/fixed-expenses';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getVisibleUserIds } from '@/lib/server-finance';
import { formatLempiras } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';
import { FixedExpenseForm } from './fixed-expense-form';

export default async function FixedExpensesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visibleUserIds = await getVisibleUserIds(session);
  const items = await queryRows<{
    id: string;
    name: string;
    amount: string;
    dayOfMonth: number;
    category: string;
    paymentMethod: string;
    visibility: string;
    lastPaidAt: string | null;
    status: string;
  }>(
    `select id, name, amount, day_of_month as "dayOfMonth", category,
            payment_method as "paymentMethod", visibility, last_paid_at::text as "lastPaidAt", status
     from fixed_expenses
     where user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[]))
     order by day_of_month asc`,
    [session.id, visibleUserIds.length ? visibleUserIds : [session.id]],
  );

  async function submitFixedPayment(formData: FormData) {
    'use server';
    await payFixedExpense(formData);
  }
  const monthlyTotal = items.reduce((acc, item) => acc + Number(item.amount), 0);
  const now = new Date();
  const overdueCount = items.filter((item) => item.status === 'ACTIVE' && now.getDate() > Number(item.dayOfMonth) && (!item.lastPaidAt || new Date(item.lastPaidAt).getMonth() !== now.getMonth())).length;

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Obligaciones recurrentes"
        title="Gastos fijos"
        description="Controla pagos mensuales, vencimientos y registra el gasto real automáticamente al marcarlo como pagado."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Mensual fijo" value={formatLempiras(monthlyTotal)} tone="blue" detail="Total activo visible" />
        <MetricTile label="Registros" value={items.length} tone="neutral" detail="Privados y compartidos" />
        <MetricTile label="Vencidos" value={overdueCount} tone={overdueCount ? 'red' : 'green'} detail="Pendientes del mes" />
      </div>

      <div className="module-grid">
        <WorkPanel title="Nuevo gasto fijo" description="Define monto, día de pago, categoría y visibilidad." className="sticky top-8 self-start">
          <FixedExpenseForm />
        </WorkPanel>

        <div className="space-y-4">
          {items.length === 0 && (
            <div className="panel p-8 text-center text-slate-500">No hay gastos fijos registrados.</div>
          )}
          {items.map((item) => {
            const now = new Date();
            const overdue = item.status === 'ACTIVE' && now.getDate() > Number(item.dayOfMonth) && (!item.lastPaidAt || new Date(item.lastPaidAt).getMonth() !== now.getMonth());
            return (
              <div key={item.id} className="panel p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="text-sm text-slate-500">Vence día {item.dayOfMonth} · {item.category} · {item.visibility === 'SHARED' ? 'Compartido' : 'Privado'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatLempiras(item.amount)}</p>
                      <StatusPill tone={overdue ? 'red' : 'green'}>{overdue ? 'Vencido' : item.status}</StatusPill>
                    </div>
                    <form action={submitFixedPayment}>
                      <input type="hidden" name="fixedExpenseId" value={item.id} />
                      <input type="hidden" name="amount" value={item.amount} />
                      <input type="hidden" name="name" value={item.name} />
                      <input type="hidden" name="category" value={item.category} />
                      <input type="hidden" name="paymentMethod" value={item.paymentMethod} />
                      <input type="hidden" name="visibility" value={item.visibility} />
                      <Button variant="outline">Pagar</Button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
