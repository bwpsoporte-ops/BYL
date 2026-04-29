import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from './change-password-form';

export default async function ChangePasswordPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  if (!session.mustChangePassword) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Actualizar Contraseña</h1>
          <p className="text-gray-500 text-sm mt-2">Por seguridad, debes cambiar tu contraseña inicial</p>
        </div>
        <ChangePasswordForm userId={session.id} />
      </div>
    </div>
  );
}
