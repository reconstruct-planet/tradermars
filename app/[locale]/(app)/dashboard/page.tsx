import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyDashboardWorkstation } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { dashboardNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getTradingData();
  return (
    <I18nServerProvider locale={(isLocale(locale) ? locale : 'en') as Locale} namespaces={dashboardNamespaces}>
      <LazyDashboardWorkstation data={data} />
    </I18nServerProvider>
  );
}
