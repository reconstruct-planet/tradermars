import type { PrismaClient } from '@prisma/client';
import type { z } from 'zod';
import type { tradeInputSchema } from './validation';

export type TradeInput = z.infer<typeof tradeInputSchema>;

export function deriveTradeValues(input: TradeInput) {
  const exitPrice = input.exitPrice ?? null;
  const grossPnl =
    exitPrice !== null
      ? input.side === 'SHORT'
        ? (input.entryPrice - exitPrice) * input.quantity
        : (exitPrice - input.entryPrice) * input.quantity
      : input.grossPnl;
  const netPnl = input.netPnl || grossPnl - input.fees;
  const rMultiple = input.rMultiple || (input.riskAmount ? netPnl / input.riskAmount : 0);

  return {
    grossPnl,
    netPnl,
    rMultiple
  };
}

export async function ensurePrimaryAccount(db: PrismaClient, userId: string) {
  const existing = await db.account.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  if (existing) return existing;

  return db.account.create({
    data: {
      userId,
      name: 'Primary account',
      broker: 'Manual import',
      baseCurrency: 'USD',
      startingBalance: 50000
    }
  });
}

export async function upsertTags(db: PrismaClient, userId: string, tagNames: string[]) {
  const uniqueNames = Array.from(new Set(tagNames.map((name) => name.trim()).filter(Boolean)));
  const tags = [];

  for (const name of uniqueNames) {
    tags.push(
      await db.tag.upsert({
        where: {
          userId_name: {
            userId,
            name
          }
        },
        update: {},
        create: {
          userId,
          name,
          category: 'imported',
          color: colorFromName(name)
        }
      })
    );
  }

  return tags;
}

export async function createTradeWithTags({
  db,
  userId,
  accountId,
  input,
  importBatchId
}: {
  db: PrismaClient;
  userId: string;
  accountId: string;
  input: TradeInput;
  importBatchId?: string;
}) {
  const tags = await upsertTags(db, userId, input.tags);
  const derived = deriveTradeValues(input);

  return db.trade.create({
    data: {
      userId,
      accountId,
      importBatchId,
      symbol: input.symbol,
      assetType: input.assetType,
      side: input.side,
      quantity: input.quantity,
      entryPrice: input.entryPrice,
      exitPrice: input.exitPrice ?? null,
      entryTime: input.entryTime,
      exitTime: input.exitTime ?? null,
      fees: input.fees,
      grossPnl: derived.grossPnl,
      netPnl: derived.netPnl,
      riskAmount: input.riskAmount ?? null,
      rMultiple: derived.rMultiple,
      strategy: input.strategy || null,
      session: input.session || null,
      setup: input.setup || null,
      mistake: input.mistake || null,
      tags: {
        create: tags.map((tag) => ({
          tagId: tag.id
        }))
      },
      notes: input.notes
        ? {
            create: {
              userId,
              scope: 'TRADE',
              title: `${input.symbol} trade journal`,
              content: input.notes
            }
          }
        : undefined
    }
  });
}

export async function updateTradeWithTags({
  db,
  tradeId,
  userId,
  input
}: {
  db: PrismaClient;
  tradeId: string;
  userId: string;
  input: TradeInput;
}) {
  const tags = await upsertTags(db, userId, input.tags);
  const derived = deriveTradeValues(input);

  await db.tradeTag.deleteMany({
    where: { tradeId }
  });

  return db.trade.update({
    where: {
      id: tradeId,
      userId
    },
    data: {
      symbol: input.symbol,
      assetType: input.assetType,
      side: input.side,
      quantity: input.quantity,
      entryPrice: input.entryPrice,
      exitPrice: input.exitPrice ?? null,
      entryTime: input.entryTime,
      exitTime: input.exitTime ?? null,
      fees: input.fees,
      grossPnl: derived.grossPnl,
      netPnl: derived.netPnl,
      riskAmount: input.riskAmount ?? null,
      rMultiple: derived.rMultiple,
      strategy: input.strategy || null,
      session: input.session || null,
      setup: input.setup || null,
      mistake: input.mistake || null,
      tags: {
        create: tags.map((tag) => ({
          tagId: tag.id
        }))
      }
    }
  });
}

function colorFromName(name: string) {
  const palette = ['#0f766e', '#2563eb', '#7c3aed', '#c2410c', '#0891b2', '#16a34a', '#be123c'];
  const hash = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}
