'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare,
  Crown,
  Goal,
  Import,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  NotebookText,
  Search,
  Settings,
  Tags,
  Table2,
  Upload,
  X
} from 'lucide-react';
import { memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Brand } from '@/components/brand';
import { UpgradeModal } from '@/components/billing/upgrade-modal';
import { useI18n } from '@/components/i18n-provider';
import { LanguageSelector } from '@/components/language-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { isLocale } from '@/lib/i18n-routing';
import { hasFeature, planDefinitions, type FeatureKey } from '@/lib/plans';
import type { AppShellData } from '@/lib/types';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, feature: 'basic_dashboard' },
  { path: '/trades', labelKey: 'nav.trades', icon: Table2, feature: 'manual_trades' },
  { path: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays, feature: 'calendar' },
  { path: '/analytics', labelKey: 'nav.analytics', icon: BarChart3, feature: 'advanced_analytics' },
  { path: '/insights', labelKey: 'nav.insights', icon: Bot, feature: 'ai_insights' },
  { path: '/notes', labelKey: 'nav.notes', icon: NotebookText, feature: 'manual_trades' },
  { path: '/tags', labelKey: 'nav.tags', icon: Tags, feature: 'manual_trades' },
  { path: '/plans', labelKey: 'nav.plans', icon: CheckSquare, feature: 'calendar' },
  { path: '/goals', labelKey: 'nav.goals', icon: Goal, feature: 'goals' },
  { path: '/import', labelKey: 'nav.importCenter', icon: Import, feature: 'csv_import' },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings }
] satisfies Array<{ path: string; labelKey: string; icon: LucideIcon; feature?: FeatureKey }>;

export function AppShell({ children, data }: { children: ReactNode; data: AppShellData }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const currentPlan = data.user.plan;
  const localizedRoutes = isLocale(pathname.split('/').filter(Boolean)[0]);
  const appBase = localizedRoutes ? `/${locale}` : '/app';
  const activePathname = optimisticPath ?? pathname;
  const routes = useMemo(() => navItems.map((item) => `${appBase}${item.path}`), [appBase]);

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  useEffect(() => {
    routes.forEach((href) => router.prefetch(href));
  }, [router, routes]);

  const closeMobileNav = useCallback(() => setOpen(false), []);
  const openMobileNav = useCallback(() => setOpen(true), []);
  const handleNavigate = useCallback((href: string) => {
    setOptimisticPath(href);
    setOpen(false);
  }, []);
  const handleLockedFeature = useCallback((feature: FeatureKey) => {
    setLockedFeature(feature);
    setOpen(false);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r bg-card/95 shadow-[16px_0_50px_hsl(var(--primary)/0.05)] backdrop-blur transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : 'hidden -translate-x-full lg:block'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Brand />
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={closeMobileNav}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <NavList
          activePathname={activePathname}
          appBase={appBase}
          currentPlan={currentPlan}
          onLockedFeature={handleLockedFeature}
          onNavigate={handleNavigate}
          t={t}
        />
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="rounded-md border border-primary/10 bg-secondary/70 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium">{data.account.name}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-[11px] font-medium text-primary">
                <Crown className="h-3 w-3" />
                {planDefinitions[currentPlan].name}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{data.account.broker ?? t('common.manualAccount')}</p>
          </div>
        </div>
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 min-w-0 max-w-[100vw] items-center gap-3 overflow-x-clip border-b bg-background/95 px-4">
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={openMobileNav}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden items-center gap-2 xl:flex">
            <Select className="w-56" value={data.account.id} onChange={() => undefined}>
              <option value={data.account.id}>{data.account.name}</option>
            </Select>
            <Input className="w-36" type="date" defaultValue="2026-05-01" />
            <Input className="w-36" type="date" defaultValue="2026-05-31" />
          </div>
          <div className="relative ml-auto hidden w-full max-w-sm xl:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={t('nav.searchPlaceholder')} />
          </div>
          {hasFeature(currentPlan, 'csv_import') ? (
            <div className="hidden lg:block">
              <Button asChild variant="outline">
                <Link href={`${appBase}/import`} prefetch onClick={() => handleNavigate(`${appBase}/import`)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('common.import')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="hidden lg:block">
              <Button variant="outline" onClick={() => setLockedFeature('csv_import')}>
                <Upload className="mr-2 h-4 w-4" />
                {t('common.import')}
              </Button>
            </div>
          )}
          <LanguageSelector className="w-28 shrink-0 sm:w-32" />
          <ThemeToggle />
          <div className="hidden min-w-0 text-right text-sm lg:block">
            <p className="truncate font-medium">{data.user.name}</p>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => signOut({ callbackUrl: localizedRoutes ? `/${locale}` : '/' })}>
              {t('common.logout')}
            </button>
          </div>
        </header>
        {data.isDemoFallback ? (
          <div className="overflow-wrap-anywhere border-b bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {t('nav.demoBanner')}
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-[100vw] min-w-0 px-4 py-6 lg:max-w-[1500px] lg:px-6">{children}</main>
      </div>
      {lockedFeature ? (
        <UpgradeModal
          open={Boolean(lockedFeature)}
          onOpenChange={(nextOpen) => setLockedFeature(nextOpen ? lockedFeature : null)}
          feature={lockedFeature}
          currentPlan={currentPlan}
        />
      ) : null}
    </div>
  );
}

const NavList = memo(function NavList({
  activePathname,
  appBase,
  currentPlan,
  onLockedFeature,
  onNavigate,
  t
}: {
  activePathname: string;
  appBase: string;
  currentPlan: AppShellData['user']['plan'];
  onLockedFeature: (feature: FeatureKey) => void;
  onNavigate: (href: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <nav className="space-y-1 p-3">
      {navItems.map((item) => {
        const href = `${appBase}${item.path}`;
        const active = activePathname === href || activePathname.startsWith(`${href}/`);
        const Icon = item.icon;
        const locked = item.feature ? !hasFeature(currentPlan, item.feature) : false;
        const className = cn(
          'flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
          active && 'bg-primary/10 text-primary',
          locked && 'text-muted-foreground/70'
        );

        return locked && item.feature ? (
          <button
            key={item.path}
            className={className}
            onClick={() => onLockedFeature(item.feature!)}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{t(item.labelKey)}</span>
            <LockKeyhole className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Link
            key={item.path}
            href={href}
            prefetch
            className={className}
            onClick={() => onNavigate(href)}
          >
            <Icon className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
});
