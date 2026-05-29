'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';
import { Brand } from '@/components/brand';
import { useI18n } from '@/components/i18n-provider';
import { LanguageSelector } from '@/components/language-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const localized = pathname.startsWith(`/${locale}`);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));

    if (mode === 'signup') {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name')),
          email,
          password
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? t('auth.signupError'));
        setLoading(false);
        return;
      }
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      setError(t('auth.loginError'));
      setLoading(false);
      return;
    }

    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
    router.push(getSafeCallbackUrl(callbackUrl, localized ? `/${locale}/dashboard` : '/app/dashboard'));
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.42))] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/0.06)_1px,transparent_1px),linear-gradient(180deg,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[length:72px_72px]" />
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSelector className="w-32" />
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand className="text-xl" />
        </div>
        <Card className="border-primary/10 bg-card/95 shadow-xl shadow-primary/10 backdrop-blur">
          <CardHeader>
            <CardTitle>{mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? t('auth.loginDescription')
                : t('auth.signupDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === 'signup' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium">{t('auth.name')}</label>
                  <Input name="name" required placeholder={t('auth.namePlaceholder')} />
                </div>
              ) : null}
              <div>
                <label className="mb-2 block text-sm font-medium">{t('auth.email')}</label>
                <Input name="email" type="email" required defaultValue={mode === 'login' ? 'demo@tradeharbor.app' : ''} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t('auth.password')}</label>
                <Input name="password" type="password" required minLength={mode === 'signup' ? 8 : 1} defaultValue={mode === 'login' ? 'demo1234' : ''} />
              </div>
              {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? t('common.loading') : mode === 'login' ? t('auth.loginButton') : t('auth.signupButton')}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  <Link href={localized ? `/${locale}/signup` : '/signup'} className="hover:text-foreground">{t('auth.signupTitle')}</Link>
                  <Link href={localized ? `/${locale}/forgot-password` : '/forgot-password'} className="hover:text-foreground">{t('auth.forgotPassword')}</Link>
                </>
              ) : (
                <Link href={localized ? `/${locale}/login` : '/login'} className="hover:text-foreground">{t('auth.loginTitle')}</Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getSafeCallbackUrl(callbackUrl: string | null, fallback: string) {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) return fallback;
  return callbackUrl;
}
