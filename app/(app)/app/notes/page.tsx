import { NotesWorkspace } from '@/components/workspaces/notes-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';

export default async function NotesPage() {
  const data = await getTradingData();
  const messages = await getMessages('en', workspaceNamespaces);
  return <NotesWorkspace messages={messages} notes={data.notes} />;
}
