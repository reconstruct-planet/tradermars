import { FeatureGate } from '@/components/billing/feature-gate';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyInsightConsole } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { insightsNamespaces, shellNamespaces } from '@/lib/i18n-namespaces';

export default async function InsightsPage() {
  const data = await getTradingData();
  return (
    <I18nServerProvider namespaces={[...shellNamespaces, ...insightsNamespaces]}>
      <FeatureGate plan={data.user.plan} feature="ai_insights">
        <LazyInsightConsole trades={data.trades} />
      </FeatureGate>
    </I18nServerProvider>
  );
}
