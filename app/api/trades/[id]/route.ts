import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateTradeWithTags } from '@/lib/trade-write';
import { tradeInputSchema } from '@/lib/validation';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to edit trades.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = tradeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email }
    });
    await updateTradeWithTags({
      db: prisma,
      tradeId: id,
      userId: user.id,
      input: parsed.data
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Trade could not be updated.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to delete trades.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email }
    });

    await prisma.trade.delete({
      where: {
        id,
        userId: user.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Trade could not be deleted.' }, { status: 500 });
  }
}
