import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { AppShell } from '@/components/layout/app-shell';
import { requireAppUser } from '@/lib/app-auth';
import { shellNamespaces } from '@/lib/i18n-namespaces';
import { getAppShellData } from '@/lib/data';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAppUser('/app/dashboard');
  const data = await getAppShellData();
  return (
    <I18nServerProvider namespaces={shellNamespaces}>
      <AppShell data={data}>{children}</AppShell>
    </I18nServerProvider>
  );
}
