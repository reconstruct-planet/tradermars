import { I18nServerProvider } from '@/components/i18n-server-provider';
import { MarketingLandingPage } from '@/components/marketing/landing-page';
import { landingNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, type Locale } from '@/lib/i18n-routing';

export default async function LocalizedLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <I18nServerProvider locale={(isLocale(locale) ? locale : 'en') as Locale} namespaces={landingNamespaces}>
      <MarketingLandingPage />
    </I18nServerProvider>
  );
}
