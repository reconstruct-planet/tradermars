import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getMessages } from '@/lib/i18n';
import { isLocale, locales } from '@/lib/i18n-routing';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = await getMessages(locale, ['meta']);
  return {
    title: {
      absolute: dictionary.meta?.title ?? 'TradeHarbor'
    },
    description: dictionary.meta?.description,
    alternates: {
      languages: Object.fromEntries(locales.map((item) => [item, `/${item}`]))
    }
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return children;
}
