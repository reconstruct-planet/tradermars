import Papa from 'papaparse';
import { z } from 'zod';
import { tradeInputSchema } from './validation';

export const importableTradeFields = [
  'symbol',
  'assetType',
  'side',
  'quantity',
  'entryPrice',
  'exitPrice',
  'entryTime',
  'exitTime',
  'fees',
  'netPnl',
  'riskAmount',
  'rMultiple',
  'strategy',
  'session',
  'setup',
  'mistake',
  'notes',
  'tags',
  'broker',
  'account'
] as const;

export type ImportField = (typeof importableTradeFields)[number];
export type TradeImportField = Exclude<ImportField, 'broker' | 'account'>;
export type CsvMapping = Partial<Record<ImportField, string>>;
export const requiredImportFields = ['symbol', 'side', 'quantity', 'entryPrice', 'exitPrice', 'entryTime', 'exitTime'] as const;

export type ImportPreviewRow = {
  rowNumber: number;
  raw: Record<string, string>;
};

export type NormalizedImportRow =
  | {
      ok: true;
      rowNumber: number;
      data: z.infer<typeof tradeInputSchema>;
    }
  | {
      ok: false;
      rowNumber: number;
      reason: string;
      raw: Record<string, string>;
    };

export function parseCsv(text: string) {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV parsing failed.');
  }

  return parsed.data;
}

export function guessMapping(headers: string[]): CsvMapping {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));

  const aliases: Record<ImportField, string[]> = {
    symbol: ['symbol', 'ticker', 'underlying'],
    assetType: ['assettype', 'asset type', 'market', 'instrumenttype', 'instrument type'],
    side: ['side', 'direction', 'buy/sell', 'position'],
    quantity: ['quantity', 'qty', 'shares', 'contracts', 'size'],
    entryPrice: ['entryprice', 'entry price', 'open price', 'entry'],
    exitPrice: ['exitprice', 'exit price', 'close price', 'exit'],
    entryTime: ['entrytime', 'entry time', 'open time', 'entered at', 'date'],
    exitTime: ['exittime', 'exit time', 'close time', 'closed at'],
    fees: ['fees', 'commission', 'commissions'],
    netPnl: ['netpnl', 'net pnl', 'pnl', 'profit', 'realized pnl'],
    riskAmount: ['riskamount', 'risk amount', 'risk'],
    rMultiple: ['rmultiple', 'r multiple', 'r', 'rr'],
    strategy: ['strategy', 'system'],
    session: ['session', 'market session'],
    setup: ['setup', 'pattern'],
    mistake: ['mistake', 'error'],
    notes: ['notes', 'note', 'journal'],
    tags: ['tags', 'tag'],
    broker: ['broker', 'broker name', 'source'],
    account: ['account', 'account name', 'portfolio']
  };

  return importableTradeFields.reduce<CsvMapping>((mapping, field) => {
    const match = aliases[field].map(normalizeHeader).find((alias) => normalized.has(alias));
    if (match) mapping[field] = normalized.get(match);
    return mapping;
  }, {});
}

export function normalizeRows(rows: Record<string, string>[], mapping: CsvMapping): NormalizedImportRow[] {
  return rows.map((row, index) => normalizeRow(row, mapping, index + 2));
}

function normalizeRow(row: Record<string, string>, mapping: CsvMapping, rowNumber: number): NormalizedImportRow {
  const raw = (field: TradeImportField) => {
    const header = mapping[field];
    return header ? row[header]?.trim() : undefined;
  };

  const missingFields = requiredImportFields.filter((field) => !mapping[field] || !raw(field));
  if (missingFields.length) {
    return {
      ok: false,
      rowNumber,
      reason: `Missing required field values: ${missingFields.join(', ')}`,
      raw: row
    };
  }

  const entryPrice = parseNumber(raw('entryPrice'));
  const exitPrice = parseOptionalNumber(raw('exitPrice'));
  const quantity = parseNumber(raw('quantity'));
  const fees = parseOptionalNumber(raw('fees')) ?? 0;
  const side = normalizeSide(raw('side'));
  const grossPnl =
    exitPrice !== null && Number.isFinite(entryPrice) && Number.isFinite(quantity)
      ? side === 'SHORT'
        ? (entryPrice - exitPrice) * quantity
        : (exitPrice - entryPrice) * quantity
      : parseOptionalNumber(raw('netPnl')) ?? 0;
  const netPnl = parseOptionalNumber(raw('netPnl')) ?? grossPnl - fees;
  const riskAmount = parseOptionalNumber(raw('riskAmount'));
  const rMultiple = parseOptionalNumber(raw('rMultiple')) ?? (riskAmount ? netPnl / riskAmount : 0);

  const candidate = {
    symbol: raw('symbol'),
    assetType: normalizeAsset(raw('assetType')),
    side,
    quantity,
    entryPrice,
    exitPrice,
    entryTime: raw('entryTime'),
    exitTime: raw('exitTime') || undefined,
    fees,
    grossPnl,
    netPnl,
    riskAmount,
    rMultiple,
    strategy: raw('strategy') || null,
    session: raw('session') || null,
    setup: raw('setup') || null,
    mistake: raw('mistake') || null,
    notes: raw('notes') || null,
    tags: splitTags(raw('tags'))
  };

  const result = tradeInputSchema.safeParse(candidate);
  if (!result.success) {
    return {
      ok: false,
      rowNumber,
      reason: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      raw: row
    };
  }

  return {
    ok: true,
    rowNumber,
    data: result.data
  };
}

export function getMissingRequiredMappings(mapping: CsvMapping) {
  return requiredImportFields.filter((field) => !mapping[field]);
}

export function getMappedMetadata(rows: Record<string, string>[], mapping: CsvMapping) {
  const firstValue = (field: 'broker' | 'account') => {
    const header = mapping[field];
    if (!header) return null;
    return rows.map((row) => row[header]?.trim()).find(Boolean) ?? null;
  };

  return {
    broker: firstValue('broker'),
    account: firstValue('account')
  };
}

export function tradeDuplicateKey(trade: z.infer<typeof tradeInputSchema>) {
  return [
    trade.symbol.toUpperCase(),
    trade.side,
    Number(trade.quantity).toFixed(4),
    trade.entryTime.toISOString(),
    trade.exitTime ? trade.exitTime.toISOString() : ''
  ].join('|');
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseNumber(value: string | undefined) {
  if (!value) return Number.NaN;
  return Number(value.replace(/[$,%]/g, ''));
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSide(value: string | undefined) {
  const normalized = value?.toUpperCase().trim();
  if (normalized === 'SELL' || normalized === 'SHORT') return 'SHORT';
  return 'LONG';
}

function normalizeAsset(value: string | undefined) {
  const normalized = value?.toUpperCase().trim();
  if (normalized === 'OPTION' || normalized === 'OPTIONS') return 'OPTION';
  if (normalized === 'FUTURE' || normalized === 'FUTURES') return 'FUTURE';
  if (normalized === 'FOREX' || normalized === 'FX') return 'FOREX';
  if (normalized === 'CRYPTO' || normalized === 'CRYPTOCURRENCY') return 'CRYPTO';
  return 'STOCK';
}

function splitTags(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}
