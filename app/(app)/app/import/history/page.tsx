import Link from 'next/link';
import { FeatureGate } from '@/components/billing/feature-gate';
import { ImportHistory } from '@/components/import/import-history';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { Button } from '@/components/ui/button';
import { getTradingData } from '@/lib/data';
import { getMessages, getMessage } from '@/lib/i18n';
import { importNamespaces, shellNamespaces } from '@/lib/i18n-namespaces';
import { getImportHistory } from '@/lib/import-history';

export default async function ImportHistoryPage() {
  const data = await getTradingData();
  const history = await getImportHistory();
  const dictionary = await getMessages('en', importNamespaces);
  const t = (key: string) => getMessage(dictionary, key);

  return (
    <I18nServerProvider namespaces={[...shellNamespaces, ...importNamespaces]}>
      <FeatureGate plan={data.user.plan} feature="csv_import">
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">{t('importCenter.historyTitle')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('importCenter.historySubtitle')}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app/import">{t('importCenter.backToWorkflow')}</Link>
            </Button>
          </div>
          <ImportHistory history={history} />
        </div>
      </FeatureGate>
    </I18nServerProvider>
  );
}
