import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Check the signup fields and try again.' }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (existing) {
      return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        accounts: {
          create: {
            name: 'Primary account',
            broker: 'Manual import',
            baseCurrency: 'USD',
            startingBalance: 50000
          }
        },
        checklistTemplates: {
          create: {
            name: 'Daily trading plan',
            items: {
              create: [
                { label: 'Macro calendar reviewed', sortOrder: 1, isRequired: true },
                { label: 'Risk limit set', sortOrder: 2, isRequired: true },
                { label: 'A+ setups identified', sortOrder: 3, isRequired: false }
              ]
            }
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Signup is unavailable until the database is configured.' }, { status: 500 });
  }
}
