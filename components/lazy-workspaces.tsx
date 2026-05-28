'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { AnalyticsDashboard as AnalyticsDashboardComponent } from '@/components/analytics/analytics-dashboard';
import type { TradingCalendar as TradingCalendarComponent } from '@/components/calendar/trading-calendar';
import type { DashboardWorkstation as DashboardWorkstationComponent } from '@/components/dashboard/dashboard-workstation';
import type { ImportCenter as ImportCenterComponent } from '@/components/import/import-center';
import type { InsightConsole as InsightConsoleComponent } from '@/components/insights/insight-console';
import type { TradesTable as TradesTableComponent } from '@/components/trades/trades-table';

const LoadingSurface = () => <div className="min-h-96 animate-pulse rounded-lg border bg-card" />;

const DashboardWorkstation = dynamic(
  () => import('@/components/dashboard/dashboard-workstation').then((module) => module.DashboardWorkstation),
  { loading: LoadingSurface, ssr: false }
);

const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics/analytics-dashboard').then((module) => module.AnalyticsDashboard),
  { loading: LoadingSurface, ssr: false }
);

const TradingCalendar = dynamic(
  () => import('@/components/calendar/trading-calendar').then((module) => module.TradingCalendar),
  { loading: LoadingSurface, ssr: false }
);

const TradesTable = dynamic(
  () => import('@/components/trades/trades-table').then((module) => module.TradesTable),
  { loading: LoadingSurface, ssr: false }
);

const ImportCenter = dynamic(
  () => import('@/components/import/import-center').then((module) => module.ImportCenter),
  { loading: LoadingSurface, ssr: false }
);

const InsightConsole = dynamic(
  () => import('@/components/insights/insight-console').then((module) => module.InsightConsole),
  { loading: LoadingSurface, ssr: false }
);

export function LazyDashboardWorkstation(props: ComponentProps<typeof DashboardWorkstationComponent>) {
  return <DashboardWorkstation {...props} />;
}

export function LazyAnalyticsDashboard(props: ComponentProps<typeof AnalyticsDashboardComponent>) {
  return <AnalyticsDashboard {...props} />;
}

export function LazyTradingCalendar(props: ComponentProps<typeof TradingCalendarComponent>) {
  return <TradingCalendar {...props} />;
}

export function LazyTradesTable(props: ComponentProps<typeof TradesTableComponent>) {
  return <TradesTable {...props} />;
}

export function LazyImportCenter(props: ComponentProps<typeof ImportCenterComponent>) {
  return <ImportCenter {...props} />;
}

export function LazyInsightConsole(props: ComponentProps<typeof InsightConsoleComponent>) {
  return <InsightConsole {...props} />;
}
