import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getMessage, type Messages } from '@/lib/i18n-messages';
import type { TradingData } from '@/lib/types';

export function SettingsWorkspace({ data, messages }: { data: TradingData; messages: Messages }) {
  const t = (key: string, values?: Record<string, string | number>) => getMessage(messages, key, values);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
            <CardDescription>{t('settings.profileDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input defaultValue={data.user.name} />
            <Input defaultValue={data.user.email} />
            <Select defaultValue={data.user.timezone}>
              <option>America/New_York</option>
              <option>America/Chicago</option>
              <option>Europe/London</option>
              <option>Asia/Seoul</option>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.tradingAccount')}</CardTitle>
            <CardDescription>{t('settings.tradingAccountDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input defaultValue={data.account.name} />
            <Input defaultValue={data.account.broker ?? ''} />
            <Input defaultValue={data.account.baseCurrency} />
            <Input defaultValue={String(data.account.startingBalance)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.importDefaults')}</CardTitle>
            <CardDescription>{t('settings.importDefaultsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select defaultValue="manual">
              <option value="manual">{t('settings.manualCsv')}</option>
              <option value="generic">{t('settings.genericBroker')}</option>
            </Select>
            <Input placeholder={t('settings.defaultSession')} defaultValue="New York AM" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.dataPrivacy')}</CardTitle>
            <CardDescription>{t('settings.dataPrivacyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t('settings.privacyNote')}</p>
            <p>{t('settings.importAudit')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
