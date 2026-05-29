import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n-routing';

const baseUrl = 'https://tradermars.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const localizedRoutes = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: locale === 'en' ? 1 : 0.8
    },
    {
      url: `${baseUrl}/${locale}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    }
  ]);

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1
    },
    ...localizedRoutes
  ];
}
