import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
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

async function main() {
  await removeLegacyDemoUsers(demoTradingData.user.email);

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.upsert({
    where: { email: demoTradingData.user.email },
    update: {
      name: demoTradingData.user.name,
      passwordHash,
      plan: demoTradingData.user.plan
    },
    create: {
      name: demoTradingData.user.name,
      email: demoTradingData.user.email,
      passwordHash,
      timezone: demoTradingData.user.timezone,
      plan: demoTradingData.user.plan
    }
  });

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
      name: demoTradingData.account.name,
      broker: demoTradingData.account.broker,
      baseCurrency: demoTradingData.account.baseCurrency,
      startingBalance: demoTradingData.account.startingBalance
    }
  });

  const importBatch = await prisma.importBatch.create({
    data: {
      userId: user.id,
      filename: 'tradeharbor-demo-seed.csv',
      broker: 'Demo Broker',
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

  for (const template of demoChecklistTemplates) {
    await prisma.checklistTemplate.create({
      data: {
        id: template.id,
        userId: user.id,
        name: template.name,
        items: {
          create: template.items.map((item) => ({
            id: item.id,
            label: item.label,
            isRequired: item.isRequired,
            sortOrder: item.sortOrder
          }))
        }
      }
    });
  }

  for (const plan of demoDailyPlans) {
    await prisma.dailyPlan.create({
      data: {
        userId: user.id,
        accountId: account.id,
        checklistTemplateId: demoChecklistTemplates[0]?.id,
        day: plan.day,
        bias: plan.bias,
        maxLoss: plan.maxLoss,
        notes: plan.notes,
        checklistState: plan.checklistState ?? undefined
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

  console.log(`Seeded ${demoTrades.length} trades for ${demoTradingData.user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
