import { FeatureGate } from '@/components/billing/feature-gate';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyImportCenter } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { importNamespaces, shellNamespaces } from '@/lib/i18n-namespaces';
import { getImportHistory } from '@/lib/import-history';

export default async function ImportPage() {
  const data = await getTradingData();
  const history = await getImportHistory();
  return (
    <I18nServerProvider namespaces={[...shellNamespaces, ...importNamespaces]}>
      <FeatureGate plan={data.user.plan} feature="csv_import">
        <LazyImportCenter history={history} />
      </FeatureGate>
    </I18nServerProvider>
  );
}
