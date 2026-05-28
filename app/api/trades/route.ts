import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTradeWithTags, ensurePrimaryAccount } from '@/lib/trade-write';
import { tradeInputSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to add trades.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = tradeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: session.user.email, status: 'ACTIVE', deletedAt: null }
    });
    const account = await ensurePrimaryAccount(prisma, user.id);
    const trade = await createTradeWithTags({
      db: prisma,
      userId: user.id,
      accountId: account.id,
      input: parsed.data
    });

    return NextResponse.json({ ok: true, tradeId: trade.id });
  } catch {
    return NextResponse.json({ error: 'Trade could not be saved.' }, { status: 500 });
  }
}
