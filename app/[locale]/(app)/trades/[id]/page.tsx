import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTradingData } from '@/lib/data';
import { getMessages, getMessage } from '@/lib/i18n';
import { tradesNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';
import { formatCurrencyForLocale, formatDateForLocale, formatNumberForLocale } from '@/lib/utils';

export default async function LocalizedTradeDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const activeLocale = (isLocale(locale) ? locale : 'en') as Locale;
  const data = await getTradingData();
  const trade = data.trades.find((item) => item.id === id);
  const dictionary = await getMessages(activeLocale, tradesNamespaces);
  const t = (key: string) => getMessage(dictionary, key);
  const label = (value: string | null | undefined) => translateTradeValue(t, value);

  if (!trade) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{trade.symbol}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {label(trade.strategy) ?? t('common.unassigned')} · {formatDateForLocale(trade.entryTime, activeLocale, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${activeLocale}/trades`}>{t('nav.trades')}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title={t('trades.columnsMap.netPnl')} value={formatCurrencyForLocale(trade.netPnl, activeLocale)} tone={trade.netPnl >= 0 ? 'positive' : 'negative'} />
        <Metric title={t('trades.columnsMap.r')} value={formatNumberForLocale(trade.rMultiple, activeLocale)} />
        <Metric title={t('trades.dialog.quantity')} value={formatNumberForLocale(trade.quantity, activeLocale, 2)} />
        <Metric title={t('trades.columnsMap.fees')} value={formatCurrencyForLocale(trade.fees, activeLocale)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('trades.columnsMap.entry')} / {t('trades.columnsMap.exit')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label={t('trades.columnsMap.asset')} value={label(trade.assetType) ?? trade.assetType} />
            <Row label={t('trades.columnsMap.side')} value={label(trade.side) ?? trade.side} />
            <Row label={t('trades.columnsMap.entry')} value={`${formatNumberForLocale(trade.entryPrice, activeLocale, 2)} · ${formatDateForLocale(trade.entryTime, activeLocale, { dateStyle: 'short', timeStyle: 'short' })}`} />
            <Row label={t('trades.columnsMap.exit')} value={trade.exitPrice ? `${formatNumberForLocale(trade.exitPrice, activeLocale, 2)} · ${formatDateForLocale(trade.exitTime ?? trade.entryTime, activeLocale, { dateStyle: 'short', timeStyle: 'short' })}` : t('common.open')} />
            <Row label={t('trades.columnsMap.session')} value={label(trade.session) ?? t('common.unassigned')} />
            <Row label={t('trades.columnsMap.setup')} value={label(trade.setup) ?? t('common.unassigned')} />
            <Row label={t('trades.columnsMap.mistake')} value={label(trade.mistake) ?? t('common.none')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('trades.columnsMap.notes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {trade.tags.map((tag) => <Badge key={tag} variant="outline">{label(tag) ?? tag}</Badge>)}
            </div>
            <p className="min-h-40 rounded-md border bg-background p-4 text-sm text-muted-foreground">
              {trade.notes ?? t('calendar.noNotes')}
            </p>
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('calendar.screenshots')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
        <p className={`mt-3 text-2xl font-semibold ${tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function translateTradeValue(t: (key: string) => string, value: string | null | undefined) {
  if (!value) return undefined;
  const key = `trades.valueLabels.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}
