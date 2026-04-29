import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { CreatePartnerForm } from './create-partner-form';
import { queryOne } from '@/lib/db';
import { ModuleHeader, StatusPill, WorkPanel } from '@/components/module-ui';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await queryOne<{
    id: string;
    name: string;
    username: string;
    role: string;
    coupleId: string | null;
  }>(
    'select id, name, username, role, couple_id as "coupleId" from users where id = $1 limit 1',
    [session.id],
  );

  const partner = user?.role === 'OWNER'
    ? await queryOne<{
        id: string;
        name: string;
        username: string;
        mustChangePassword: boolean;
        createdAt: string;
      }>(
        `select id, name, username, must_change_password as "mustChangePassword", created_at::text as "createdAt"
         from users
         where role = 'PARTNER' and created_by_id = $1
         order by created_at desc
         limit 1`,
        [session.id],
      )
    : await queryOne<{
        id: string;
        name: string;
        username: string;
        mustChangePassword: boolean;
        createdAt: string;
      }>(
        `select id, name, username, false as "mustChangePassword", created_at::text as "createdAt"
         from users
         where role = 'OWNER' and id = $1
         limit 1`,
        [session.coupleId ?? session.id],
      );

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Administración"
        title="Configuración"
        description="Gestiona perfil, reglas de privacidad y acceso de pareja desde un panel claro y seguro."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkPanel title="Perfil" description="Datos principales de la cuenta activa.">
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Nombre</span>
              <span className="font-medium text-slate-950">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Usuario</span>
              <span className="font-medium text-slate-950">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Rol</span>
              <span className="font-medium text-slate-950">{user?.role === 'OWNER' ? 'Administrador' : 'Pareja'}</span>
            </div>
          </div>
        </WorkPanel>

        <WorkPanel title="Privacidad" description="Regla central del sistema.">
          <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
            <p>Los registros privados solo los ve quien los creó.</p>
            <p>Los registros compartidos aparecen para ambos usuarios vinculados a la pareja.</p>
            <p>La pareja puede crear sus propios ingresos y gastos privados, pero no puede ver datos privados del administrador.</p>
          </div>
        </WorkPanel>
      </div>

      {user?.role === 'OWNER' && (
        <section className="panel p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Usuario de pareja</h2>
              <p className="mt-1 text-sm text-slate-500">Crea una cuenta para que tu pareja registre sus finanzas y vea solo lo compartido.</p>
            </div>
            {partner ? (
              <StatusPill tone="green">Vinculado</StatusPill>
            ) : (
              <StatusPill tone="amber">Pendiente</StatusPill>
            )}
          </div>

          {partner ? (
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-slate-500">Nombre</p>
                <p className="mt-1 font-semibold text-slate-950">{partner.name}</p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-slate-500">Usuario</p>
                <p className="mt-1 font-semibold text-slate-950">{partner.username}</p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-slate-500">Estado</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {partner.mustChangePassword ? 'Debe cambiar contraseña' : 'Activo'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 max-w-xl">
              <CreatePartnerForm ownerId={session.id} />
            </div>
          )}
        </section>
      )}

      {user?.role === 'PARTNER' && (
        <WorkPanel title="Cuenta vinculada" description="Tu usuario pertenece a una cuenta de pareja.">
          <div className="mt-5 rounded-md border border-slate-200 p-4 text-sm">
            <p className="text-slate-500">Administrador</p>
            <p className="mt-1 font-semibold text-slate-950">{partner?.name ?? 'Cuenta principal'}</p>
          </div>
        </WorkPanel>
      )}
    </div>
  );
}
