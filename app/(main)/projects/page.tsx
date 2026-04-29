import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ProjectForm } from './project-form';
import { getVisibleUserIds } from '@/lib/server-finance';
import { formatLempiras, monthsRemaining } from '@/lib/finance';
import { addProjectContribution } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queryRows } from '@/lib/db';
import { MetricTile, ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visibleUserIds = await getVisibleUserIds(session);
  const myProjects = await queryRows<{
    id: string;
    name: string;
    targetAmount: string;
    targetDate: string;
    currentAmount: string;
    visibility: string;
    status: string;
  }>(
    `select id, name, target_amount as "targetAmount", target_date::text as "targetDate",
            current_amount as "currentAmount", visibility, status
     from projects
     where user_id = $1 or (visibility = 'SHARED' and user_id = any($2::uuid[]))
     order by created_at desc`,
    [session.id, visibleUserIds.length ? visibleUserIds : [session.id]],
  );

  async function submitContribution(formData: FormData) {
    'use server';
    await addProjectContribution(formData);
  }
  const totalTarget = myProjects.reduce((acc, project) => acc + Number(project.targetAmount), 0);
  const totalSaved = myProjects.reduce((acc, project) => acc + Number(project.currentAmount), 0);
  const sharedProjects = myProjects.filter((project) => project.visibility === 'SHARED').length;

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Metas y capital"
        title="Proyectos de ahorro"
        description="Planifica metas grandes, calcula avance, aporte sugerido y separa proyectos privados de compartidos."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Ahorrado" value={formatLempiras(totalSaved)} tone="green" detail="Acumulado en proyectos" />
        <MetricTile label="Meta total" value={formatLempiras(totalTarget)} tone="blue" detail="Objetivo combinado" />
        <MetricTile label="Compartidos" value={sharedProjects} tone="neutral" detail="Visibles para la pareja" />
      </div>

      <div className="module-grid">
        <WorkPanel title="Nuevo proyecto" description="Define meta, fecha objetivo y visibilidad." className="sticky top-8 self-start">
          <ProjectForm coupleActive={!!session.coupleId} />
        </WorkPanel>

        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Portafolio de metas</h2>
            <p className="text-sm text-slate-500">Seguimiento de avance y aportes mensuales.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
             {myProjects.length === 0 ? (
               <div className="panel col-span-full p-8 text-center text-slate-500">
                 No tienes proyectos de ahorro activos.
               </div>
             ) : (
                myProjects.map(project => {
                  const target = Number(project.targetAmount);
                  const current = Number(project.currentAmount);
                  const remaining = target - current;
                  const progress = Math.min((current / target) * 100, 100);
                  
                  // Calculate months remaining
                  const months = monthsRemaining(project.targetDate);
                  const suggestedAmount = months > 0 ? (remaining / months) : remaining;

                  return (
                    <div key={project.id} className="panel flex flex-col justify-between p-6">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-950 text-lg">{project.name}</p>
                            {project.visibility === 'SHARED' && (
                              <StatusPill tone="blue">Compartido</StatusPill>
                            )}
                          </div>
                          <StatusPill tone={project.status === 'ACTIVE' ? 'green' : 'neutral'}>{project.status}</StatusPill>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Ahorro Acumulado</p>
                            <p className="font-semibold text-lg text-green-600">{formatLempiras(current)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Meta</p>
                            <p className="font-medium">{formatLempiras(target)}</p>
                          </div>
                        </div>
                        
                        {/* usage bar */}
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-green-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                          <p>Falta: {formatLempiras(remaining)}</p>
                          <p>Sugerido: {formatLempiras(suggestedAmount)}/mes</p>
                        </div>
                        <form action={submitContribution} className="grid gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <input type="hidden" name="projectId" value={project.id} />
                          <Input name="amount" type="number" step="0.01" min="0" placeholder="Aporte" className="h-9" />
                          <Button variant="outline">Aportar</Button>
                        </form>
                      </div>
                    </div>
                  );
                })
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
