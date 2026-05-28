import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { defaultLocale, isLocale } from '@/lib/i18n-routing';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://tradermars.vercel.app'),
  applicationName: 'TradeHarbor',
  title: {
    default: 'TradeHarbor | Trading Journal and Analytics',
    template: '%s | TradeHarbor'
  },
  description:
    'A disciplined trading journal for importing trades, reviewing performance, and improving decision quality.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/brand/tradeharbor-app-icon.svg', type: 'image/svg+xml' }]
  },
  openGraph: {
    title: 'TradeHarbor | Trading Journal and Analytics',
    description:
      'A disciplined trading journal for importing trades, reviewing performance, and improving decision quality.',
    siteName: 'TradeHarbor',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'TradeHarbor | Trading Journal and Analytics',
    description:
      'A disciplined trading journal for importing trades, reviewing performance, and improving decision quality.'
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerLocale = (await headers()).get('x-tradeharbor-locale') ?? defaultLocale;
  const lang = isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
