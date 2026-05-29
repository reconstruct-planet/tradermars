import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { AppShell } from '@/components/layout/app-shell';
import { requireAppUser } from '@/lib/app-auth';
import { getAppShellData } from '@/lib/data';
import { shellNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function LocalizedProtectedLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : 'en';
  await requireAppUser(`/${activeLocale}/dashboard`);
  const data = await getAppShellData();
  return (
    <I18nServerProvider locale={activeLocale as Locale} namespaces={shellNamespaces}>
      <AppShell data={data}>{children}</AppShell>
    </I18nServerProvider>
  );
}
