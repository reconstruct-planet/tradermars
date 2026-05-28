import type { ReactNode } from 'react';
import { I18nProvider } from '@/components/i18n-provider';
import { getMessages, type MessageNamespace } from '@/lib/i18n';
import { defaultLocale, type Locale } from '@/lib/i18n-routing';

export async function I18nServerProvider({
  children,
  locale = defaultLocale,
  namespaces
}: {
  children: ReactNode;
  locale?: Locale;
  namespaces: readonly MessageNamespace[];
}) {
  const messages = await getMessages(locale, namespaces);
  return (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}
