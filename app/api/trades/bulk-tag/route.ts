import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertTags } from '@/lib/trade-write';
import { bulkTagSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to bulk tag trades.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join(' ') }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email }
    });
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        id: { in: parsed.data.tradeIds }
      },
      select: { id: true }
    });
    const tags = await upsertTags(prisma, user.id, parsed.data.tags);

    for (const trade of trades) {
      for (const tag of tags) {
        await prisma.tradeTag.upsert({
          where: {
            tradeId_tagId: {
              tradeId: trade.id,
              tagId: tag.id
            }
          },
          update: {},
          create: {
            tradeId: trade.id,
            tagId: tag.id
          }
        });
      }
    }

    return NextResponse.json({ ok: true, updatedTrades: trades.length });
  } catch {
    return NextResponse.json({ error: 'Bulk tags could not be saved.' }, { status: 500 });
  }
}
