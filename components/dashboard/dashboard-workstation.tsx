'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Filter,
  Info,
  LayoutDashboard,
  RotateCcw,
  Save,
  Table2,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  buildDrawdownCurve,
  buildEquityCurve,
  buildHourOfDayPerformance,
  buildTagPerformance,
  buildTradeDurationScatter,
  calculateAdvancedMetrics,
  dayKey,
  filterTrades,
  groupByDay,
  groupByWeekday,
  groupPerformance,
  type TradeFilters
} from '@/lib/metrics';
import type { TradeRecord, TradingData } from '@/lib/types';

const positive = '#0f766e';
const negative = '#dc2626';
const blue = '#2563eb';
const amber = '#d97706';
const violet = '#7c3aed';

type KpiKey =
  | 'netPnl'
  | 'grossProfit'
  | 'grossLoss'
  | 'winRate'
  | 'profitFactor'
  | 'averageWin'
  | 'averageLoss'
  | 'expectancy'
  | 'averageR'
  | 'maxDrawdown'
  | 'totalTrades'
  | 'bestTrade'
  | 'worstTrade';

type ChartFilter =
  | { kind: 'date'; value: string; label: string }
  | { kind: 'symbol'; value: string; label: string }
  | { kind: 'strategy'; value: string; label: string }
  | { kind: 'tag'; value: string; label: string }
  | { kind: 'weekday'; value: string; label: string }
  | { kind: 'hour'; value: number; label: string };

const initialFilters: TradeFilters = {
  dateStart: '',
  dateEnd: '',
  assetType: '',
  strategy: '',
  tag: ''
};

export function DashboardWorkstation({ data }: { data: TradingData }) {
  const { locale, t, formatCurrency, formatNumber, formatPercent } = useI18n();
  const [filters, setFilters] = useState<TradeFilters>(initialFilters);
  const [chartFilter, setChartFilter] = useState<ChartFilter | null>(null);
  const [explainedKpi, setExplainedKpi] = useState<KpiKey | null>(null);
  const [symbolDrawer, setSymbolDrawer] = useState<string | null>(null);

  const filteredTrades = useMemo(() => filterTrades(data.trades, filters), [data.trades, filters]);
  const tableTrades = useMemo(
    () => applyChartFilter(filteredTrades, chartFilter),
    [chartFilter, filteredTrades]
  );
  const metrics = useMemo(() => calculateAdvancedMetrics(filteredTrades), [filteredTrades]);

  const equity = useMemo(() => buildEquityCurve(filteredTrades, data.account.startingBalance), [data.account.startingBalance, filteredTrades]);
  const drawdown = useMemo(() => buildDrawdownCurve(filteredTrades), [filteredTrades]);
  const daily = useMemo(() => groupByDay(filteredTrades).map((row) => ({ ...row, date: row.name })), [filteredTrades]);
  const symbols = useMemo(() => groupPerformance(filteredTrades, (trade) => trade.symbol), [filteredTrades]);
  const strategies = useMemo(() => groupPerformance(filteredTrades, (trade) => trade.strategy ?? t('common.unassigned')), [filteredTrades, t]);
  const tags = useMemo(() => buildTagPerformance(filteredTrades), [filteredTrades]);
  const weekday = useMemo(() => groupByWeekday(filteredTrades, locale), [filteredTrades, locale]);
  const durationScatter = useMemo(() => buildTradeDurationScatter(filteredTrades), [filteredTrades]);
  const hourly = useMemo(() => buildHourOfDayPerformance(filteredTrades), [filteredTrades]);

  const strategyOptions = Array.from(new Set(data.trades.map((trade) => trade.strategy).filter(Boolean))) as string[];
  const tagOptions = Array.from(new Set(data.trades.flatMap((trade) => trade.tags))).sort();

  function resetFilters() {
    setFilters(initialFilters);
    setChartFilter(null);
    setSymbolDrawer(null);
  }

  return (
    <div className="w-[calc(100vw-2rem)] min-w-0 max-w-full space-y-6 lg:w-auto">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="min-w-0">
          <h1 className="overflow-wrap-anywhere break-words text-3xl font-semibold tracking-normal">{t('dashboard.title')}</h1>
          <p className="overflow-wrap-anywhere mt-1 break-words text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/trades`}>
              <Table2 className="mr-2 h-4 w-4" />
              {t('nav.trades')}
            </Link>
          </Button>
          <Button variant="outline" disabled>
            <Save className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      <GlobalFilters
        data={data}
        filters={filters}
        setFilters={setFilters}
        strategyOptions={strategyOptions}
        tagOptions={tagOptions}
        onReset={resetFilters}
      />

      <Card className="border-dashed bg-card/70">
        <CardContent className="flex min-w-0 flex-col gap-3 overflow-hidden p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t('dashboard.savedLayout')}</p>
              <p className="overflow-wrap-anywhere break-words text-xs text-muted-foreground">{t('dashboard.savedLayoutDescription')}</p>
            </div>
          </div>
          {chartFilter ? (
            <Button variant="outline" size="sm" onClick={() => setChartFilter(null)}>
              <X className="mr-2 h-4 w-4" />
              {t('dashboard.clearChartFocus', { label: chartFilter.label })}
            </Button>
          ) : (
            <Badge className="w-full justify-start whitespace-normal text-left sm:w-auto" variant="secondary">{t('dashboard.clickChartHint')}</Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {buildKpiCards(metrics, t, formatCurrency, formatNumber, formatPercent).map((kpi) => (
          <button key={kpi.key} className="text-left" onClick={() => setExplainedKpi(kpi.key)}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-secondary/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{kpi.label}</p>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className={`mt-3 text-2xl font-semibold ${kpi.tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : kpi.tone === 'negative' ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {kpi.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{kpi.detail}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <ChartPanel title={t('dashboard.charts.equityCurve')} description={t('dashboard.chartDescriptions.equityCurve')}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={equity} onClick={(event) => setDateFilterFromChart(event?.activeLabel, setChartFilter)}>
              <defs>
                <linearGradient id="dashEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={positive} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={positive} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={76} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="equity" type="monotone" stroke={positive} fill="url(#dashEquity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t('dashboard.charts.winLoss')} description={t('dashboard.chartDescriptions.winLoss')}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={[
                  { name: t('dashboard.kpiExplain.wins'), value: metrics.wins },
                  { name: t('dashboard.kpiExplain.losses'), value: metrics.losses }
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={4}
              >
                <Cell fill={positive} />
                <Cell fill={negative} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel title={t('dashboard.charts.drawdownCurve')} description={t('dashboard.chartDescriptions.drawdownCurve')}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={drawdown} onClick={(event) => setDateFilterFromChart(event?.activeLabel, setChartFilter)}>
              <defs>
                <linearGradient id="dashDrawdown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={negative} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={negative} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="drawdown" type="monotone" stroke={negative} fill="url(#dashDrawdown)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t('dashboard.charts.cumulativePnl')} description={t('dashboard.chartDescriptions.cumulativePnl')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={equity} onClick={(event) => setDateFilterFromChart(event?.activeLabel, setChartFilter)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="cumulativePnl" type="monotone" stroke={blue} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t('dashboard.charts.dailyPnl')} description={t('dashboard.chartDescriptions.dailyPnl')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} onClick={(entry: { date?: string }) => entry.date && setChartFilter({ kind: 'date', value: entry.date, label: entry.date })}>
                {daily.map((row) => <Cell key={row.date} fill={row.pnl >= 0 ? positive : negative} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t('dashboard.charts.durationScatter')} description={t('dashboard.chartDescriptions.durationScatter')}>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="durationMinutes" name={t('dashboard.duration')} unit="m" tick={{ fontSize: 12 }} />
              <YAxis dataKey="pnl" name="P&L" tick={{ fontSize: 12 }} width={72} />
              <ZAxis range={[50, 220]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
              <Scatter data={durationScatter} fill={violet} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <BarBreakdown
          title={t('dashboard.charts.pnlBySymbol')}
          description={t('dashboard.chartDescriptions.pnlBySymbol')}
          data={symbols}
          color={blue}
          onClick={(name) => setSymbolDrawer(name)}
        />
        <BarBreakdown
          title={t('dashboard.charts.pnlByStrategy')}
          description={t('dashboard.chartDescriptions.pnlByStrategy')}
          data={strategies}
          color={amber}
          onClick={(name) => setChartFilter({ kind: 'strategy', value: name, label: `${t('common.strategy')}: ${name}` })}
        />
        <BarBreakdown
          title={t('dashboard.charts.pnlByTag')}
          description={t('dashboard.chartDescriptions.pnlByTag')}
          data={tags}
          color={positive}
          onClick={(name) => setChartFilter({ kind: 'tag', value: name, label: `${t('common.tag')}: ${name}` })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <ChartPanel title={t('dashboard.charts.hourHeatmap')} description={t('dashboard.chartDescriptions.hourHeatmap')}>
          <HourHeatmap data={hourly} onClick={(hour) => setChartFilter({ kind: 'hour', value: hour, label: `${hour}:00 ${t('dashboard.entries')}` })} />
        </ChartPanel>
        <BarBreakdown
          title={t('dashboard.charts.weekday')}
          description={t('dashboard.chartDescriptions.weekday')}
          data={weekday}
          color={violet}
          onClick={(name) => setChartFilter({ kind: 'weekday', value: name, label: `${t('analytics.weekday')}: ${name}` })}
        />
      </div>

      <FilteredTradesTable trades={tableTrades} chartFilter={chartFilter} setSymbolDrawer={setSymbolDrawer} />

      {explainedKpi ? (
        <KpiExplanation
          kpi={explainedKpi}
          metrics={metrics}
          onClose={() => setExplainedKpi(null)}
        />
      ) : null}

      {symbolDrawer ? (
        <SymbolDrawer
          symbol={symbolDrawer}
          trades={filteredTrades.filter((trade) => trade.symbol === symbolDrawer)}
          onClose={() => setSymbolDrawer(null)}
          onFocusTable={() => setChartFilter({ kind: 'symbol', value: symbolDrawer, label: `${t('common.symbol')}: ${symbolDrawer}` })}
        />
      ) : null}
    </div>
  );
}

function GlobalFilters({
  data,
  filters,
  setFilters,
  strategyOptions,
  tagOptions,
  onReset
}: {
  data: TradingData;
  filters: TradeFilters;
  setFilters: (filters: TradeFilters) => void;
  strategyOptions: string[];
  tagOptions: string[];
  onReset: () => void;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-5 w-5 text-primary" />
          {t('dashboard.filters')}
        </CardTitle>
        <CardDescription>{t('dashboard.filterDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="text-sm">
          <span className="mb-2 block font-medium">{t('dashboard.filterLabels.account')}</span>
          <Select value={data.account.id} onChange={() => undefined}>
            <option value={data.account.id}>{data.account.name}</option>
          </Select>
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">{t('common.startDate')}</span>
          <Input type="date" value={filters.dateStart ?? ''} onChange={(event) => setFilters({ ...filters, dateStart: event.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">{t('common.endDate')}</span>
          <Input type="date" value={filters.dateEnd ?? ''} onChange={(event) => setFilters({ ...filters, dateEnd: event.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">{t('dashboard.filterLabels.assetType')}</span>
          <Select value={filters.assetType ?? ''} onChange={(event) => setFilters({ ...filters, assetType: event.target.value })}>
            <option value="">{t('dashboard.filterLabels.allAssets')}</option>
            {['STOCK', 'OPTION', 'FUTURE', 'FOREX', 'CRYPTO'].map((asset) => <option key={asset}>{asset}</option>)}
          </Select>
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">{t('dashboard.filterLabels.strategy')}</span>
          <Select value={filters.strategy ?? ''} onChange={(event) => setFilters({ ...filters, strategy: event.target.value })}>
            <option value="">{t('dashboard.filterLabels.allStrategies')}</option>
            {strategyOptions.map((strategy) => <option key={strategy}>{strategy}</option>)}
          </Select>
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">{t('dashboard.filterLabels.tag')}</span>
          <Select value={filters.tag ?? ''} onChange={(event) => setFilters({ ...filters, tag: event.target.value })}>
            <option value="">{t('dashboard.filterLabels.allTags')}</option>
            {tagOptions.map((tag) => <option key={tag}>{tag}</option>)}
          </Select>
        </label>
        <div className="flex items-end md:col-span-3 xl:col-span-6">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('dashboard.resetFilters')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function buildKpiCards(
  metrics: ReturnType<typeof calculateAdvancedMetrics>,
  t: (key: string, values?: Record<string, string | number>) => string,
  formatCurrency: (value: number, currency?: string) => string,
  formatNumber: (value: number, digits?: number) => string,
  formatPercent: (value: number, digits?: number) => string
) {
  return [
    { key: 'netPnl', label: t('dashboard.kpis.netPnl'), value: formatCurrency(metrics.netPnl), detail: t('dashboard.kpiDetails.afterFees'), tone: metrics.netPnl >= 0 ? 'positive' : 'negative' },
    { key: 'grossProfit', label: t('dashboard.kpis.grossProfit'), value: formatCurrency(metrics.grossProfit), detail: `${metrics.wins} ${t('dashboard.kpiDetails.winningTrades')}`, tone: 'positive' },
    { key: 'grossLoss', label: t('dashboard.kpis.grossLoss'), value: formatCurrency(metrics.grossLoss), detail: `${metrics.losses} ${t('dashboard.kpiDetails.losingTrades')}`, tone: 'negative' },
    { key: 'winRate', label: t('dashboard.kpis.winRate'), value: formatPercent(metrics.winRate), detail: t('dashboard.kpiDetails.winsClosed') },
    { key: 'profitFactor', label: t('dashboard.kpis.profitFactor'), value: formatNumber(metrics.profitFactor), detail: t('dashboard.kpiDetails.profitVsLoss') },
    { key: 'averageWin', label: t('dashboard.kpis.averageWin'), value: formatCurrency(metrics.averageWin), detail: t('dashboard.kpiDetails.winnersOnly'), tone: 'positive' },
    { key: 'averageLoss', label: t('dashboard.kpis.averageLoss'), value: formatCurrency(metrics.averageLoss), detail: t('dashboard.kpiDetails.losersOnly'), tone: 'negative' },
    { key: 'expectancy', label: t('dashboard.kpis.expectancy'), value: formatCurrency(metrics.expectancy), detail: t('dashboard.kpiDetails.perTrade'), tone: metrics.expectancy >= 0 ? 'positive' : 'negative' },
    { key: 'averageR', label: t('dashboard.kpis.averageR'), value: formatNumber(metrics.averageR), detail: t('dashboard.kpiDetails.rewardRisk') },
    { key: 'maxDrawdown', label: t('dashboard.kpis.maxDrawdown'), value: formatCurrency(metrics.maxDrawdown), detail: t('dashboard.kpiDetails.peakToTrough'), tone: 'negative' },
    { key: 'totalTrades', label: t('dashboard.kpis.totalTrades'), value: String(metrics.totalTrades), detail: t('dashboard.kpiDetails.closedTrades') },
    { key: 'bestTrade', label: t('dashboard.kpis.bestTrade'), value: metrics.bestTrade ? formatCurrency(metrics.bestTrade.netPnl) : formatCurrency(0), detail: metrics.bestTrade?.symbol ?? t('common.noData'), tone: 'positive' },
    { key: 'worstTrade', label: t('dashboard.kpis.worstTrade'), value: metrics.worstTrade ? formatCurrency(metrics.worstTrade.netPnl) : formatCurrency(0), detail: metrics.worstTrade?.symbol ?? t('common.noData'), tone: 'negative' }
  ] satisfies Array<{ key: KpiKey; label: string; value: string; detail: string; tone?: 'positive' | 'negative' }>;
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BarBreakdown({
  title,
  description,
  data,
  color,
  onClick
}: {
  title: string;
  description: string;
  data: Array<{ name: string; pnl: number; trades: number; winRate: number; averageR: number }>;
  color: string;
  onClick: (name: string) => void;
}) {
  return (
    <ChartPanel title={title} description={description}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.slice(0, 8)}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={72} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="pnl" fill={color} radius={[4, 4, 0, 0]} onClick={(entry: { name?: string }) => entry.name && onClick(entry.name)}>
            {data.slice(0, 8).map((row) => <Cell key={row.name} fill={row.pnl >= 0 ? color : negative} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function HourHeatmap({
  data,
  onClick
}: {
  data: ReturnType<typeof buildHourOfDayPerformance>;
  onClick: (hour: number) => void;
}) {
  const { t, formatCurrency } = useI18n();
  const maxPnl = Math.max(1, ...data.map((bucket) => Math.abs(bucket.pnl)));

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8">
      {data.map((bucket) => {
        const intensity = Math.min(0.95, Math.abs(bucket.pnl) / maxPnl);
        const color = bucket.pnl >= 0
          ? `rgba(15, 118, 110, ${0.12 + intensity * 0.72})`
          : `rgba(220, 38, 38, ${0.12 + intensity * 0.72})`;
        return (
          <button
            key={bucket.hour}
            className="min-h-20 rounded-md border p-2 text-left text-xs transition-transform hover:-translate-y-0.5 dark:border-white/10"
            style={{ backgroundColor: bucket.trades ? color : 'hsl(var(--muted) / 0.35)' }}
            onClick={() => onClick(bucket.hour)}
          >
            <span className="font-semibold">{String(bucket.hour).padStart(2, '0')}:00</span>
            <span className="mt-2 block">{formatCurrency(bucket.pnl)}</span>
            <span className="text-muted-foreground">{bucket.trades} {t('calendar.trades')}</span>
          </button>
        );
      })}
    </div>
  );
}

function FilteredTradesTable({
  trades,
  chartFilter,
  setSymbolDrawer
}: {
  trades: TradeRecord[];
  chartFilter: ChartFilter | null;
  setSymbolDrawer: (symbol: string) => void;
}) {
  const { locale, t, formatCurrency, formatNumber } = useI18n();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t('dashboard.filteredTable.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.filteredTable.description', { count: trades.length })}
            {chartFilter ? ` · ${chartFilter.label}` : ''}
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/${locale}/trades`}>
            {t('nav.trades')}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('trades.columnsMap.symbol')}</TableHead>
              <TableHead>{t('common.date')}</TableHead>
              <TableHead>{t('trades.columnsMap.asset')}</TableHead>
              <TableHead>{t('trades.columnsMap.strategy')}</TableHead>
              <TableHead>{t('trades.columnsMap.tags')}</TableHead>
              <TableHead>R</TableHead>
              <TableHead className="text-right">{t('trades.columnsMap.netPnl')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.slice(0, 12).map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>
                  <button className="font-medium text-primary hover:underline" onClick={() => setSymbolDrawer(trade.symbol)}>
                    {trade.symbol}
                  </button>
                </TableCell>
                <TableCell>{dayKey(trade.exitTime ?? trade.entryTime)}</TableCell>
                <TableCell>{trade.assetType}</TableCell>
                <TableCell>{trade.strategy ?? t('common.unassigned')}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {trade.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>{formatNumber(trade.rMultiple)}</TableCell>
                <TableCell className={`text-right font-medium ${trade.netPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(trade.netPnl)}
                </TableCell>
              </TableRow>
            ))}
            {!trades.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">{t('trades.noRows')}</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function KpiExplanation({
  kpi,
  metrics,
  onClose
}: {
  kpi: KpiKey;
  metrics: ReturnType<typeof calculateAdvancedMetrics>;
  onClose: () => void;
}) {
  const { t, formatCurrency, formatNumber, formatPercent } = useI18n();
  const card = buildKpiCards(metrics, t, formatCurrency, formatNumber, formatPercent).find((item) => item.key === kpi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{card?.label}</CardTitle>
            <CardDescription>{card?.value}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">{t(`dashboard.kpiHelp.${kpi}`)}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">{t('dashboard.kpiExplain.wins')}</p>
              <p className="mt-1 text-lg font-semibold">{metrics.wins}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">{t('dashboard.kpiExplain.losses')}</p>
              <p className="mt-1 text-lg font-semibold">{metrics.losses}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SymbolDrawer({
  symbol,
  trades,
  onClose,
  onFocusTable
}: {
  symbol: string;
  trades: TradeRecord[];
  onClose: () => void;
  onFocusTable: () => void;
}) {
  const { t, formatCurrency, formatNumber, formatPercent } = useI18n();
  const metrics = calculateAdvancedMetrics(trades);
  const byStrategy = groupPerformance(trades, (trade) => trade.strategy ?? t('common.unassigned')).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="h-full w-full max-w-xl overflow-auto border-l bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('dashboard.symbolDrawer.title')}</p>
            <h2 className="text-3xl font-semibold tracking-normal">{symbol}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniMetric label={t('dashboard.kpis.netPnl')} value={formatCurrency(metrics.netPnl)} tone={metrics.netPnl >= 0 ? 'positive' : 'negative'} />
          <MiniMetric label={t('dashboard.kpis.winRate')} value={formatPercent(metrics.winRate)} />
          <MiniMetric label={t('dashboard.kpis.profitFactor')} value={formatNumber(metrics.profitFactor)} />
          <MiniMetric label={t('calendar.trades')} value={String(metrics.totalTrades)} />
        </div>

        <Button className="mt-5 w-full" onClick={onFocusTable}>
          {t('dashboard.symbolDrawer.focus', { symbol })}
        </Button>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('dashboard.symbolDrawer.strategyMix')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byStrategy.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{row.name}</span>
                <span className={row.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(row.pnl)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('dashboard.symbolDrawer.recentTrades', { symbol })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trades.slice(0, 8).map((trade) => (
              <div key={trade.id} className="rounded-md border p-3 text-sm">
                <div className="flex justify-between">
                  <strong>{dayKey(trade.exitTime ?? trade.entryTime)}</strong>
                  <span className={trade.netPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(trade.netPnl)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{trade.strategy ?? t('common.unassigned')} · {trade.tags.join(', ')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}

function applyChartFilter(trades: TradeRecord[], chartFilter: ChartFilter | null) {
  if (!chartFilter) return trades;

  return trades.filter((trade) => {
    if (chartFilter.kind === 'date') return dayKey(trade.exitTime ?? trade.entryTime) === chartFilter.value;
    if (chartFilter.kind === 'symbol') return trade.symbol === chartFilter.value;
    if (chartFilter.kind === 'strategy') return (trade.strategy ?? 'Unassigned') === chartFilter.value;
    if (chartFilter.kind === 'tag') return trade.tags.includes(chartFilter.value);
    if (chartFilter.kind === 'weekday') {
      return weekdayFormatter.format(new Date(trade.exitTime ?? trade.entryTime)) === chartFilter.value;
    }
    return new Date(trade.entryTime).getUTCHours() === chartFilter.value;
  });
}

function setDateFilterFromChart(
  value: unknown,
  setChartFilter: (filter: ChartFilter) => void
) {
  if (typeof value === 'string') {
    setChartFilter({ kind: 'date', value, label: value });
  }
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))'
};

const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
