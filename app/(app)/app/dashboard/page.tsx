import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyDashboardWorkstation } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { dashboardNamespaces } from '@/lib/i18n-namespaces';

export default async function DashboardPage() {
  const data = await getTradingData();
  return (
    <I18nServerProvider namespaces={dashboardNamespaces}>
      <LazyDashboardWorkstation data={data} />
    </I18nServerProvider>
  );
}
