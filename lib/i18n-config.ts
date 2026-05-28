export const localeConfig = {
  en: {
    label: 'English',
    intlLocale: 'en-US',
    currency: 'USD'
  },
  ko: {
    label: '한국어',
    intlLocale: 'ko-KR',
    currency: 'USD'
  },
  ja: {
    label: '日本語',
    intlLocale: 'ja-JP',
    currency: 'USD'
  },
  'zh-CN': {
    label: '简体中文',
    intlLocale: 'zh-CN',
    currency: 'USD'
  },
  es: {
    label: 'Español',
    intlLocale: 'es-ES',
    currency: 'USD'
  }
} as const;

export type Locale = keyof typeof localeConfig;

export const locales = Object.keys(localeConfig) as Locale[];
export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = Object.fromEntries(
  locales.map((locale) => [locale, localeConfig[locale].label])
) as Record<Locale, string>;

export function getLocaleSettings(locale: Locale | string) {
  return localeConfig[isConfiguredLocale(locale) ? locale : defaultLocale];
}

export function isConfiguredLocale(value: string | undefined): value is Locale {
  return Boolean(value && value in localeConfig);
}
