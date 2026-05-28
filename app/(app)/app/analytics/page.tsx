import { FeatureGate } from '@/components/billing/feature-gate';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyAnalyticsDashboard } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { analyticsNamespaces, shellNamespaces } from '@/lib/i18n-namespaces';

export default async function AnalyticsPage() {
  const data = await getTradingData();
  return (
    <I18nServerProvider namespaces={[...shellNamespaces, ...analyticsNamespaces]}>
      <FeatureGate plan={data.user.plan} feature="advanced_analytics">
        <LazyAnalyticsDashboard data={data} />
      </FeatureGate>
    </I18nServerProvider>
  );
}
