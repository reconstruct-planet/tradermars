import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { authNamespaces } from '@/lib/i18n-namespaces';

export default function ForgotPasswordPage() {
  return (
    <I18nServerProvider namespaces={authNamespaces}>
      <ForgotPasswordForm />
    </I18nServerProvider>
  );
}
