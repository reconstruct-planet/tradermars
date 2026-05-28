import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { defaultLocale, getLocaleSettings, type Locale } from './i18n-config';

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = 'USD') {
  return formatCurrencyForLocale(value, defaultLocale, currency);
}

export function formatCurrencyForLocale(
  value: number,
  locale: Locale | string = defaultLocale,
  currency: string = getLocaleSettings(locale).currency
) {
  return getNumberFormatter(toIntlLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number, digits = 2) {
  return formatNumberForLocale(value, defaultLocale, digits);
}

export function formatNumberForLocale(value: number, locale: Locale | string = defaultLocale, digits = 2) {
  return getNumberFormatter(toIntlLocale(locale), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return formatPercentForLocale(value, defaultLocale, digits);
}

export function formatPercentForLocale(value: number, locale: Locale | string = defaultLocale, digits = 1) {
  return getNumberFormatter(toIntlLocale(locale), {
    style: 'percent',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatDateForLocale(
  date: Date | string,
  locale: Locale | string = defaultLocale,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
) {
  return getDateFormatter(toIntlLocale(locale), options).format(new Date(date));
}

export function toInputDate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function toDateTimeLocal(date: Date | string) {
  return new Date(date).toISOString().slice(0, 16);
}

function toIntlLocale(locale: Locale | string) {
  return getLocaleSettings(locale).intlLocale;
}

function getNumberFormatter(locale: string, options: Intl.NumberFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  const existing = numberFormatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.NumberFormat(locale, options);
  numberFormatters.set(key, formatter);
  return formatter;
}

function getDateFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  const existing = dateFormatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat(locale, options);
  dateFormatters.set(key, formatter);
  return formatter;
}
