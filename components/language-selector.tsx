'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Select } from '@/components/ui/select';
import { defaultLocale, localizePath, localeLabels, locales, type Locale } from '@/lib/i18n-routing';
import { useI18n } from './i18n-provider';

export function LanguageSelector({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useI18n();

  function changeLocale(nextLocale: string) {
    router.push(localizePath(pathname, nextLocale as Locale));
  }

  return (
    <Select
      className={className ?? 'w-36'}
      aria-label={t('common.language')}
      value={locale ?? defaultLocale}
      onChange={(event) => changeLocale(event.target.value)}
    >
      {locales.map((item) => (
        <option key={item} value={item}>{localeLabels[item]}</option>
      ))}
    </Select>
  );
}
