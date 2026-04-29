import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { IncomeForm } from './income-form';
import { getVisibleUserIds } from '@/lib/server-finance';
import { formatLempiras } from '@/lib/finance';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';

export default async function IncomesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visibleUserIds = await getVisibleUserIds(session);
  const myIncomes = await queryRows<{
    id: string;
    type: string;
    description: string | null;
    amount: string;
    date: string;
    visibility: string;
  }>(
    `select id, type, description, amount, date::text, visibility
     from incomes
     where user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[]))
     order by date desc, created_at desc`,
    [session.id, visibleUserIds.length ? visibleUserIds : [session.id]],
  );
  const totalIncome = myIncomes.reduce((acc, income) => acc + Number(income.amount), 0);
  const sharedCount = myIncomes.filter((income) => income.visibility === 'SHARED').length;

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Flujo de entrada"
        title="Ingresos"
        description="Administra salario, bonos, negocios, comisiones e ingresos recurrentes con privacidad por registro."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Total registrado" value={formatLempiras(totalIncome)} tone="green" detail="Según registros visibles" />
        <MetricTile label="Registros" value={myIncomes.length} tone="neutral" detail="Privados y compartidos" />
        <MetricTile label="Compartidos" value={sharedCount} tone="blue" detail="Visibles para la pareja" />
      </div>

      <div className="module-grid">
        <WorkPanel title="Nuevo ingreso" description="Registra una fuente de dinero y define si es privada o compartida." className="sticky top-8 self-start">
          <IncomeForm coupleActive={!!session.coupleId} />
        </WorkPanel>

        <div>
          <Card className="panel overflow-hidden py-0">
             <div className="border-b border-slate-100 px-5 py-4">
               <h2 className="font-semibold text-slate-950">Historial de ingresos</h2>
               <p className="mt-1 text-sm text-slate-500">Ordenado por fecha más reciente.</p>
             </div>
             {myIncomes.length === 0 ? (
               <div className="p-8 text-center text-slate-500">No tienes ingresos registrados.</div>
             ) : (
                <div className="divide-y divide-slate-100">
                  {myIncomes.map(income => (
                    <div key={income.id} className="data-row hover:bg-slate-50/60">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{income.type}</p>
                          <StatusPill tone={income.visibility === 'SHARED' ? 'blue' : 'neutral'}>
                            {income.visibility === 'SHARED' ? 'Compartido' : 'Privado'}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{income.description || 'Sin descripción'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+{formatLempiras(income.amount)}</p>
                        <p className="text-xs text-gray-400">{new Date(income.date).toLocaleDateString()}</p>
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
