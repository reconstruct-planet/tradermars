import type { Metadata } from 'next';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { PricingPage } from '@/components/billing/pricing-page';
import { getMessages } from '@/lib/i18n';
import { pricingNamespaces } from '@/lib/i18n-namespaces';
import { isLocale, locales, type Locale } from '@/lib/i18n-routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = await getMessages(locale, ['common', 'pricing']);
  return {
    title: {
      absolute: `${dictionary.common?.pricing} | ${dictionary.common?.productName ?? 'TradeHarbor'}`
    },
    description: dictionary.pricing?.subtitle,
    alternates: {
      languages: Object.fromEntries(locales.map((item) => [item, `/${item}/pricing`]))
    }
  };
}

export default async function LocalizedPricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <I18nServerProvider locale={(isLocale(locale) ? locale : 'en') as Locale} namespaces={pricingNamespaces}>
      <PricingPage />
    </I18nServerProvider>
  );
}
