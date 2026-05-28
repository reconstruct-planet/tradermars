import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TradeHarbor',
    short_name: 'TradeHarbor',
    description: 'A disciplined trading journal and performance analytics workspace.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#07161A',
    theme_color: '#0B6B67',
    icons: [
      {
        src: '/favicon.svg',
        sizes: '64x64',
        type: 'image/svg+xml'
      },
      {
        src: '/brand/tradeharbor-app-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
