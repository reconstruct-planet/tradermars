import { describe, expect, it } from 'vitest';
import {
  getMissingRequiredMappings,
  guessMapping,
  normalizeRows,
  parseCsv,
  tradeDuplicateKey
} from '@/lib/csv';

const csv = `symbol,side,quantity,entryPrice,exitPrice,entryTime,exitTime,fees,strategy,tags
AAPL,LONG,10,100,105,2026-05-01T13:30:00.000Z,2026-05-01T14:30:00.000Z,1,Opening range,"A+ setup;disciplined"
MSFT,SHORT,5,200,190,2026-05-02T13:30:00.000Z,2026-05-02T14:30:00.000Z,1,VWAP fade,VWAP`;

describe('csv import parsing', () => {
  it('guesses required mappings and validates closed trade rows', () => {
    const rows = parseCsv(csv);
    const mapping = guessMapping(Object.keys(rows[0] ?? {}));
    const normalized = normalizeRows(rows, mapping);

    expect(getMissingRequiredMappings(mapping)).toEqual([]);
    expect(normalized.every((row) => row.ok)).toBe(true);
    expect(normalized[0]?.ok && normalized[0].data.symbol).toBe('AAPL');
  });

  it('rejects rows missing required import values', () => {
    const rows = parseCsv(`symbol,side,quantity,entryPrice,exitTime
AAPL,LONG,10,100,2026-05-01T14:30:00.000Z`);
    const mapping = guessMapping(Object.keys(rows[0] ?? {}));
    const normalized = normalizeRows(rows, mapping);

    expect(getMissingRequiredMappings(mapping)).toContain('exitPrice');
    expect(normalized[0]?.ok).toBe(false);
    expect(normalized[0]?.ok === false && normalized[0].reason).toContain('Missing required');
  });

  it('builds stable duplicate keys from required trade identity fields', () => {
    const rows = normalizeRows(parseCsv(csv), guessMapping(Object.keys(parseCsv(csv)[0] ?? {})));
    const first = rows[0];

    expect(first?.ok && tradeDuplicateKey(first.data)).toContain('AAPL|LONG|10.0000|2026-05-01T13:30:00.000Z|2026-05-01T14:30:00.000Z');
  });
});
