'use client';

import { useMemo } from 'react';
import { MultiBarChart, PnlBarChart, WinRateLine } from '@/components/charts/performance-charts';
import { useI18n } from '@/components/i18n-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildWinRateTrend,
  calculateKpis,
  groupByDay,
  groupByMonth,
  groupByWeekday,
  groupPerformance,
  mistakeSummary
} from '@/lib/metrics';
import type { TradingData } from '@/lib/types';

export function AnalyticsDashboard({ data }: { data: TradingData }) {
  const { locale, t, formatCurrency, formatNumber, formatPercent } = useI18n();
  const kpis = useMemo(() => calculateKpis(data.trades), [data.trades]);
  const byDay = useMemo(
    () => groupByDay(data.trades).slice(-14).map((day) => ({ date: day.name, pnl: day.pnl })),
    [data.trades]
  );
  const byMonth = useMemo(() => groupByMonth(data.trades, locale), [data.trades, locale]);
  const bySymbol = useMemo(() => groupPerformance(data.trades, (trade) => trade.symbol).slice(0, 8), [data.trades]);
  const byStrategy = useMemo(
    () => groupPerformance(data.trades, (trade) => trade.strategy ?? 'Unassigned').slice(0, 8),
    [data.trades]
  );
  const byTag = useMemo(
    () => groupPerformance(
      data.trades.flatMap((trade) => trade.tags.map((tag) => ({ ...trade, tag }))),
      (trade) => trade.tag
    ).slice(0, 8),
    [data.trades]
  );
  const bySession = useMemo(
    () => groupPerformance(data.trades, (trade) => trade.session ?? 'Unassigned').slice(0, 8),
    [data.trades]
  );
  const weekday = useMemo(() => groupByWeekday(data.trades, locale), [data.trades, locale]);
  const mistakes = useMemo(() => mistakeSummary(data.trades), [data.trades]);
  const winRateTrend = useMemo(() => buildWinRateTrend(data.trades), [data.trades]);
  const rr = useMemo(
    () => groupPerformance(data.trades, (trade) => trade.strategy ?? 'Unassigned')
      .map((row) => ({ ...row, averageR: Number(row.averageR.toFixed(2)) }))
      .slice(0, 8),
    [data.trades]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{t('analytics.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title={t('dashboard.kpis.netPnl')} value={formatCurrency(kpis.netPnl)} />
        <Metric title={t('dashboard.kpis.winRate')} value={formatPercent(kpis.winRate)} />
        <Metric title={t('dashboard.kpis.profitFactor')} value={formatNumber(kpis.profitFactor)} />
        <Metric title={t('dashboard.kpis.averageR')} value={formatNumber(kpis.averageR)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t('analytics.performanceByDay')} description={t('analytics.dailyPnl')}>
          <PnlBarChart data={byDay} />
        </Panel>
        <Panel title={t('analytics.performanceByMonth')} description={t('analytics.monthlySample')}>
          <MultiBarChart data={byMonth} />
        </Panel>
        <Panel title={t('analytics.performanceBySymbol')} description={t('analytics.topSymbols')}>
          <MultiBarChart data={bySymbol} />
        </Panel>
        <Panel title={t('analytics.performanceByStrategy')} description={t('analytics.strategyExpectedValue')}>
          <MultiBarChart data={byStrategy} />
        </Panel>
        <Panel title={t('analytics.performanceByTag')} description={t('analytics.behaviorLabels')}>
          <MultiBarChart data={byTag} />
        </Panel>
        <Panel title={t('analytics.pnlBySession')} description={t('analytics.sessionBreakdown')}>
          <MultiBarChart data={bySession} />
        </Panel>
        <Panel title={t('analytics.winRateOverTime')} description={t('analytics.runningWinRate')}>
          <WinRateLine data={winRateTrend} />
        </Panel>
        <Panel title={t('analytics.riskReward')} description={t('analytics.averageRByStrategy')}>
          <MultiBarChart data={rr} dataKey="averageR" />
        </Panel>
        <Panel title={t('analytics.weekday')} description={t('analytics.calendarSample')}>
          <MultiBarChart data={weekday} />
        </Panel>
        <Panel title={t('analytics.mistake')} description={t('analytics.mistakeDrag')}>
          <MultiBarChart data={mistakes} />
        </Panel>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
