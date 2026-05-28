import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getMessage, type Messages } from '@/lib/i18n-messages';
import { defaultLocale, type Locale } from '@/lib/i18n-routing';
import type { ChecklistTemplateRecord, DailyPlanRecord } from '@/lib/types';
import { formatCurrencyForLocale, formatDateForLocale } from '@/lib/utils';

export function PlansWorkspace({
  locale = defaultLocale,
  messages,
  plans,
  templates
}: {
  locale?: Locale;
  messages: Messages;
  plans: DailyPlanRecord[];
  templates: ChecklistTemplateRecord[];
}) {
  const t = (key: string, values?: Record<string, string | number>) => getMessage(messages, key, values);
  const formatCurrency = (value: number) => formatCurrencyForLocale(value, locale);
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => formatDateForLocale(date, locale, options);
  const template = templates[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('workspaces.plans.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('workspaces.plans.subtitle')}</p>
        </div>
        <Button disabled>{t('workspaces.plans.newDailyPlan')}</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('workspaces.plans.builder')}</CardTitle>
            <CardDescription>{t('workspaces.plans.builderDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="date" defaultValue="2026-05-27" />
            <Input placeholder={t('workspaces.plans.dailyMaxLoss')} />
            <Textarea placeholder={t('workspaces.plans.marketBias')} />
            <Button disabled>{t('workspaces.plans.savePlan')}</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{template?.name ?? t('workspaces.plans.checklistTemplate')}</CardTitle>
              <CardDescription>{t('workspaces.plans.reusableChecklist')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {template?.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </div>
                  {item.isRequired ? <Badge variant="secondary">{t('common.required')}</Badge> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{formatDate(plan.day)}</CardTitle>
                <CardDescription>
                  {plan.maxLoss ? t('workspaces.plans.maxLoss', { value: formatCurrency(plan.maxLoss) }) : t('workspaces.plans.noMaxLoss')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{plan.bias}</p>
                <p className="text-sm text-muted-foreground">{plan.notes}</p>
                <div className="space-y-2">
                  {template?.items.map((item) => {
                    const checked = Boolean(plan.checklistState?.[item.id]);
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {checked ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
