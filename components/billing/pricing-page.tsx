'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { useI18n } from '@/components/i18n-provider';
import { LanguageSelector } from '@/components/language-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getPlanPrice,
  hasFeature,
  planDefinitions,
  planOrder,
  type FeatureKey
} from '@/lib/plans';

const comparisonFeatures: FeatureKey[] = [
  'manual_trades',
  'limited_imports',
  'basic_dashboard',
  'basic_analytics',
  'multiple_accounts',
  'unlimited_imports',
  'advanced_analytics',
  'csv_import',
  'goals',
  'calendar',
  'ai_insights',
  'advanced_dashboards',
  'risk_simulator',
  'priority_features'
];

const planBullets: Record<(typeof planOrder)[number], string[]> = {
  FREE: ['1 account', 'Limited imports', 'Basic dashboard', 'Basic analytics', 'Manual trades'],
  PRO: ['Multiple accounts', 'Unlimited imports', 'Advanced analytics', 'CSV import', 'Goals and calendar'],
  ELITE: ['AI insights', 'Advanced dashboards', 'Risk simulator', 'Priority features', 'Early access workflows']
};

export function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const { locale, t } = useI18n();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.34)_52%,hsl(var(--background)))]">
      <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
        <div className="container flex h-16 items-center gap-3">
          <Brand />
          <nav className="ml-6 hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <Link href={`/${locale}#features`} className="hover:text-foreground">{t('common.features')}</Link>
            <Link href={`/${locale}/pricing`} className="text-foreground">{t('common.pricing')}</Link>
            <Link href={`/${locale}/login`} className="hover:text-foreground">{t('common.login')}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector className="hidden w-32 sm:block" />
            <ThemeToggle />
            <Button asChild>
              <Link href={`/${locale}/signup`}>{t('common.startFree')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 border-primary/15 bg-primary/10 text-primary">{t('pricing.badge')}</Badge>
            <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">{t('pricing.title')}</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-lg border bg-card/90 p-1 shadow-sm">
              {(['monthly', 'yearly'] as const).map((item) => (
                <button
                  key={item}
                  className={`h-10 rounded-md px-5 text-sm font-medium transition-colors ${billing === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setBilling(item)}
                >
                  {item === 'monthly' ? t('common.monthly') : t('common.yearly')}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {planOrder.map((planId) => {
              const plan = planDefinitions[planId];
              const price = getPlanPrice(planId, billing);
              const highlighted = planId === 'PRO';
              return (
                <Card key={planId} className={highlighted ? 'border-primary/30 shadow-xl shadow-primary/10 ring-2 ring-primary/25' : 'bg-card/90'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t(`common.${plan.name.toLowerCase()}`)}</CardTitle>
                      {highlighted ? <Badge>{t('pricing.mostPractical')}</Badge> : null}
                    </div>
                    <CardDescription>{t(`pricing.plans.${planId}`)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-semibold">${price}</span>
                      <span className="pb-2 text-sm text-muted-foreground">/mo</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {billing === 'yearly' && price > 0 ? t('pricing.yearlyNote') : t('pricing.noPayment')}
                    </p>
                    <div className="mt-6 grid gap-3">
                      {planBullets[planId].map((item) => (
                        <div key={item} className="flex items-center gap-3 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <Button asChild className="mt-7 w-full" variant={highlighted ? 'default' : 'outline'}>
                      <Link href={`/${locale}/signup`}>
                        {planId === 'FREE' ? t('common.startFree') : t('pricing.choosePlan', { plan: plan.name })}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y bg-secondary/35 py-14">
          <div className="container">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal">{t('pricing.comparison')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('pricing.comparisonDescription')}</p>
              </div>
              <Badge variant="outline">{t('pricing.stripePlaceholder')}</Badge>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card/95 shadow-sm">
              <div className="grid grid-cols-4 bg-muted px-4 py-3 text-sm font-semibold">
                <span>{t('common.feature')}</span>
                {planOrder.map((plan) => <span key={plan} className="text-center">{t(`common.${planDefinitions[plan].name.toLowerCase()}`)}</span>)}
              </div>
              {comparisonFeatures.map((feature) => (
                <div key={feature} className="grid grid-cols-4 border-t px-4 py-4 text-sm">
                  <span className="font-medium">{t(`features.${feature}`)}</span>
                  {planOrder.map((plan) => (
                    <span key={plan} className="flex justify-center">
                      {hasFeature(plan, feature) ? <Check className="h-5 w-5 text-primary" /> : <span className="text-muted-foreground">-</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container grid gap-4 py-14 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-primary" />
                {t('pricing.stripeTitle')}
              </CardTitle>
              <CardDescription>{t('pricing.stripeDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {t('pricing.noPayment')}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t('pricing.serverGateTitle')}
              </CardTitle>
              <CardDescription>{t('pricing.serverGateDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {t('pricing.comparisonDescription')}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
