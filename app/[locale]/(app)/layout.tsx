import type { ReactNode } from 'react';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { AppShell } from '@/components/layout/app-shell';
import { getAppShellData } from '@/lib/data';
import { shellNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedProtectedLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : 'en';
  const data = await getAppShellData();
  return (
    <I18nServerProvider locale={activeLocale as Locale} namespaces={shellNamespaces}>
      <AppShell data={data}>{children}</AppShell>
    </I18nServerProvider>
  );
}
