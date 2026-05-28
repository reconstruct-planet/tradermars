import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { demoTradingData } from './demo-data';
import { prisma } from './prisma';
import { findEliteTestAccount, makeEliteTestTradingData, type EliteTestEmail } from './test-accounts';
import type {
  AppShellData,
  ChecklistTemplateRecord,
  DailyPlanRecord,
  GoalRecord,
  NoteRecord,
  TagRecord,
  TradeRecord,
  TradingData
} from './types';

export const getTradingData = cache(async function getTradingData(): Promise<TradingData> {
  if (!process.env.DATABASE_URL) {
    return demoTradingData;
  }

  const session = await getServerSession(authOptions).catch(() => null);
  const email = session?.user?.email ?? demoTradingData.user.email;
  const eliteTestData = getEliteTestData(email);

  try {
    const user = await prisma.user.findFirst({
      where: { email, status: 'ACTIVE', deletedAt: null },
      include: {
        accounts: { orderBy: { createdAt: 'asc' } },
        trades: {
          orderBy: { entryTime: 'desc' },
          include: {
            tags: { include: { tag: true } },
            notes: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        },
        closedPnlSegments: {
          orderBy: { closedAt: 'desc' }
        },
        tags: { include: { trades: true }, orderBy: { name: 'asc' } },
        notes: { include: { tag: true }, orderBy: { createdAt: 'desc' } },
        goals: { orderBy: { createdAt: 'desc' } },
        dailyPlans: { orderBy: { day: 'desc' } },
        checklistTemplates: { include: { items: { orderBy: { sortOrder: 'asc' } } } }
      }
    });

    if (!user || !user.accounts[0]) return eliteTestData ?? demoTradingData;

    return {
      user: {
        name: user.name ?? 'Trader',
        email: user.email,
        timezone: user.timezone,
        plan: user.plan
      },
      account: {
        id: user.accounts[0].id,
        name: user.accounts[0].name,
        broker: user.accounts[0].broker,
        baseCurrency: user.accounts[0].baseCurrency,
        startingBalance: Number(user.accounts[0].startingBalance)
      },
      trades: [
        ...user.trades.map<TradeRecord>((trade) => ({
          id: trade.id,
          symbol: trade.symbol,
          assetType: trade.assetType,
          side: trade.side,
          quantity: Number(trade.quantity),
          entryPrice: Number(trade.entryPrice),
          exitPrice: trade.exitPrice === null ? null : Number(trade.exitPrice),
          entryTime: trade.entryTime.toISOString(),
          exitTime: trade.exitTime?.toISOString() ?? null,
          fees: Number(trade.fees),
          grossPnl: Number(trade.grossPnl),
          netPnl: Number(trade.netPnl),
          riskAmount: trade.riskAmount === null ? null : Number(trade.riskAmount),
          rMultiple: Number(trade.rMultiple),
          strategy: trade.strategy,
          session: trade.session,
          setup: trade.setup,
          mistake: trade.mistake,
          tags: trade.tags.map((item) => item.tag.name),
          notes: trade.notes[0]?.content ?? null
        })),
        ...user.closedPnlSegments.map<TradeRecord>((segment) => ({
          id: `bybit-closed-pnl-${segment.id}`,
          symbol: segment.symbol,
          assetType: 'FUTURE',
          side: segment.inferredSide === 'SHORT' ? 'SHORT' : 'LONG',
          quantity: Number(segment.quantity),
          entryPrice: Number(segment.avgEntryPrice),
          exitPrice: Number(segment.avgExitPrice),
          entryTime: segment.closedAt.toISOString(),
          exitTime: segment.closedAt.toISOString(),
          fees: Number(segment.openingFee) + Number(segment.closingFee) + Number(segment.fundingFee),
          grossPnl: Number(segment.grossPnl),
          netPnl: Number(segment.netPnl),
          riskAmount: null,
          rMultiple: 0,
          strategy: 'Bybit Closed PnL segment',
          session: null,
          setup: segment.tradeType,
          mistake: segment.inferredSide === 'UNKNOWN' ? 'Side inference unresolved' : null,
          tags: ['bybit', 'closed-pnl'],
          notes: segment.inferredSide === 'UNKNOWN' ? 'Imported from Bybit Closed PnL with unresolved side inference.' : null
        }))
      ].sort((a, b) => new Date(b.exitTime ?? b.entryTime).getTime() - new Date(a.exitTime ?? a.entryTime).getTime()),
      tags: user.tags.map<TagRecord>((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        category: tag.category,
        tradeCount: tag.trades.length
      })),
      notes: user.notes.map<NoteRecord>((note) => ({
        id: note.id,
        scope: note.scope,
        title: note.title,
        content: note.content,
        mood: note.mood,
        day: note.day?.toISOString() ?? null,
        tradeId: note.tradeId,
        tagName: note.tag?.name ?? null,
        createdAt: note.createdAt.toISOString()
      })),
      goals: user.goals.map<GoalRecord>((goal) => ({
        id: goal.id,
        type: goal.type,
        name: goal.name,
        targetValue: Number(goal.targetValue),
        currentValue: Number(goal.currentValue),
        periodStart: goal.periodStart.toISOString(),
        periodEnd: goal.periodEnd.toISOString(),
        isActive: goal.isActive
      })),
      dailyPlans: user.dailyPlans.map<DailyPlanRecord>((plan) => ({
        id: plan.id,
        day: plan.day.toISOString(),
        bias: plan.bias,
        maxLoss: plan.maxLoss === null ? null : Number(plan.maxLoss),
        notes: plan.notes,
        checklistState: (plan.checklistState as Record<string, boolean> | null) ?? null
      })),
      checklistTemplates: user.checklistTemplates.map<ChecklistTemplateRecord>((template) => ({
        id: template.id,
        name: template.name,
        items: template.items.map((item) => ({
          id: item.id,
          label: item.label,
          isRequired: item.isRequired,
          sortOrder: item.sortOrder
        }))
      })),
      isDemoFallback: false
    };
  } catch {
    return eliteTestData ?? demoTradingData;
  }
});

export const getAppShellData = cache(async function getAppShellData(): Promise<AppShellData> {
  if (!process.env.DATABASE_URL) {
    return pickShellData(demoTradingData);
  }

  const session = await getServerSession(authOptions).catch(() => null);
  const email = session?.user?.email ?? demoTradingData.user.email;
  const eliteTestData = getEliteTestData(email);

  try {
    const user = await prisma.user.findFirst({
      where: { email, status: 'ACTIVE', deletedAt: null },
      include: {
        accounts: { orderBy: { createdAt: 'asc' }, take: 1 }
      }
    });

    if (!user || !user.accounts[0]) return pickShellData(eliteTestData ?? demoTradingData);

    return {
      user: {
        name: user.name ?? 'Trader',
        email: user.email,
        timezone: user.timezone,
        plan: user.plan
      },
      account: {
        id: user.accounts[0].id,
        name: user.accounts[0].name,
        broker: user.accounts[0].broker,
        baseCurrency: user.accounts[0].baseCurrency,
        startingBalance: Number(user.accounts[0].startingBalance)
      },
      isDemoFallback: false
    };
  } catch {
    return pickShellData(eliteTestData ?? demoTradingData);
  }
});

function getEliteTestData(email: string) {
  const account = findEliteTestAccount(email);
  return account ? makeEliteTestTradingData(account.email as EliteTestEmail) : null;
}

function pickShellData(data: TradingData): AppShellData {
  return {
    user: data.user,
    account: data.account,
    isDemoFallback: data.isDemoFallback
  };
}
