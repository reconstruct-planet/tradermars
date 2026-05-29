import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { isLocale } from './i18n-routing';
import { prisma } from './prisma';

export async function requireAppUser(callbackUrl: string) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user?.email) {
    redirectToLogin(callbackUrl);
  }

  if (!process.env.DATABASE_URL) return;

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.email,
      status: 'ACTIVE',
      deletedAt: null
    },
    select: { id: true }
  }).catch(() => null);

  if (!user) {
    redirectToLogin(callbackUrl);
  }
}

function redirectToLogin(callbackUrl: string): never {
  const firstSegment = callbackUrl.split('/').filter(Boolean)[0];
  const loginPath = isLocale(firstSegment) ? `/${firstSegment}/login` : '/login';
  redirect(`${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
