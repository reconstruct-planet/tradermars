import { existsSync, readFileSync } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

loadLocalEnv();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email) {
    throw new Error('Set ADMIN_EMAIL before creating the initial admin.');
  }

  if (!password || password.length < 12) {
    throw new Error('Set ADMIN_INITIAL_PASSWORD to a temporary password with at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      suspendedAt: null,
      suspendedReason: null,
      deletedAt: null
    },
    create: {
      email,
      name: 'Initial Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      timezone: 'America/New_York'
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: null,
      targetUserId: user.id,
      action: 'INITIAL_SUPER_ADMIN_CREATED',
      entityType: 'User',
      entityId: user.id,
      metadata: {
        source: 'scripts/create-initial-admin.ts',
        requiresPasswordChange: process.env.NODE_ENV === 'production'
      }
    }
  }).catch(() => undefined);

  console.log(`SUPER_ADMIN ready for ${email}.`);
  console.log('Use the temporary password once, then change it outside code/secrets management.');
}

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
