import { defaultLocale, isConfiguredLocale, localeLabels, locales, type Locale } from './i18n-config';

export { defaultLocale, isConfiguredLocale, localeLabels, locales, type Locale } from './i18n-config';

export function isLocale(value: string | undefined): value is Locale {
  return isConfiguredLocale(value);
}

export function pathWithoutLocale(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  if (segments[0] === 'app') segments.shift();
  return `/${segments.join('/')}`;
}

export function localizePath(pathname: string, locale: Locale) {
  const cleanPath = pathWithoutLocale(pathname);
  return cleanPath === '/' ? `/${locale}` : `/${locale}${cleanPath}`;
}

export function getLocalizedAlternates(pathname: string) {
  return Object.fromEntries(locales.map((locale) => [locale, localizePath(pathname, locale)]));
}
