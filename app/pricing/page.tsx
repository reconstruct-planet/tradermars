import { I18nServerProvider } from '@/components/i18n-server-provider';
import { PricingPage } from '@/components/billing/pricing-page';
import { pricingNamespaces } from '@/lib/i18n-namespaces';

export default function Pricing() {
  return (
    <I18nServerProvider namespaces={pricingNamespaces}>
      <PricingPage />
    </I18nServerProvider>
  );
}
