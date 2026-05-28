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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand className="text-xl" />
        </div>
        <Card>
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
