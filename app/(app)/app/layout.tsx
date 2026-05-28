import type { ReactNode } from 'react';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { AppShell } from '@/components/layout/app-shell';
import { shellNamespaces } from '@/lib/i18n-namespaces';
import { getAppShellData } from '@/lib/data';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const data = await getAppShellData();
  return (
    <I18nServerProvider namespaces={shellNamespaces}>
      <AppShell data={data}>{children}</AppShell>
    </I18nServerProvider>
  );
}
