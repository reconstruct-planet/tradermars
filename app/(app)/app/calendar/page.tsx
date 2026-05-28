import { FeatureGate } from '@/components/billing/feature-gate';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { LazyTradingCalendar } from '@/components/lazy-workspaces';
import { getTradingData } from '@/lib/data';
import { calendarNamespaces, shellNamespaces } from '@/lib/i18n-namespaces';

export default async function CalendarPage() {
  const data = await getTradingData();
  return (
    <I18nServerProvider namespaces={[...shellNamespaces, ...calendarNamespaces]}>
      <FeatureGate plan={data.user.plan} feature="calendar">
        <LazyTradingCalendar trades={data.trades} notes={data.notes} dailyPlans={data.dailyPlans} />
      </FeatureGate>
    </I18nServerProvider>
  );
}
