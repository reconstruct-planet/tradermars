import { AuthForm } from '@/components/auth/auth-form';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { authNamespaces } from '@/lib/i18n-namespaces';

export default function LoginPage() {
  return (
    <I18nServerProvider namespaces={authNamespaces}>
      <AuthForm mode="login" />
    </I18nServerProvider>
  );
}
