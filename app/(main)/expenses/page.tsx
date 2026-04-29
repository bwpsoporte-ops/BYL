import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ExpenseForm } from './expense-form';
import { Card } from '@/components/ui/card';
import { getVisibleUserIds } from '@/lib/server-finance';
import { formatLempiras } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visibleUserIds = await getVisibleUserIds(session);
  const visibleParams = visibleUserIds.length ? visibleUserIds : [session.id];
  const cards = await queryRows<{
    id: string;
    bank: string;
    name: string;
    lastFour: string;
    cardType: string;
  }>(
    `select id, bank, name, last_four as "lastFour", card_type as "cardType"
     from credit_cards
     where user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[]))
     order by bank, name`,
    [session.id, visibleParams],
  );

  const myExpenses = await queryRows<{
    id: string;
    type: string;
    category: string;
    paymentMethod: string;
    amount: string;
    date: string;
    visibility: string;
    receiptId: string | null;
    cardName: string | null;
  }>(
    `select e.id, e.type, e.category, e.payment_method as "paymentMethod", e.amount, e.date::text, e.visibility,
            e.receipt_id as "receiptId",
            concat(c.bank, ' ', c.name, ' ****', c.last_four) as "cardName"
     from expenses e
     left join credit_cards c on c.id = e.card_id
     where e.user_id = $1 or (e.visibility = 'SHARED' and e.user_id = any($2::uuid[]))
     order by e.created_at desc`,
    [session.id, visibleParams],
  );
  const totalExpenses = myExpenses.reduce((acc, expense) => acc + Number(expense.amount), 0);
  const withReceipt = myExpenses.filter((expense) => expense.receiptId).length;
  const sharedCount = myExpenses.filter((expense) => expense.visibility === 'SHARED').length;

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Control de salida"
        title="Gastos"
        description="Registra pagos personales y compartidos, asócialos a tarjetas y adjunta comprobantes para revisión."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Total gastado" value={formatLempiras(totalExpenses)} tone="red" detail="Registros visibles" />
        <MetricTile label="Compartidos" value={sharedCount} tone="blue" detail="Con balance de pareja" />
        <MetricTile label="Con comprobante" value={withReceipt} tone="amber" detail="Pendientes o confirmados" />
      </div>

      <div className="module-grid">
        <WorkPanel title="Nuevo gasto" description="Selecciona método de pago, tarjeta y división compartida cuando aplique." className="sticky top-8 self-start">
          <ExpenseForm coupleActive={!!session.coupleId} cards={cards} />
        </WorkPanel>

        <div>
          <Card className="panel overflow-hidden py-0">
             <div className="border-b border-slate-100 px-5 py-4">
               <h2 className="font-semibold text-slate-950">Movimientos de gasto</h2>
               <p className="mt-1 text-sm text-slate-500">Detalle operativo con tarjeta, comprobante y visibilidad.</p>
             </div>
             {myExpenses.length === 0 ? (
               <div className="p-8 text-center text-slate-500">No tienes gastos registrados.</div>
             ) : (
                <div className="divide-y divide-slate-100">
                  {myExpenses.map(expense => (
                    <div key={expense.id} className="data-row hover:bg-slate-50/60">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{expense.category}</p>
                          <StatusPill tone={expense.visibility === 'SHARED' ? 'blue' : 'neutral'}>
                            {expense.visibility === 'SHARED' ? 'Compartido' : 'Privado'}
                          </StatusPill>
                          {expense.receiptId ? <StatusPill tone="amber">Comprobante</StatusPill> : null}
                        </div>
                        <p className="text-sm text-slate-500">
                          {expense.type} • {expense.paymentMethod}
                          {expense.cardName ? ` • ${expense.cardName}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">-{formatLempiras(expense.amount)}</p>
                        <p className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
}
