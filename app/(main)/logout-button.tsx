'use client';

import { logoutUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutUser();
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={compact ? 'outline' : 'ghost'}
      className={compact ? 'h-9 rounded-md px-3' : 'text-slate-600 hover:text-slate-950'}
      disabled={pending}
      onClick={handleLogout}
    >
      {pending ? 'Saliendo...' : 'Salir'}
    </Button>
  );
}
