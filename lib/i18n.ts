import { type Locale } from './i18n-config';
import type { Dictionary, MessageNamespace, Messages } from './i18n-messages';
export { getMessage, type Dictionary, type MessageNamespace, type Messages } from './i18n-messages';
export { defaultLocale, isLocale, localeLabels, locales, type Locale } from './i18n-routing';

const dictionaryLoaders = {
  en: () => import('@/messages/en.json').then((module) => module.default),
  ko: () => import('@/messages/ko.json').then((module) => module.default),
  ja: () => import('@/messages/ja.json').then((module) => module.default),
  'zh-CN': () => import('@/messages/zh-CN.json').then((module) => module.default),
  es: () => import('@/messages/es.json').then((module) => module.default)
} as const satisfies Record<Locale, () => Promise<Dictionary>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaryLoaders[locale]();
}

export async function getMessages(locale: Locale, namespaces: readonly MessageNamespace[]): Promise<Messages> {
  return pickMessages(await getDictionary(locale), namespaces);
}

export function pickMessages(dictionary: Dictionary, namespaces: readonly MessageNamespace[]): Messages {
  return Object.fromEntries(
    namespaces.map((namespace) => [namespace, dictionary[namespace]])
  ) as Messages;
}

export { getLocalizedAlternates, localizePath, pathWithoutLocale } from './i18n-routing';
