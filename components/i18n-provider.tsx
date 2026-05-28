'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import { defaultLocale, type Locale } from '@/lib/i18n-config';
import { getMessage, type Messages } from '@/lib/i18n-messages';
import { formatCurrencyForLocale, formatDateForLocale, formatNumberForLocale, formatPercentForLocale } from '@/lib/utils';

type I18nContextValue = {
  locale: Locale;
  dictionary: Messages;
  t: (key: string, values?: Record<string, string | number>) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatNumber: (value: number, digits?: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  dictionary: {},
  t: (key, values) => getMessage({}, key, values),
  formatCurrency: (value, currency) => formatCurrencyForLocale(value, defaultLocale, currency),
  formatNumber: (value, digits) => formatNumberForLocale(value, defaultLocale, digits),
  formatPercent: (value, digits) => formatPercentForLocale(value, defaultLocale, digits),
  formatDate: (value, options) => formatDateForLocale(value, defaultLocale, options)
});

export function I18nProvider({
  locale = defaultLocale,
  messages = {},
  children
}: {
  locale?: Locale;
  messages?: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    dictionary: messages,
    t: (key, values) => getMessage(messages, key, values),
    formatCurrency: (amount, currency) => formatCurrencyForLocale(amount, locale, currency),
    formatNumber: (amount, digits) => formatNumberForLocale(amount, locale, digits),
    formatPercent: (amount, digits) => formatPercentForLocale(amount, locale, digits),
    formatDate: (date, options) => formatDateForLocale(date, locale, options)
  }), [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
