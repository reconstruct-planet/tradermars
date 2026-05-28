import { z } from 'zod';

export const assetTypeSchema = z.enum(['STOCK', 'OPTION', 'FUTURE', 'FOREX', 'CRYPTO']);
export const tradeSideSchema = z.enum(['LONG', 'SHORT']);

export const tradeInputSchema = z
  .object({
    symbol: z.string().trim().min(1, 'Symbol is required.').max(20).transform((value) => value.toUpperCase()),
    assetType: assetTypeSchema,
    side: tradeSideSchema,
    quantity: z.coerce.number().positive('Quantity must be greater than zero.').finite(),
    entryPrice: z.coerce.number().positive('Entry price must be greater than zero.').finite(),
    exitPrice: z.coerce.number().positive('Exit price must be greater than zero.').finite().nullable().optional(),
    entryTime: z.coerce.date(),
    exitTime: z.coerce.date().nullable().optional(),
    fees: z.coerce.number().min(0, 'Fees cannot be negative.').finite().default(0),
    grossPnl: z.coerce.number().finite().default(0),
    netPnl: z.coerce.number().finite().default(0),
    riskAmount: z.coerce.number().positive('Risk amount must be greater than zero.').finite().nullable().optional(),
    rMultiple: z.coerce.number().finite().default(0),
    strategy: z.string().trim().max(80).nullable().optional(),
    session: z.string().trim().max(80).nullable().optional(),
    setup: z.string().trim().max(120).nullable().optional(),
    mistake: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(12, 'Use 12 tags or fewer.').default([])
  })
  .superRefine((trade, context) => {
    if (trade.exitTime && trade.exitTime < trade.entryTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exitTime'],
        message: 'Exit time must be after entry time.'
      });
    }

    if (trade.exitTime && !trade.exitPrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exitPrice'],
        message: 'Closed trades need an exit price.'
      });
    }

    if (Math.abs(trade.rMultiple) > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rMultiple'],
        message: 'R multiple looks impossible. Keep it between -100 and 100.'
      });
    }
  });

export const bulkTagSchema = z.object({
  tradeIds: z.array(z.string().min(1)).min(1, 'Select at least one trade.').max(250),
  tags: z.array(z.string().trim().min(1).max(40)).min(1, 'Enter at least one tag.').max(12)
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(120)
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const goalInputSchema = z.object({
  type: z.enum(['MONTHLY_PNL', 'MAX_DRAWDOWN', 'MIN_WIN_RATE', 'DAILY_MAX_LOSS']),
  name: z.string().trim().min(1).max(120),
  targetValue: z.coerce.number().positive(),
  currentValue: z.coerce.number().default(0),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date()
});
