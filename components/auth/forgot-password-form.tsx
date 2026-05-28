'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/brand';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ForgotPasswordForm() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const localized = pathname.startsWith(`/${locale}`);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.42))] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/0.06)_1px,transparent_1px),linear-gradient(180deg,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[length:72px_72px]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand className="text-xl" />
        </div>
        <Card className="border-primary/10 bg-card/95 shadow-xl shadow-primary/10 backdrop-blur">
          <CardHeader>
            <CardTitle>{t('auth.forgotTitle')}</CardTitle>
            <CardDescription>{t('auth.forgotDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="email" placeholder={t('auth.forgotEmailPlaceholder')} />
            <Button className="w-full" disabled>{t('auth.sendResetLink')}</Button>
            <Button asChild className="w-full" variant="ghost">
              <Link href={localized ? `/${locale}/login` : '/login'}>{t('auth.backToLogin')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
