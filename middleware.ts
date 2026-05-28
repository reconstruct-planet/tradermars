import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isConfiguredLocale } from '@/lib/i18n-config';

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  const firstSegment = request.nextUrl.pathname.split('/').filter(Boolean)[0];
  headers.set('x-edgefolio-locale', isConfiguredLocale(firstSegment) ? firstSegment : defaultLocale);

  return NextResponse.next({
    request: {
      headers
    }
  });
}

export const config = {
  matcher: ['/((?!api(?:/|$)|_next(?:/|$)|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)']
};
