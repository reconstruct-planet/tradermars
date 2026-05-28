import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { authNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <I18nServerProvider locale={(isLocale(locale) ? locale : 'en') as Locale} namespaces={authNamespaces}>
      <ForgotPasswordForm />
    </I18nServerProvider>
  );
}
