import { SettingsWorkspace } from '@/components/workspaces/settings-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';

export default async function SettingsPage() {
  const data = await getTradingData();
  const messages = await getMessages('en', workspaceNamespaces);
  return <SettingsWorkspace data={data} messages={messages} />;
}
