import { FeatureGate } from '@/components/billing/feature-gate';
import { GoalsWorkspace } from '@/components/workspaces/goals-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedGoalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = (isLocale(locale) ? locale : 'en') as Locale;
  const data = await getTradingData();
  const messages = await getMessages(activeLocale, workspaceNamespaces);
  return (
    <FeatureGate plan={data.user.plan} feature="goals">
      <GoalsWorkspace locale={activeLocale} messages={messages} goals={data.goals} />
    </FeatureGate>
  );
}
