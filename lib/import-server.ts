import type { PrismaClient } from '@prisma/client';
import {
  type CsvMapping,
  type NormalizedImportRow,
  getMappedMetadata,
  normalizeRows,
  parseCsv,
  tradeDuplicateKey
} from './csv';

export type ImportValidationResult = {
  rows: Record<string, string>[];
  metadata: {
    broker: string | null;
    account: string | null;
  };
  validRows: Extract<NormalizedImportRow, { ok: true }>[];
  invalidRows: Extract<NormalizedImportRow, { ok: false }>[];
};

export async function validateImportCsv({
  db,
  userId,
  text,
  mapping
}: {
  db: PrismaClient;
  userId: string;
  text: string;
  mapping: CsvMapping;
}): Promise<ImportValidationResult> {
  const rows = parseCsv(text);
  const normalizedRows = normalizeRows(rows, mapping);
  const fileDuplicateCounts = new Map<string, number>();

  for (const row of normalizedRows) {
    if (row.ok) {
      const key = tradeDuplicateKey(row.data);
      fileDuplicateCounts.set(key, (fileDuplicateCounts.get(key) ?? 0) + 1);
    }
  }

  const validCandidateRows = normalizedRows.filter((row) => row.ok);
  const existingKeys = await findExistingDuplicateKeys({
    db,
    userId,
    rows: validCandidateRows
  });

  const validRows: Extract<NormalizedImportRow, { ok: true }>[] = [];
  const invalidRows: Extract<NormalizedImportRow, { ok: false }>[] = [];

  for (const row of normalizedRows) {
    if (!row.ok) {
      invalidRows.push(row);
      continue;
    }

    const key = tradeDuplicateKey(row.data);
    if ((fileDuplicateCounts.get(key) ?? 0) > 1) {
      invalidRows.push({
        ok: false,
        rowNumber: row.rowNumber,
        reason: 'Duplicate row in this CSV: symbol, side, quantity, entry time, and exit time match another row.',
        raw: rows[row.rowNumber - 2] ?? {}
      });
      continue;
    }

    if (existingKeys.has(key)) {
      invalidRows.push({
        ok: false,
        rowNumber: row.rowNumber,
        reason: 'Duplicate trade already exists in this account: symbol, side, quantity, entry time, and exit time match.',
        raw: rows[row.rowNumber - 2] ?? {}
      });
      continue;
    }

    validRows.push(row);
  }

  return {
    rows,
    metadata: getMappedMetadata(rows, mapping),
    validRows,
    invalidRows
  };
}

async function findExistingDuplicateKeys({
  db,
  userId,
  rows
}: {
  db: PrismaClient;
  userId: string;
  rows: Extract<NormalizedImportRow, { ok: true }>[];
}) {
  if (!rows.length) return new Set<string>();

  const symbols = Array.from(new Set(rows.map((row) => row.data.symbol)));
  const earliestEntry = new Date(Math.min(...rows.map((row) => row.data.entryTime.getTime())));
  const latestEntry = new Date(Math.max(...rows.map((row) => row.data.entryTime.getTime())));

  const existingTrades = await db.trade.findMany({
    where: {
      userId,
      symbol: { in: symbols },
      entryTime: {
        gte: earliestEntry,
        lte: latestEntry
      }
    },
    select: {
      symbol: true,
      side: true,
      quantity: true,
      entryTime: true,
      exitTime: true,
      entryPrice: true,
      exitPrice: true,
      fees: true,
      grossPnl: true,
      netPnl: true,
      rMultiple: true,
      assetType: true,
      riskAmount: true,
      strategy: true,
      session: true,
      setup: true,
      mistake: true
    }
  });

  return new Set(
    existingTrades.map((trade) =>
      [
        trade.symbol.toUpperCase(),
        trade.side,
        Number(trade.quantity).toFixed(4),
        trade.entryTime.toISOString(),
        trade.exitTime ? trade.exitTime.toISOString() : ''
      ].join('|')
    )
  );
}
