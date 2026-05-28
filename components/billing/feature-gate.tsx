'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpgradeModal } from '@/components/billing/upgrade-modal';
import { useI18n } from '@/components/i18n-provider';
import { hasFeature, planDefinitions, requiredPlanForFeature, type FeatureKey } from '@/lib/plans';
import type { Plan } from '@/lib/types';

export function FeatureGate({
  plan,
  feature,
  children
}: {
  plan: Plan;
  feature: FeatureKey;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { locale, t } = useI18n();

  if (hasFeature(plan, feature)) return <>{children}</>;

  const requiredPlan = requiredPlanForFeature(feature);

  return (
    <>
      <Card className="mx-auto max-w-3xl border-dashed">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle>{t('gates.lockedTitle', { feature: t(`features.${feature}`), plan: planDefinitions[requiredPlan].name })}</CardTitle>
          <CardDescription>
            {t('gates.lockedDescription', { currentPlan: planDefinitions[plan].name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => setOpen(true)}>
            {t('common.view')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/pricing`}>{t('common.comparePlans')}</Link>
          </Button>
        </CardContent>
      </Card>
      <UpgradeModal open={open} onOpenChange={setOpen} feature={feature} currentPlan={plan} />
    </>
  );
}
