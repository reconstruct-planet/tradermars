'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { RoleBadge } from '@/components/admin/admin-badges';
import { Brand } from '@/components/brand';
import { useI18n } from '@/components/i18n-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hasAdminPermission, type UserRole } from '@/lib/admin-permissions';
import { cn } from '@/lib/utils';

type AdminShellProps = {
  admin: {
    name: string;
    email: string;
    role: UserRole;
  };
  environment: string;
  children: ReactNode;
};

const navItems = [
  { href: '/admin', labelKey: 'admin.shell.overview', icon: LayoutDashboard, permission: 'dashboard.view' },
  { href: '/admin/users', labelKey: 'admin.shell.users', icon: Users, permission: 'users.view' },
  { href: '/admin/audit-logs', labelKey: 'admin.shell.auditLogs', icon: ClipboardList, permission: 'audit.view' },
  { href: '/admin/imports', labelKey: 'admin.shell.imports', icon: FileWarning, permission: 'imports.view' },
  { href: '/admin/plans', labelKey: 'admin.shell.plansUsage', icon: BarChart3, permission: 'plans.view' },
  { href: '/admin/support', labelKey: 'admin.shell.support', icon: ShieldCheck, permission: 'notes.write' },
  { href: '/admin/settings', labelKey: 'admin.shell.settings', icon: Settings, permission: 'settings.view' }
] satisfies Array<{ href: string; labelKey: string; icon: LucideIcon; permission: Parameters<typeof hasAdminPermission>[1] }>;

export function AdminShell({ admin, environment, children }: AdminShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const visibleNav = useMemo(
    () => navItems.filter((item) => hasAdminPermission(admin.role, item.permission)),
    [admin.role]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r bg-card/96 shadow-[16px_0_50px_hsl(var(--foreground)/0.04)] backdrop-blur transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : 'hidden -translate-x-full lg:block'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Brand />
            <span className="rounded-md border px-2 py-1 text-xs font-semibold text-muted-foreground">{t('admin.shell.admin')}</span>
          </Link>
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-1 p-3">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                  active && 'bg-primary/10 text-primary'
                )}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="rounded-md border bg-secondary/50 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{t('admin.shell.environment')}</span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{environment}</p>
          </div>
        </div>
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <form action="/admin/users" className="hidden w-full max-w-sm md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" className="pl-9" placeholder={t('admin.shell.searchUsers')} />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-md border px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground sm:inline-flex">
              {environment}
            </span>
            <RoleBadge role={admin.role} />
            <ThemeToggle />
            <div className="hidden min-w-0 text-right text-sm xl:block">
              <p className="truncate font-medium">{admin.name}</p>
              <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              title={t('admin.shell.signOut')}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
