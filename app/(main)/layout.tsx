import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AppShell } from './app-shell';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.mustChangePassword) {
    redirect('/change-password');
  }

  return <AppShell user={session}>{children}</AppShell>;
}
