'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, Sparkles, X } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { planDefinitions, requiredPlanForFeature, type FeatureKey } from '@/lib/plans';
import type { Plan } from '@/lib/types';

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  currentPlan
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: FeatureKey;
  currentPlan: Plan;
}) {
  const { locale, t } = useI18n();
  if (!open) return null;

  const requiredPlan = requiredPlanForFeature(feature);
  const plan = planDefinitions[requiredPlan];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-5">
          <p className="text-sm font-medium text-primary">{t(`features.${feature}`)}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">{t('gates.upgradeTitle', { plan: plan.name })}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('gates.lockedDescription', { currentPlan: planDefinitions[currentPlan].name })}
          </p>
        </div>
        <div className="mt-5 rounded-md border bg-secondary/60 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('gates.billingPlaceholder')}
          </div>
          <p className="mt-2 text-muted-foreground">
            {t('gates.stripeCopy')}
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.maybeLater')}</Button>
          <Button asChild>
            <Link href={`/${locale}/pricing`}>
              {t('common.viewPlans')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
