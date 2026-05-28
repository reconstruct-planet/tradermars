import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { defaultLocale, isLocale } from '@/lib/i18n-routing';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Edgefolio | Trading Journal and Analytics',
  description:
    'A modern trading journal for importing trades, reviewing performance, and improving decision quality.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerLocale = (await headers()).get('x-edgefolio-locale') ?? defaultLocale;
  const lang = isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
