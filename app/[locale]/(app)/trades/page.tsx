import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyTradesTable } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { tradesNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedTradesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getTradingData();
  return (
    <I18nServerProvider locale={(isLocale(locale) ? locale : 'en') as Locale} namespaces={tradesNamespaces}>
      <LazyTradesTable trades={data.trades} notes={data.notes} />
    </I18nServerProvider>
  );
}
