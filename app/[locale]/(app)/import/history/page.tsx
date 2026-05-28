import Link from 'next/link';
import { FeatureGate } from '@/components/billing/feature-gate';
import { ImportHistory } from '@/components/import/import-history';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { Button } from '@/components/ui/button';
import { getTradingData } from '@/lib/data';
import { getMessages, getMessage } from '@/lib/i18n';
import { importNamespaces, shellNamespaces } from '@/lib/i18n-namespaces';
import { getImportHistory } from '@/lib/import-history';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedImportHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : 'en';
  const dictionary = await getMessages(activeLocale as Locale, importNamespaces);
  const t = (key: string) => getMessage(dictionary, key);
  const data = await getTradingData();
  const history = await getImportHistory();

  return (
    <I18nServerProvider locale={activeLocale as Locale} namespaces={[...shellNamespaces, ...importNamespaces]}>
      <FeatureGate plan={data.user.plan} feature="csv_import">
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">{t('importCenter.historyTitle')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('importCenter.historySubtitle')}</p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/${activeLocale}/import`}>{t('importCenter.backToWorkflow')}</Link>
            </Button>
          </div>
          <ImportHistory history={history} />
        </div>
      </FeatureGate>
    </I18nServerProvider>
  );
}
