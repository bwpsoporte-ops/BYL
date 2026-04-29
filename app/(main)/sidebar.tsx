'use client';

import { UserPayload } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CreditCard,
  FileText,
  Gauge,
  Landmark,
  Menu,
  PieChart,
  ReceiptText,
  Settings,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { LogoutButton } from './logout-button';

export function Sidebar({
  user,
  collapsed,
  onToggle,
}: {
  user: UserPayload;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const logoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { name: 'Dashboard', href: '/dashboard', ownerOnly: false, Icon: Gauge },
    { name: 'Ingresos', href: '/incomes', ownerOnly: false, Icon: Landmark },
    { name: 'Gastos', href: '/expenses', ownerOnly: false, Icon: ReceiptText },
    { name: 'Tarjetas', href: '/cards', ownerOnly: false, Icon: CreditCard },
    { name: 'Gastos fijos', href: '/fixed-expenses', ownerOnly: false, Icon: CalendarClock },
    { name: 'Proyectos', href: '/projects', ownerOnly: false, Icon: BookOpenCheck },
    { name: 'Presupuestos', href: '/budgets', ownerOnly: false, Icon: PieChart },
    { name: 'Documentos', href: '/documents', ownerOnly: false, Icon: FileText },
    { name: 'Reportes', href: '/reports', ownerOnly: false, Icon: BarChart3 },
    { name: 'Configuración', href: '/settings', ownerOnly: false, Icon: Settings },
  ];

  const renderLinks = (mobile = false) => (
    links.filter((link) => !link.ownerOnly || user.role === 'OWNER').map((link) => {
      const isActive = pathname === link.href;
      const Icon = link.Icon;
      return (
        <Link
          key={link.name}
          href={link.href}
          className={cn(
            mobile
              ? "inline-flex h-10 shrink-0 items-center rounded-md px-3 text-sm transition-colors"
              : cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "justify-between",
                ),
            isActive
              ? mobile
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-950 shadow-sm"
              : mobile
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                : "text-white/78 hover:bg-white/10 hover:text-white"
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "opacity-90" : "opacity-55")} strokeWidth={1.8} />
            <span className={cn(!mobile && collapsed && 'sr-only')}>{link.name}</span>
          </span>
          {!mobile && isActive && !collapsed && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
        </Link>
      );
    })
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">BYL Finanzas</p>
            <p className="text-xs text-slate-500">{user.name} · {user.role === 'OWNER' ? 'Administrador' : 'Pareja'}</p>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton compact />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md" onClick={() => setMobileOpen((open) => !open)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Menú</span>
            </Button>
          </div>
        </div>
        {mobileOpen ? (
          <nav className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
            {renderLinks(true)}
          </nav>
        ) : null}
      </header>

      <aside className={cn(
        "fixed inset-y-0 left-0 hidden flex-col bg-[#102a4c] text-white transition-[width] duration-200 lg:flex",
        collapsed ? "w-24" : "w-72",
      )}>
        <div className={cn("border-b border-white/10 p-5", collapsed && "px-3")}>
          <div className={cn("flex items-start justify-between gap-3", collapsed && "flex-col items-center")}>
            <div className={cn(collapsed && "text-center")}>
              <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-md border border-white/15 bg-white/10 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-sm font-semibold">
                    BYL
                  </div>
                )}
                {!collapsed && <h2 className="text-xl font-semibold tracking-tight">BYL Finanzas</h2>}
              </div>
              {!collapsed && <p className="mt-1 text-xs text-white/60">Panel financiero familiar</p>}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md border-white/20 bg-white text-xs text-slate-950 hover:bg-slate-100"
              onClick={onToggle}
            >
              {collapsed ? 'Abrir' : 'Cerrar'}
            </Button>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {renderLinks()}
        </nav>
        <div className={cn("border-t border-white/10 p-4", collapsed && "px-3")}>
          <div className={cn("flex items-center justify-between rounded-md bg-white px-3 py-2 text-slate-950", collapsed && "flex-col gap-2")}>
            {!collapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                <span className="text-xs text-slate-500">{user.role === 'OWNER' ? 'Administrador' : 'Pareja'}</span>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
