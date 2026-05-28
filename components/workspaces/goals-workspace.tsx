import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getMessage, type Messages } from '@/lib/i18n-messages';
import { defaultLocale, type Locale } from '@/lib/i18n-routing';
import type { GoalRecord } from '@/lib/types';
import { formatCurrencyForLocale, formatDateForLocale, formatPercentForLocale } from '@/lib/utils';

export function GoalsWorkspace({ locale = defaultLocale, messages, goals }: { locale?: Locale; messages: Messages; goals: GoalRecord[] }) {
  const t = (key: string, values?: Record<string, string | number>) => getMessage(messages, key, values);
  const formatCurrency = (value: number) => formatCurrencyForLocale(value, locale);
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => formatDateForLocale(date, locale, options);
  const formatPercent = (value: number) => formatPercentForLocale(value, locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('workspaces.goals.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('workspaces.goals.subtitle')}</p>
        </div>
        <Button disabled>{t('workspaces.goals.createGoal')}</Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <Select defaultValue="MONTHLY_PNL">
            <option>MONTHLY_PNL</option>
            <option>MAX_DRAWDOWN</option>
            <option>MIN_WIN_RATE</option>
            <option>DAILY_MAX_LOSS</option>
          </Select>
          <Input placeholder={t('workspaces.goals.goalName')} />
          <Input placeholder={t('workspaces.goals.targetValue')} />
          <Input type="date" />
          <Button disabled>{t('workspaces.goals.saveGoal')}</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <Badge variant={goal.isActive ? 'positive' : 'secondary'}>{goal.isActive ? t('common.active') : t('common.paused')}</Badge>
                </div>
                <CardTitle>{goal.name}</CardTitle>
                <CardDescription>
                  {formatDate(goal.periodStart)} {t('common.to')} {formatDate(goal.periodEnd)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.current')}</span>
                  <strong>{formatGoalValue(goal.type, goal.currentValue, formatCurrency, formatPercent)}</strong>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.target')}</span>
                  <strong>{formatGoalValue(goal.type, goal.targetValue, formatCurrency, formatPercent)}</strong>
                </div>
                <div className="mt-4 h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t('workspaces.goals.ofTarget', { progress })}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function formatGoalValue(
  type: GoalRecord['type'],
  value: number,
  formatCurrency: (amount: number) => string,
  formatPercent: (amount: number) => string
) {
  return type === 'MIN_WIN_RATE' ? formatPercent(value / 100) : formatCurrency(value);
}
