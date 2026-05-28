import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { Plan } from '../lib/types';
import {
  demoChecklistTemplates,
  demoDailyPlans,
  demoGoals,
  demoNotes,
  demoTags,
  demoTrades,
  demoTradingData
} from '../lib/demo-data';

const prisma = new PrismaClient();
const legacyDemoEmails = ['demo@' + 'edgefolio.app'];
const demoPassword = 'demo1234';
const defaultEliteTestPasswords = [
  'Elite-1-lKEiievnsnCp',
  'Elite-2-yGa0jcZGYG42',
  'Elite-3-QARpdfy9kJCQ',
  'Elite-4-Bjink5Pfqhuc',
  'Elite-5-1lWT8Euk49WY'
];

type SeedAccount = {
  name: string;
  broker: string | null;
  baseCurrency: string;
  startingBalance: number;
};

type SeedUser = {
  name: string;
  email: string;
  password: string;
  timezone: string;
  plan: Plan;
  account: SeedAccount;
  importFilename: string;
  seedDemoData: boolean;
};

const demoSeedUser: SeedUser = {
  name: demoTradingData.user.name,
  email: demoTradingData.user.email,
  password: demoPassword,
  timezone: demoTradingData.user.timezone,
  plan: demoTradingData.user.plan,
  account: {
    name: demoTradingData.account.name,
    broker: demoTradingData.account.broker,
    baseCurrency: demoTradingData.account.baseCurrency,
    startingBalance: demoTradingData.account.startingBalance
  },
  importFilename: 'tradeharbor-demo-seed.csv',
  seedDemoData: true
};

const eliteTestUsers: SeedUser[] = Array.from({ length: 5 }, (_, index) => {
  const number = index + 1;

  return {
    name: `Elite Test Trader ${number}`,
    email: `elite${number}@tradeharbor.app`,
    password: getEliteTestPassword(number),
    timezone: demoTradingData.user.timezone,
    plan: 'ELITE',
    account: {
      name: `Elite test account ${number}`,
      broker: 'Demo Broker',
      baseCurrency: 'USD',
      startingBalance: 50000
    },
    importFilename: `tradeharbor-elite-test-${number}.csv`,
    seedDemoData: false
  };
});

function getEliteTestPassword(number: number) {
  return process.env[`ELITE_TEST_PASSWORD_${number}`]
    ?? defaultEliteTestPasswords[number - 1]
    ?? `Elite-${number}-${randomBytes(9).toString('base64url')}`;
}

async function removeLegacyDemoUsers(activeEmail: string) {
  const emailsToRemove = legacyDemoEmails.filter((email) => email !== activeEmail);

  if (emailsToRemove.length === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      email: {
        in: emailsToRemove
      }
    }
  });
}

async function seedTradingUser(seedUser: SeedUser, passwordHash: string) {
  const user = await prisma.user.upsert({
    where: { email: seedUser.email },
    update: {
      name: seedUser.name,
      passwordHash,
      timezone: seedUser.timezone,
      plan: seedUser.plan,
      subscriptionStatus: seedUser.plan === 'ELITE' ? 'active' : null
    },
    create: {
      name: seedUser.name,
      email: seedUser.email,
      passwordHash,
      timezone: seedUser.timezone,
      plan: seedUser.plan,
      subscriptionStatus: seedUser.plan === 'ELITE' ? 'active' : null
    }
  });

  if (!seedUser.seedDemoData) {
    await ensureRealUserWorkspace(user.id, seedUser);
    console.log(`Seeded real ${seedUser.plan} workspace for ${seedUser.email}`);
    return;
  }

  await prisma.importBatch.deleteMany({ where: { userId: user.id } });
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.trade.deleteMany({ where: { userId: user.id } });
  await prisma.dailyPlan.deleteMany({ where: { userId: user.id } });
  await prisma.checklistTemplate.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.tag.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: seedUser.account.name,
      broker: seedUser.account.broker,
      baseCurrency: seedUser.account.baseCurrency,
      startingBalance: seedUser.account.startingBalance
    }
  });

  const importBatch = await prisma.importBatch.create({
    data: {
      userId: user.id,
      filename: seedUser.importFilename,
      broker: seedUser.account.broker,
      status: 'IMPORTED',
      totalRows: demoTrades.length,
      importedRows: demoTrades.length,
      rejectedRows: 0
    }
  });

  const tagMap = new Map<string, string>();
  for (const tag of demoTags) {
    const created = await prisma.tag.create({
      data: {
        userId: user.id,
        name: tag.name,
        color: tag.color,
        category: tag.category
      }
    });
    tagMap.set(created.name, created.id);
  }

  const tradeIdMap = new Map<string, string>();
  for (const trade of demoTrades) {
    const created = await prisma.trade.create({
      data: {
        userId: user.id,
        accountId: account.id,
        importBatchId: importBatch.id,
        symbol: trade.symbol,
        assetType: trade.assetType,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime,
        fees: trade.fees,
        grossPnl: trade.grossPnl,
        netPnl: trade.netPnl,
        riskAmount: trade.riskAmount,
        rMultiple: trade.rMultiple,
        strategy: trade.strategy,
        session: trade.session,
        setup: trade.setup,
        mistake: trade.mistake,
        tags: {
          create: trade.tags
            .map((tagName) => tagMap.get(tagName))
            .filter(Boolean)
            .map((tagId) => ({ tagId: tagId as string }))
        }
      }
    });
    tradeIdMap.set(trade.id, created.id);
  }

  for (const note of demoNotes) {
    const tag = note.tagName ? await prisma.tag.findUnique({ where: { userId_name: { userId: user.id, name: note.tagName } } }) : null;
    await prisma.note.create({
      data: {
        userId: user.id,
        tradeId: note.tradeId ? tradeIdMap.get(note.tradeId) : null,
        tagId: tag?.id,
        scope: note.scope,
        day: note.day,
        title: note.title,
        content: note.content,
        mood: note.mood,
        createdAt: note.createdAt
      }
    });
  }

  const templateIdMap = new Map<string, string>();
  const checklistItemIdMap = new Map<string, string>();
  for (const template of demoChecklistTemplates) {
    const createdTemplate = await prisma.checklistTemplate.create({
      data: {
        userId: user.id,
        name: template.name
      }
    });

    templateIdMap.set(template.id, createdTemplate.id);

    for (const item of template.items) {
      const createdItem = await prisma.checklistItem.create({
        data: {
          templateId: createdTemplate.id,
          label: item.label,
          isRequired: item.isRequired,
          sortOrder: item.sortOrder
        }
      });
      checklistItemIdMap.set(item.id, createdItem.id);
    }
  }

  for (const plan of demoDailyPlans) {
    const checklistTemplateId = demoChecklistTemplates[0]
      ? templateIdMap.get(demoChecklistTemplates[0].id)
      : undefined;

    await prisma.dailyPlan.create({
      data: {
        userId: user.id,
        accountId: account.id,
        checklistTemplateId,
        day: plan.day,
        bias: plan.bias,
        maxLoss: plan.maxLoss,
        notes: plan.notes,
        checklistState: mapChecklistState(plan.checklistState, checklistItemIdMap) ?? undefined
      }
    });
  }

  for (const goal of demoGoals) {
    await prisma.goal.create({
      data: {
        userId: user.id,
        type: goal.type,
        name: goal.name,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        periodStart: goal.periodStart,
        periodEnd: goal.periodEnd,
        isActive: goal.isActive
      }
    });
  }

  console.log(`Seeded ${demoTrades.length} trades for ${seedUser.email} (${seedUser.plan})`);
}

async function ensureRealUserWorkspace(userId: string, seedUser: SeedUser) {
  const account = await prisma.account.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (!account) {
    await prisma.account.create({
      data: {
        userId,
        name: seedUser.account.name,
        broker: 'Manual import',
        baseCurrency: seedUser.account.baseCurrency,
        startingBalance: seedUser.account.startingBalance
      }
    });
  }

  const template = await prisma.checklistTemplate.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (!template) {
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

function mapChecklistState(state: Record<string, boolean> | null, itemIdMap: Map<string, string>) {
  if (!state) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(state).map(([itemId, checked]) => [itemIdMap.get(itemId) ?? itemId, checked])
  );
}

async function main() {
  await removeLegacyDemoUsers(demoSeedUser.email);

  const seedUsers = [demoSeedUser, ...eliteTestUsers];
  const passwordHashes = new Map<string, string>();

  for (const seedUser of seedUsers) {
    let passwordHash = passwordHashes.get(seedUser.password);
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(seedUser.password, 10);
      passwordHashes.set(seedUser.password, passwordHash);
    }

    await seedTradingUser(seedUser, passwordHash);
  }

  console.log('Elite test accounts seeded:');
  for (const user of eliteTestUsers) {
    console.log(`- ${user.email} / ${user.password}`);
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
