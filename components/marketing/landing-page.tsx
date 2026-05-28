'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  Goal,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  NotebookPen,
  PlayCircle,
  Repeat2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Tags,
  UploadCloud,
  Workflow,
  Zap
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { useI18n } from '@/components/i18n-provider';
import { LanguageSelector } from '@/components/language-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type NavItem = {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

type FeatureBlock = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  icon: LucideIcon;
  mockup: 'analytics' | 'table' | 'pivot' | 'ai' | 'dashboards' | 'calendar' | 'planning' | 'goals' | 'charting' | 'risk';
};

const featureTabs = [
  ['journal', NotebookPen],
  ['analytics', BarChart3],
  ['dashboards', LayoutDashboard],
  ['calendar', CalendarDays],
  ['ai', Bot],
  ['import', FileSpreadsheet],
  ['risk', ShieldCheck],
  ['simulator', Gauge]
] satisfies Array<[string, LucideIcon]>;

type Translate = ReturnType<typeof useI18n>['t'];

function getProductItems(t: Translate): NavItem[] {
  return [
    {
      label: t('landing.menu.product.journal.label'),
      description: t('landing.menu.product.journal.description'),
      icon: NotebookPen,
      href: '#journal'
    },
    {
      label: t('landing.menu.product.analytics.label'),
      description: t('landing.menu.product.analytics.description'),
      icon: BarChart3,
      href: '#analytics'
    },
    {
      label: t('landing.menu.product.import.label'),
      description: t('landing.menu.product.import.description'),
      icon: UploadCloud,
      href: '#import'
    }
  ];
}

function getFeatureItems(t: Translate): NavItem[] {
  return [
    {
      label: t('landing.menu.features.ai.label'),
      description: t('landing.menu.features.ai.description'),
      icon: Bot,
      href: '#ai'
    },
    {
      label: t('landing.menu.features.calendar.label'),
      description: t('landing.menu.features.calendar.description'),
      icon: CalendarDays,
      href: '#calendar'
    },
    {
      label: t('landing.menu.features.risk.label'),
      description: t('landing.menu.features.risk.description'),
      icon: ShieldCheck,
      href: '#risk'
    }
  ];
}

function getFeatureBlocks(t: Translate): FeatureBlock[] {
  return ([
    ['analytics', BarChart3, 'analytics'],
    ['table', Table2, 'table'],
    ['pivot', GitBranch, 'pivot'],
    ['ai', Bot, 'ai'],
    ['dashboards', LayoutDashboard, 'dashboards'],
    ['calendar', CalendarDays, 'calendar'],
    ['planning', Workflow, 'planning'],
    ['goals', Goal, 'goals'],
    ['charting', LineChart, 'charting'],
    ['risk', Gauge, 'risk']
  ] satisfies Array<[string, LucideIcon, FeatureBlock['mockup']]>).map(([key, icon, mockup]) => ({
    eyebrow: t(`landing.featureSections.${key}.eyebrow`),
    title: t(`landing.featureSections.${key}.title`),
    body: t(`landing.featureSections.${key}.body`),
    points: [0, 1, 2].map((index) => t(`landing.featureSections.${key}.points.${index}`)),
    icon,
    mockup
  }));
}

function getPricingPlans(t: Translate, billing: 'monthly' | 'yearly') {
  return [
    { name: t('common.free'), price: '$0', summary: t(`landing.pricingCards.${billing}.free`), tier: 'free' },
    { name: t('common.pro'), price: billing === 'monthly' ? '$24' : '$19', summary: t(`landing.pricingCards.${billing}.pro`), tier: 'pro' },
    { name: t('common.elite'), price: billing === 'monthly' ? '$59' : '$49', summary: t(`landing.pricingCards.${billing}.elite`), tier: 'elite' }
  ];
}

function getComparisonRows(t: Translate) {
  return ([
    ['manualEntry', true, true, true],
    ['csvReview', true, true, true],
    ['analyticsDashboard', false, true, true],
    ['localInsightEngine', false, true, true],
    ['customDashboards', false, true, true],
    ['multiAccount', false, false, true],
    ['riskSimulator', false, false, 'soon'],
    ['brokerSync', false, 'soon', 'soon']
  ] satisfies Array<[string, boolean | 'soon', boolean | 'soon', boolean | 'soon']>).map((row) => [
    t(`landing.comparison.${row[0]}`),
    row[1],
    row[2],
    row[3]
  ] as const);
}

function getFaqs(t: Translate) {
  return [0, 1, 2, 3, 4, 5].map((index) => ({
    question: t(`landing.faqs.${index}.question`),
    answer: t(`landing.faqs.${index}.answer`)
  }));
}

export function MarketingLandingPage() {
  const { t } = useI18n();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const featureBlocks = getFeatureBlocks(t);
  const plans = getPricingPlans(t, billing);

  function selectFeature(index: number) {
    setActiveFeatureIndex(index);
    document.getElementById(featureBlocks[index]?.mockup ?? 'features')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7faf7] text-[#0b1518] dark:bg-[#07161a] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(234,243,240,0.46)_46%,rgba(247,250,247,0.9)),linear-gradient(90deg,rgba(11,107,103,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(11,107,103,0.05)_1px,transparent_1px)] bg-[length:auto,72px_72px,72px_72px] dark:bg-[linear-gradient(180deg,rgba(12,34,40,0.72),rgba(7,22,26,0.96)),linear-gradient(90deg,rgba(232,248,244,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(232,248,244,0.05)_1px,transparent_1px)]" />
      <MarketingHeader />

      <main>
        <HeroSection />
        <FeatureNavigation activeIndex={activeFeatureIndex} onSelect={selectFeature} />

        <section id="features" className="container py-20">
          <SectionIntro
            eyebrow={t('landing.sectionEyebrow')}
            title={t('landing.sectionTitle')}
            body={t('landing.sectionBody')}
          />
          <div className="mt-12 space-y-20">
            {featureBlocks.map((feature, index) => (
              <FeatureSection key={feature.title} feature={feature} flipped={index % 2 === 1} />
            ))}
          </div>
        </section>

        <ImportSection />
        <PricingSection billing={billing} setBilling={setBilling} plans={plans} />
        <FaqSection />
      </main>

      <MarketingFooter />
    </div>
  );
}

function MarketingHeader() {
  const { locale, t } = useI18n();
  const productItems = getProductItems(t);
  const featureItems = getFeatureItems(t);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-[#f7faf7]/88 backdrop-blur-xl dark:border-white/10 dark:bg-[#07161a]/88">
      <div className="container flex min-h-16 items-center gap-3 py-2">
        <Brand className="shrink-0" />
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <Dropdown label={t('landing.product')} items={productItems} />
          <Dropdown label={t('common.features')} items={featureItems} />
          <NavLink href={`/${locale}/pricing`}>{t('common.pricing')}</NavLink>
          <NavLink href="#resources">{t('common.resources')}</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector className="hidden w-32 sm:block" />
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={`/${locale}/login`}>{t('common.login')}</Link>
          </Button>
          <Button asChild className="bg-[#0a3436] text-white hover:bg-[#123f42] dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200">
            <Link href={`/${locale}/signup`}>
              {t('common.startFree')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Dropdown({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="group relative">
      <button className="inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
        {label}
        <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 w-[440px] translate-y-2 rounded-lg border border-slate-900/10 bg-white p-2 opacity-0 shadow-xl transition-[opacity,transform,visibility] duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-950">
        <div className="grid gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.label} href={item.href} className="grid grid-cols-[40px_1fr] gap-3 rounded-md p-3 transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{item.description}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
      {children}
    </a>
  );
}

function HeroSection() {
  const { locale, t } = useI18n();
  return (
    <section className="container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-12 lg:grid-cols-[0.86fr_1.14fr] lg:py-16">
      <div>
        <Badge className="border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-400/10 dark:text-teal-200" variant="outline">
          {t('landing.heroBadge')}
        </Badge>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white md:text-7xl">
          {t('landing.heroTitle')}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          {t('landing.heroSubtitle')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-[#0a3436] text-white hover:bg-[#123f42] dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200">
            <Link href={`/${locale}/signup`}>
              {t('common.startFree')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-slate-300 bg-white/70 dark:border-white/15 dark:bg-white/5">
            <Link href={`/${locale}/login`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              {t('common.viewDemo')}
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['8.4k', t('landing.metricTraders')],
            ['42M', t('landing.metricTrades')],
            ['5', t('landing.metricMarkets')],
            ['36+', t('landing.metricWidgets')]
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-slate-900/10 bg-white/72 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-[linear-gradient(135deg,rgba(11,107,103,0.22),rgba(242,184,75,0.16)_48%,rgba(12,34,40,0.18))] opacity-80 blur-2xl" />
        <DashboardMockup />
      </div>
    </section>
  );
}

function FeatureNavigation({
  activeIndex,
  onSelect
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const { t } = useI18n();
  const labels = [
    t('landing.features.journal'),
    t('landing.features.analytics'),
    t('landing.features.dashboards'),
    t('landing.features.calendar'),
    t('landing.features.ai'),
    t('landing.features.import'),
    t('landing.features.risk'),
    t('landing.features.simulator')
  ];
  return (
    <section className="border-y border-slate-900/10 bg-white/70 py-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
      <div className="container">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {featureTabs.map(([key, Icon], index) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(index)}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:border-teal-300 hover:text-teal-700 dark:hover:border-teal-400/50 dark:hover:text-teal-200 ${
                activeIndex === index
                  ? 'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-400/50 dark:bg-teal-400/10 dark:text-teal-200'
                  : 'border-slate-900/10 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {labels[index] ?? key}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">{eyebrow}</Badge>
      <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

function FeatureSection({ feature, flipped }: { feature: FeatureBlock; flipped: boolean }) {
  const Icon = feature.icon;
  return (
    <section id={feature.mockup} className={`grid items-center gap-8 lg:grid-cols-2 ${flipped ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0a3436] text-white dark:bg-teal-300 dark:text-slate-950">
          <Icon className="h-6 w-6" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">{feature.eyebrow}</p>
        <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white md:text-4xl">{feature.title}</h3>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">{feature.body}</p>
        <div className="mt-6 grid gap-3">
          {feature.points.map((point) => (
            <div key={point} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-300" />
              {point}
            </div>
          ))}
        </div>
      </div>
      <FeatureMockup type={feature.mockup} />
    </section>
  );
}

function DashboardMockup() {
  const { t } = useI18n();

  return (
    <div className="relative rounded-2xl border border-slate-900/10 bg-[#07161a] p-3 shadow-2xl dark:border-white/15">
      <div className="rounded-xl border border-white/10 bg-[#0c2228] p-4 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm text-teal-200">{t('landing.mockup.desk')}</p>
            <p className="mt-1 text-xl font-semibold">{t('landing.mockup.review')}</p>
          </div>
          <div className="hidden items-center gap-2 rounded-md bg-white/8 px-3 py-2 text-sm text-slate-300 sm:flex">
            <Search className="h-4 w-4" />
            {t('nav.searchPlaceholder')}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [t('dashboard.kpis.netPnl'), '+$8,420', 'text-teal-300'],
            [t('dashboard.kpis.winRate'), '61.8%', 'text-white'],
            [t('dashboard.kpis.maxDrawdown'), '$1,040', 'text-amber-200']
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t('dashboard.charts.equityCurve')}</p>
              <Badge className="bg-teal-300 text-slate-950">+14.2%</Badge>
            </div>
            <div className="mt-5 flex h-52 items-end gap-2">
              {[28, 35, 31, 46, 42, 58, 54, 68, 64, 75, 82, 78, 88, 94].map((height, index) => (
                <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-teal-500 to-amber-200" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {[
              [t('landing.mockup.bestSymbol'), 'NVDA', '+$2,140'],
              [t('landing.mockup.weakTag'), t('landing.mockup.chase'), '-$690'],
              [t('landing.mockup.bestDay'), t('landing.mockup.tuesday'), t('landing.mockup.winRateValue')]
            ].map(([label, value, meta]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <strong>{value}</strong>
                  <span className="text-sm text-teal-200">{meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
          <div className="grid grid-cols-4 bg-white/[0.06] px-3 py-2 text-xs uppercase text-slate-400">
            <span>{t('trades.columnsMap.symbol')}</span><span>{t('trades.columnsMap.setup')}</span><span>{t('trades.columnsMap.tags')}</span><span className="text-right">{t('trades.columnsMap.netPnl')}</span>
          </div>
          {[
            ['AAPL', t('landing.mockup.openingRange'), t('landing.mockup.aPlusSetup'), '+$379'],
            ['ES', t('landing.mockup.trendContinuation'), t('landing.mockup.patience'), '+$566'],
            ['TSLA', t('landing.mockup.newsBreak'), t('landing.mockup.chase'), '-$239']
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-4 border-t border-white/10 px-3 py-3 text-sm">
              <span>{row[0]}</span><span className="text-slate-300">{row[1]}</span><span className="text-slate-300">{row[2]}</span><span className={`text-right ${row[3].startsWith('+') ? 'text-teal-300' : 'text-rose-300'}`}>{row[3]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureMockup({ type }: { type: FeatureBlock['mockup'] }) {
  const map: Record<FeatureBlock['mockup'], React.ReactNode> = {
    analytics: <AnalyticsMockup />,
    table: <TableMockup />,
    pivot: <PivotMockup />,
    ai: <AiMockup />,
    dashboards: <DashboardBuilderMockup />,
    calendar: <CalendarMockup />,
    planning: <PlanningMockup />,
    goals: <GoalsMockup />,
    charting: <ChartingMockup />,
    risk: <RiskMockup />
  };

  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-950">
      {map[type]}
    </div>
  );
}

function AnalyticsMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <MockHeader title={t('analytics.title')} icon={BarChart3} />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          `${t('dashboard.kpis.profitFactor')} 2.36`,
          `${t('dashboard.kpis.averageR')} 0.42`,
          `${t('dashboard.kpis.winRate')} 61%`
        ].map((item) => (
          <div key={item} className="rounded-lg border bg-slate-50 p-3 text-sm font-medium dark:border-white/10 dark:bg-white/[0.04]">{item}</div>
        ))}
      </div>
      <MiniBars values={[42, 48, 31, 62, 58, 72, 67, 78, 84, 81]} />
    </div>
  );
}

function TableMockup() {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-lg border dark:border-white/10">
      <div className="grid grid-cols-5 bg-slate-100 px-3 py-2 text-xs font-medium uppercase text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
        <span>{t('trades.columnsMap.symbol')}</span><span>{t('trades.columnsMap.side')}</span><span>{t('trades.columnsMap.strategy')}</span><span>{t('trades.columnsMap.tags')}</span><span className="text-right">{t('common.net')}</span>
      </div>
      {[
        ['NVDA', t('trades.dialog.short'), t('landing.mockup.vwapFade'), t('landing.mockup.patience'), '+$458'],
        ['QQQ', t('trades.dialog.long'), t('landing.mockup.gapContinuation'), t('landing.mockup.oversized'), '-$472'],
        ['BTC', t('trades.dialog.short'), t('landing.mockup.macroLevel'), t('landing.mockup.liquidity'), '+$253'],
        ['MSFT', t('trades.dialog.long'), t('landing.mockup.pullback'), t('landing.mockup.aPlusSetup'), '+$227']
      ].map((row) => (
        <div key={row[0]} className="grid grid-cols-5 border-t px-3 py-3 text-sm dark:border-white/10">
          <strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span className={`text-right font-medium ${row[4].startsWith('+') ? 'text-teal-600 dark:text-teal-300' : 'text-rose-600 dark:text-rose-300'}`}>{row[4]}</span>
        </div>
      ))}
    </div>
  );
}

function PivotMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <MockHeader title={t('analytics.performanceByStrategy')} icon={GitBranch} />
      {[
        [t('landing.mockup.openingRange'), '+$1,405', t('landing.mockup.winRate68'), 86],
        [t('landing.mockup.vwapFade'), '+$611', t('landing.mockup.winRate54'), 58],
        [t('landing.mockup.reversal'), '-$919', t('landing.mockup.winRate22'), 26]
      ].map(([name, pnl, win, width]) => (
        <div key={name} className="rounded-lg border p-3 dark:border-white/10">
          <div className="flex justify-between text-sm"><strong>{name}</strong><span>{pnl} · {win}</span></div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-amber-300" style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AiMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <MockHeader title={t('insights.askTitle')} icon={Bot} />
      <div className="rounded-lg border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
        {t('landing.mockup.aiQuestion')}
      </div>
      <div className="rounded-lg bg-[#0a3436] p-4 text-sm text-white dark:bg-teal-300 dark:text-slate-950">
        {t('landing.mockup.aiAnswer')}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[t('landing.mockup.citesMetrics'), t('landing.mockup.localEngine'), t('landing.mockup.llmReady')].map((item) => (
          <div key={item} className="rounded-md border p-2 text-center dark:border-white/10">{item}</div>
        ))}
      </div>
    </div>
  );
}

function DashboardBuilderMockup() {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {([
        [t('landing.mockup.kpiCard'), CircleDollarSign],
        [t('dashboard.charts.equityCurve'), LineChart],
        [t('landing.mockup.tradeTable'), Table2],
        [t('nav.calendar'), CalendarDays],
        [t('landing.mockup.tagSummary'), Tags],
        [t('landing.mockup.goalStatus'), Goal]
      ] satisfies Array<[string, LucideIcon]>).map(([label, Icon]) => (
        <div key={String(label)} className="flex min-h-28 flex-col justify-between rounded-lg border bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <Icon className="h-5 w-5 text-teal-600 dark:text-teal-300" />
          <strong className="text-sm">{label}</strong>
        </div>
      ))}
    </div>
  );
}

function CalendarMockup() {
  return (
    <div className="grid grid-cols-7 gap-2 text-xs">
      {Array.from({ length: 28 }).map((_, index) => {
        const hot = index % 6 === 0;
        const good = index % 4 === 0;
        return (
          <div key={index} className={`min-h-16 rounded-md border p-2 dark:border-white/10 ${hot ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200' : good ? 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200' : 'bg-slate-50 dark:bg-white/[0.03]'}`}>
            <span>{index + 1}</span>
            {hot || good ? <strong className="mt-2 block">{hot ? '-$240' : '+$458'}</strong> : null}
          </div>
        );
      })}
    </div>
  );
}

function PlanningMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <MockHeader title={t('workspaces.plans.title')} icon={Workflow} />
      {[t('landing.mockup.macroReviewed'), t('landing.mockup.keyLevels'), t('landing.mockup.maxLossSet'), t('landing.mockup.waitConfirmation')].map((item, index) => (
        <div key={item} className="flex items-center gap-3 rounded-lg border p-3 text-sm dark:border-white/10">
          {index < 3 ? <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-300" /> : <Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />}
          {item}
        </div>
      ))}
    </div>
  );
}

function GoalsMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      {[
        [t('landing.mockup.monthlyNetPnl'), '$2,508 / $5,000', 50],
        [t('dashboard.kpis.maxDrawdown'), '$1,017 / $1,600', 64],
        [t('landing.mockup.minimumWinRate'), '60% / 55%', 100]
      ].map(([label, meta, width]) => (
        <div key={label} className="rounded-lg border p-4 dark:border-white/10">
          <div className="flex justify-between text-sm"><strong>{label}</strong><span className="text-slate-500 dark:text-slate-400">{meta}</span></div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-2 rounded-full bg-teal-500" style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartingMockup() {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-dashed p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <MockHeader title={t('calendar.screenshots')} icon={LineChart} />
        <Badge variant="secondary">{t('common.comingSoon')}</Badge>
      </div>
      <div className="mt-5 h-56 rounded-md bg-slate-50 p-4 dark:bg-white/[0.04]">
        <svg viewBox="0 0 420 180" className="h-full w-full">
          <path d="M10 130 C60 118, 82 82, 128 92 S198 132, 244 92 S326 44, 410 62" fill="none" stroke="currentColor" strokeWidth="5" className="text-teal-500" />
          <circle cx="130" cy="92" r="8" className="fill-amber-400" />
          <circle cx="326" cy="50" r="8" className="fill-rose-400" />
        </svg>
      </div>
    </div>
  );
}

function RiskMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <MockHeader title={t('features.risk_simulator')} icon={Gauge} />
      {[
        [t('landing.mockup.accountRisk'), '0.75%'],
        [t('landing.mockup.stopDistance'), '$1.42'],
        [t('landing.mockup.positionSize'), t('landing.mockup.positionSizeValue')]
      ].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between rounded-lg border p-3 text-sm dark:border-white/10">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
        {t('landing.mockup.scenarioPlaceholder')}
      </div>
    </div>
  );
}

function ImportSection() {
  const { t } = useI18n();
  return (
    <section id="import" className="border-y border-slate-900/10 bg-[#eaf4f2] py-20 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="container grid items-center gap-10 lg:grid-cols-[0.86fr_1.14fr]">
        <div>
          <Badge className="bg-white text-teal-800 dark:bg-teal-400/10 dark:text-teal-200" variant="secondary">{t('nav.importCenter')}</Badge>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white md:text-5xl">
            {t('landing.importTitle')}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            {t('landing.importBody')}
          </p>
          <div className="mt-6 grid gap-3">
            {([
              [t('landing.importBullets.manualCsv'), FileSpreadsheet],
              [t('landing.importBullets.brokerPlaceholders'), Database],
              [t('landing.importBullets.liveSyncPlanned'), Repeat2]
            ] satisfies Array<[string, LucideIcon]>).map(([label, Icon]) => (
              <div key={String(label)} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" />
                {label}
              </div>
            ))}
          </div>
        </div>
        <ImportMockup />
      </div>
    </section>
  );
}

function ImportMockup() {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-slate-950">
      <MockHeader title={t('importCenter.title')} icon={UploadCloud} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[t('landing.mockup.upload'), t('landing.mockup.mapColumns'), t('landing.mockup.validate')].map((step, index) => (
          <div key={step} className="rounded-lg border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('landing.mockup.step', { step: index + 1 })}</span>
            <strong className="mt-1 block">{step}</strong>
          </div>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border dark:border-white/10">
        <div className="grid grid-cols-3 bg-slate-100 px-3 py-2 text-xs uppercase text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
          <span>{t('landing.mockup.csvHeader')}</span><span>{t('landing.mockup.tradeharborField')}</span><span>{t('common.status')}</span>
        </div>
        {[
          [t('landing.mockup.ticker'), 'symbol', t('landing.mockup.mapped')],
          [t('landing.mockup.realizedPnl'), 'netPnl', t('landing.mockup.mapped')],
          [t('trades.columnsMap.notes'), t('landing.mockup.journalNote'), t('common.optional')],
          [t('landing.mockup.unknownFeeText'), 'fees', t('landing.mockup.rejectedReason')]
        ].map((row, index) => (
          <div key={row[0]} className="grid grid-cols-3 border-t px-3 py-3 text-sm dark:border-white/10">
            <span>{row[0]}</span><span>{row[1]}</span><span className={index === 3 ? 'text-rose-600 dark:text-rose-300' : 'text-teal-600 dark:text-teal-300'}>{row[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingSection({
  billing,
  setBilling,
  plans
}: {
  billing: 'monthly' | 'yearly';
  setBilling: (value: 'monthly' | 'yearly') => void;
  plans: Array<{ name: string; price: string; summary: string; tier: string }>;
}) {
  const { locale, t } = useI18n();
  const comparison = getComparisonRows(t);

  return (
    <section id="pricing" className="container py-20">
      <SectionIntro
        eyebrow={t('common.pricing')}
        title={t('landing.pricingTitle')}
        body={t('pricing.subtitle')}
      />
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-slate-900/10 bg-white p-1 dark:border-white/10 dark:bg-slate-950">
          {(['monthly', 'yearly'] as const).map((item) => (
            <button
              key={item}
              className={`h-10 rounded-md px-5 text-sm font-medium transition-colors ${billing === item ? 'bg-[#0a3436] text-white dark:bg-teal-300 dark:text-slate-950' : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}
              onClick={() => setBilling(item)}
            >
              {item === 'monthly' ? t('common.monthly') : t('common.yearly')}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-slate-950 ${index === 1 ? 'shadow-2xl shadow-teal-900/10 ring-2 ring-teal-500/40' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {index === 1 ? <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">{t('pricing.mostPractical')}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-semibold">{plan.price}</p>
                <span className="pb-2 text-sm text-slate-500 dark:text-slate-400">{t('landing.perMonth')}</span>
              </div>
              <p className="mt-4 min-h-12 text-sm text-slate-600 dark:text-slate-300">{plan.summary}</p>
              <Button asChild className={`mt-6 w-full ${index === 1 ? 'bg-[#0a3436] text-white hover:bg-[#123f42] dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200' : ''}`} variant={index === 1 ? 'default' : 'outline'}>
                <Link href={`/${locale}/signup`}>{plan.tier === 'free' ? t('common.startFree') : t('pricing.choosePlan', { plan: plan.name })}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 overflow-hidden rounded-xl border border-slate-900/10 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="grid grid-cols-4 bg-slate-100 px-4 py-3 text-sm font-semibold dark:bg-white/[0.05]">
          <span>{t('common.feature')}</span><span className="text-center">{t('common.free')}</span><span className="text-center">{t('common.pro')}</span><span className="text-center">{t('common.elite')}</span>
        </div>
        {comparison.map((row) => (
          <div key={row[0]} className="grid grid-cols-4 border-t px-4 py-4 text-sm dark:border-white/10">
            <span className="font-medium">{row[0]}</span>
            {[row[1], row[2], row[3]].map((value, index) => (
              <span key={index} className="flex justify-center">
                {value === true ? <Check className="h-5 w-5 text-teal-600 dark:text-teal-300" /> : value === false ? <span className="text-slate-300 dark:text-slate-700">—</span> : <Badge variant="secondary">{t('common.soon')}</Badge>}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const { t } = useI18n();
  const faqs = getFaqs(t);

  return (
    <section id="resources" className="border-t border-slate-900/10 py-20 dark:border-white/10">
      <div id="faq" className="container">
          <SectionIntro
            eyebrow="FAQ"
            title={t('landing.faqTitle')}
            body={t('landing.faqBody')}
          />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question} className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-slate-950">
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-base">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">{faq.answer}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketingFooter() {
  const { t } = useI18n();
  const footerGroups = [
    {
      title: t('landing.footer.product'),
      links: [t('landing.footer.journal'), t('landing.footer.analytics'), t('landing.footer.calendar'), t('landing.footer.importCenter')]
    },
    {
      title: t('landing.footer.resources'),
      links: [t('landing.footer.demoWorkspace'), t('landing.footer.sampleCsv'), t('landing.footer.setupGuide'), t('landing.footer.securityNotes')]
    },
    {
      title: t('landing.footer.company'),
      links: [t('common.pricing'), t('landing.footer.roadmap'), t('landing.footer.contact'), t('landing.footer.notAdvice')]
    }
  ];

  return (
    <footer className="border-t border-slate-900/10 bg-[#07161a] py-12 text-slate-300 dark:border-white/10">
      <div className="container grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <Brand className="text-white" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            {t('landing.footerDescription')}
          </p>
        </div>
        {footerGroups.map(({ title, links }) => (
          <div key={title}>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <div className="mt-3 grid gap-2 text-sm">
              {links.map((link) => <a key={link} href="#" className="text-slate-400 hover:text-white">{link}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div className="container mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row md:items-center">
        <p>{t('landing.mockup.copyright')}</p>
        <p className="md:ml-auto">{t('landing.footerNote')}</p>
      </div>
    </footer>
  );
}

function MockHeader({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
        <Icon className="h-5 w-5" />
      </span>
      <strong>{title}</strong>
    </div>
  );
}

function MiniBars({ values }: { values: number[] }) {
  return (
    <div className="flex h-56 items-end gap-2 rounded-lg border bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t ${index % 4 === 0 ? 'bg-amber-400' : value < 40 ? 'bg-rose-400' : 'bg-teal-500'}`} style={{ height: `${value}%` }} />
      ))}
    </div>
  );
}

