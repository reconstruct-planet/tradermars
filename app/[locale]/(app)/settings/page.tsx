import { SettingsWorkspace } from '@/components/workspaces/settings-workspace';
import { getTradingData } from '@/lib/data';
import { getMessages } from '@/lib/i18n';
import { workspaceNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = (isLocale(locale) ? locale : 'en') as Locale;
  const data = await getTradingData();
  const messages = await getMessages(activeLocale, workspaceNamespaces);
  return <SettingsWorkspace data={data} messages={messages} />;
}
