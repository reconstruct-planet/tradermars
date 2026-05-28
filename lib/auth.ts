import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { demoTradingData } from './demo-data';
import { prisma } from './prisma';
import { validateEliteTestAccount } from './test-accounts';
import { loginSchema } from './validation';

const demoAuthSecret = !process.env.DATABASE_URL
  ? 'tradeharbor-local-demo-secret-do-not-use-in-production'
  : undefined;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? demoAuthSecret,
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email }
          });

          if (!user?.passwordHash) {
            return await authorizeEliteTestAccount(parsed.data.email, parsed.data.password);
          }

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return await authorizeEliteTestAccount(parsed.data.email, parsed.data.password);

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? user.email
          };
        } catch {
          const eliteTestUser = await authorizeEliteTestAccount(parsed.data.email, parsed.data.password);
          if (eliteTestUser) return eliteTestUser;

          if (
            parsed.data.email === demoTradingData.user.email &&
            parsed.data.password === 'demo1234'
          ) {
            return {
              id: 'demo-user',
              email: demoTradingData.user.email,
              name: demoTradingData.user.name
            };
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
      }
      return session;
    }
  }
};

async function authorizeEliteTestAccount(email: string, password: string) {
  const account = await validateEliteTestAccount(email, password);
  if (!account) return null;

  const user = await ensureEliteTestUser(account).catch(() => null);

  return {
    id: user?.id ?? account.id,
    email: account.email,
    name: user?.name ?? account.name
  };
}

async function ensureEliteTestUser(account: Awaited<ReturnType<typeof validateEliteTestAccount>>) {
  if (!account || !process.env.DATABASE_URL) return null;

  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: {
      name: account.name,
      passwordHash: account.passwordHash,
      timezone: 'America/New_York',
      plan: 'ELITE',
      subscriptionStatus: 'active'
    },
    create: {
      name: account.name,
      email: account.email,
      passwordHash: account.passwordHash,
      timezone: 'America/New_York',
      plan: 'ELITE',
      subscriptionStatus: 'active',
      accounts: {
        create: {
          name: `${account.name} account`,
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

  await removeSeededEliteDemoData(user.id);
  await ensureEliteTestAccountWorkspace(user.id, account.name);
  return user;
}

async function removeSeededEliteDemoData(userId: string) {
  const seededBatch = await prisma.importBatch.findFirst({
    where: {
      userId,
      filename: {
        startsWith: 'tradeharbor-elite-test-'
      }
    },
    select: { id: true }
  });

  if (!seededBatch) return;

  await prisma.note.deleteMany({ where: { userId } });
  await prisma.trade.deleteMany({ where: { userId } });
  await prisma.importBatch.deleteMany({ where: { userId } });
  await prisma.dailyPlan.deleteMany({ where: { userId } });
  await prisma.checklistTemplate.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.tag.deleteMany({ where: { userId } });
}

async function ensureEliteTestAccountWorkspace(userId: string, name: string) {
  const account = await prisma.account.findFirst({
    where: { userId },
    select: { id: true, name: true, broker: true }
  });

  if (account) {
    if (account.broker === 'Demo Broker' || account.name.startsWith('Elite test account')) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          name: `${name} account`,
          broker: 'Manual import'
        }
      });
    }
  } else {
    await prisma.account.create({
      data: {
        userId,
        name: `${name} account`,
        broker: 'Manual import',
        baseCurrency: 'USD',
        startingBalance: 50000
      }
    });
  }

  const checklistTemplate = await prisma.checklistTemplate.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (!checklistTemplate) {
    await prisma.checklistTemplate.create({
      data: {
        userId,
        name: 'Daily trading plan',
        items: {
          create: [
            { label: 'Macro calendar reviewed', sortOrder: 1, isRequired: true },
            { label: 'Risk limit set', sortOrder: 2, isRequired: true },
            { label: 'A+ setups identified', sortOrder: 3, isRequired: false }
          ]
        }
      }
    });
  }
}
