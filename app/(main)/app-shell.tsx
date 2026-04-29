'use client';

import { useState } from 'react';
import type { UserPayload } from '@/lib/auth';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

export function AppShell({ user, children }: { user: UserPayload; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <main
        className={cn(
          'min-w-0 px-4 pb-10 pt-20 transition-[margin] duration-200 sm:px-6 lg:px-10 lg:pt-10',
          collapsed ? 'lg:ml-24' : 'lg:ml-72',
        )}
      >
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
