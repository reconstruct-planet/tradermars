import { PlansWorkspace } from '@/components/workspaces/plans-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';

export default async function PlansPage() {
  const data = await getTradingData();
  const messages = await getMessages('en', workspaceNamespaces);
  return <PlansWorkspace messages={messages} plans={data.dailyPlans} templates={data.checklistTemplates} />;
}
