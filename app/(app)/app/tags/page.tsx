import { TagsWorkspace } from '@/components/workspaces/tags-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';

export default async function TagsPage() {
  const data = await getTradingData();
  const messages = await getMessages('en', workspaceNamespaces);
  return <TagsWorkspace messages={messages} tags={data.tags} />;
}
