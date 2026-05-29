import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n-routing';

const baseUrl = 'https://tradermars.vercel.app';
const appRoutes = ['dashboard', 'trades', 'calendar', 'analytics', 'insights', 'notes', 'tags', 'plans', 'goals', 'import', 'settings'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/app/',
        ...locales.flatMap((locale) => appRoutes.flatMap((route) => [`/${locale}/${route}`, `/${locale}/${route}/`]))
      ]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
