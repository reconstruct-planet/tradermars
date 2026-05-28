import { FeatureGate } from '@/components/billing/feature-gate';
import { GoalsWorkspace } from '@/components/workspaces/goals-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';

export default async function GoalsPage() {
  const data = await getTradingData();
  const messages = await getMessages('en', workspaceNamespaces);
  return (
    <FeatureGate plan={data.user.plan} feature="goals">
      <GoalsWorkspace messages={messages} goals={data.goals} />
    </FeatureGate>
  );
}
