import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyTradesTable } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { tradesNamespaces } from '@/lib/i18n-namespaces';

export default async function TradesPage() {
  const data = await getTradingData();
  return (
    <I18nServerProvider namespaces={tradesNamespaces}>
      <LazyTradesTable trades={data.trades} notes={data.notes} />
    </I18nServerProvider>
  );
}
