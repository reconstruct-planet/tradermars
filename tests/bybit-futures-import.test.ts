import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import {
  buildBybitFuturesImportAnalysis,
  bybitClosedPnlDuplicateKey,
  bybitExecutionDuplicateKey,
  detectBybitFile,
  groupClosedPnlSegments,
  inferClosedPnlSide,
  parseBybitDate,
  parseBybitTradeHistoryRows,
  parseTabularBuffer,
  parseBybitClosedPnlRows,
  type BybitParsedFile
} from '@/lib/bybit-futures';

describe('Bybit futures import adapter', () => {
  it('detects and parses Bybit Closed PnL rows without double-subtracting fees', () => {
    const file = bybitFile('Bybit-AllPerp-ClosedPNL.csv', closedPnlCsv(), 'closedPnl');
    const parsed = parseBybitClosedPnlRows(file, 'UTC');

    expect(file.detection.detectedFileType).toBe('BYBIT_CLOSED_PNL');
    expect(file.detection.missingColumns).toEqual([]);
    expect(parsed.rows).toHaveLength(4);
    expect(sum(parsed.rows.map((row) => row.netPnl))).toBeCloseTo(30.23869282, 8);
    expect(sum(parsed.rows.map((row) => row.openingFee + row.closingFee))).toBeCloseTo(10.51580718, 8);
    expect(parsed.rows[0]?.grossPnl).toBeCloseTo((parsed.rows[0]?.netPnl ?? 0) + (parsed.rows[0]?.openingFee ?? 0) + (parsed.rows[0]?.closingFee ?? 0) + (parsed.rows[0]?.fundingFee ?? 0), 8);
    expect(parsed.rows[0]?.inferredSide).toBe('LONG');
    expect(parsed.rows[1]?.inferredSide).toBe('LONG');
    expect(parsed.rows[2]?.inferredSide).toBe('SHORT');
  });

  it('accepts XLSX worksheet exports for Bybit files', () => {
    const rows = parseTabularBuffer('Bybit-AllPerp-ClosedPNL.xlsx', makeMinimalXlsx(closedPnlCsv()));
    const detection = detectBybitFile({ fileName: 'Bybit-AllPerp-ClosedPNL.xlsx', rows });

    expect(rows).toHaveLength(4);
    expect(detection.detectedFileType).toBe('BYBIT_CLOSED_PNL');
  });

  it('detects Trade History, separates funding, trims IDs, and parses UTC times', () => {
    const file = bybitFile('Bybit-UTA-Perp-TradeHistory.csv', tradeHistoryCsv(), 'tradeHistory');
    const parsed = parseBybitTradeHistoryRows(file, 'UTC');

    expect(file.detection.detectedFileType).toBe('BYBIT_TRADE_HISTORY');
    expect(parsed.executions).toHaveLength(68);
    expect(parsed.fundingRows).toHaveLength(1);
    expect(parsed.executions[0]?.tradeId).toBe('tx-1');
    expect(parsed.executions[0]?.orderId).toBe('order-1');
    expect(parsed.executions[0]?.executedAt.toISOString()).toBe('2026-05-27T10:00:00.000Z');
  });

  it('matches sample Closed PnL to Trade History and reports high data quality', () => {
    const closed = bybitFile('Bybit-AllPerp-ClosedPNL.csv', closedPnlCsv(), 'closedPnl');
    const history = bybitFile('Bybit-UTA-Perp-TradeHistory.csv', tradeHistoryCsv(), 'tradeHistory');
    const analysis = buildBybitFuturesImportAnalysis({ files: [closed, history], timezone: 'UTC' });

    expect(analysis.matchResult.feeValidationStatus).toBe('PASSED');
    expect(analysis.matchResult.closedTradeFeeTotal).toBeCloseTo(10.51580718, 8);
    expect(analysis.matchResult.executionFeeTotal).toBeCloseTo(10.51580718, 8);
    expect(analysis.matchResult.matchedClosedPnlRows).toBe(4);
    expect(analysis.dataQuality).toBe('HIGH');
  });

  it('does not infer final position side directly from Trade History direction', () => {
    const file = bybitFile('Bybit-UTA-Perp-TradeHistory.csv', tradeHistoryCsv(), 'tradeHistory');
    const parsed = parseBybitTradeHistoryRows(file, 'UTC');

    expect(parsed.executions[0]?.direction).toBe('Long');
    expect(parsed.executions[0]).not.toHaveProperty('side');
  });

  it('infers side from Closed PnL formula tolerance', () => {
    const long = inferClosedPnlSide({
      quantity: 1,
      avgEntryPrice: 100,
      avgExitPrice: 110,
      openingFee: 1,
      closingFee: 1,
      fundingFee: 0,
      netPnl: 8
    });
    const short = inferClosedPnlSide({
      quantity: 1,
      avgEntryPrice: 110,
      avgExitPrice: 100,
      openingFee: 1,
      closingFee: 1,
      fundingFee: 0,
      netPnl: 8
    });
    const unknown = inferClosedPnlSide({
      quantity: 1,
      avgEntryPrice: 100,
      avgExitPrice: 110,
      openingFee: 1,
      closingFee: 1,
      fundingFee: 0,
      netPnl: 999
    });

    expect(long.side).toBe('LONG');
    expect(short.side).toBe('SHORT');
    expect(unknown.side).toBe('UNKNOWN');
  });

  it('builds stable duplicate keys for Closed PnL and executions', () => {
    const closedAt = new Date('2026-05-27T10:00:00.000Z');
    const closedKey = bybitClosedPnlDuplicateKey({
      exchange: 'BYBIT',
      symbol: 'btcusdt',
      quantity: 1,
      avgEntryPrice: 100,
      avgExitPrice: 120,
      closedAt,
      netPnl: 17.5,
      openingFee: 1,
      closingFee: 1.5
    });
    const executionKey = bybitExecutionDuplicateKey({
      tradeId: 'tx-1',
      orderId: 'order-1',
      executedAt: closedAt,
      symbol: 'BTCUSDT',
      quantity: 1,
      filledPrice: 120,
      sourceRowHash: 'abc'
    });

    expect(closedKey).toContain('BYBIT|BTCUSDT|1.00000000|100.00000000|120.00000000');
    expect(executionKey).toBe('tx-1|order-1|2026-05-27T10:00:00.000Z|BTCUSDT|1.00000000|120.00000000');
  });

  it('groups partial closes when segment signatures match', () => {
    const file = bybitFile('Bybit-AllPerp-ClosedPNL.csv', closedPnlCsv(), 'closedPnl');
    const parsed = parseBybitClosedPnlRows(file, 'UTC');
    const first = parsed.rows[0];
    if (!first) throw new Error('Fixture did not produce rows.');

    const secondPartial = {
      ...first,
      rowIndex: 99,
      quantity: 0.5,
      netPnl: 8.75,
      grossPnl: 10,
      closedAt: new Date('2026-05-27T11:00:00.000Z')
    };
    const groups = groupClosedPnlSegments([first, secondPartial]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it('falls back to low confidence for unknown files and reports rejected rows', () => {
    const unknownRows = parseTabularBuffer('unknown.csv', Buffer.from('foo,bar\n1,2'));
    const unknownDetection = detectBybitFile({ fileName: 'unknown.csv', rows: unknownRows });
    const badClosedFile = bybitFile(
      'bad-closed.csv',
      'Market,Order Quantity,Entry Price,Exit Price,Opening Fee,Closing Fee,Funding Fee,Trade Type,Trade time\nBTCUSDT,1,100,110,1,1,0,Trade,2026-05-27 10:00:00',
      'closedPnl'
    );
    const parsed = parseBybitClosedPnlRows(badClosedFile, 'UTC');

    expect(unknownDetection.detectedFileType).toBe('UNKNOWN');
    expect(unknownDetection.confidenceScore).toBeLessThan(72);
    expect(parsed.rejectedRows).toHaveLength(1);
    expect(parsed.rejectedRows[0]?.reason).toContain('Realized P&L');
  });

  it('parses timezone overrides when Closed PnL time is not explicit', () => {
    expect(parseBybitDate('2026-05-27 10:00:00', 'UTC').date?.toISOString()).toBe('2026-05-27T10:00:00.000Z');
    expect(parseBybitDate('2026-05-27 10:00:00', 'UTC+09:00').date?.toISOString()).toBe('2026-05-27T01:00:00.000Z');
  });
});

function bybitFile(fileName: string, csv: string, requestedSlot: 'closedPnl' | 'tradeHistory'): BybitParsedFile {
  const rows = parseTabularBuffer(fileName, Buffer.from(csv));
  const fileHash = `hash-${fileName}`;
  return {
    requestedSlot,
    fileName,
    fileHash,
    rows,
    headers: Object.keys(rows[0] ?? {}),
    detection: detectBybitFile({
      fileName,
      fileHash,
      rows
    })
  };
}

function closedPnlCsv() {
  return `Market,Order Quantity,Entry Price,Exit Price,Opening Fee,Closing Fee,Funding Fee,cumClosedPzOpenFeeInfo,cumClosedPzTradeFeeInfo,Trade Type,Realized P&L,Trade time
BTCUSDT,1,100,120,1,1.5,0,,,Trade,17.5,2026-05-27 10:00:00
ETHUSDT,2,50,55,0.75,0.75,0,,,Trade,8.5,2026-05-27 10:05:00
SOLUSDT,1,200,192,1,1,0,,,Trade,6,2026-05-27 10:10:00
ADAUSDT,1,10,12.7545,2,2.51580718,0,,,Trade,-1.76130718,2026-05-27 10:15:00`;
}

function tradeHistoryCsv() {
  const headers = [
    'Market',
    'Filled Type',
    'Filled Quantity',
    'Filled Price',
    'Order Price',
    'Fee Rate',
    'Trading Fee',
    'feeCoin',
    'ExecFeeV2',
    'Direction',
    'Order Type',
    'Trasaction ID',
    'Order No.',
    'Transaction Time(UTC+0)'
  ].join(',');
  const rows = [
    'BTCUSDT,Trade,1,120,120,0.0006,2.5,USDT,2.5,Long,Market, tx-1, order-1,2026-05-27 10:00:00',
    'ETHUSDT,Trade,2,55,55,0.0006,1.5,USDT,1.5,Long,Limit,tx-2,order-2,2026-05-27 10:05:00',
    'SOLUSDT,Trade,1,192,192,0.0006,2,USDT,2,Short,Market,tx-3,order-3,2026-05-27 10:10:00',
    'ADAUSDT,Trade,1,12.7545,12.7545,0.0006,4.51580718,USDT,4.51580718,Long,Market,tx-4,order-4,2026-05-27 10:15:00'
  ];

  for (let index = 5; index <= 68; index += 1) {
    rows.push(`BTCUSDT,Trade,0.01,111,111,0.0006,0,USDT,0,Long,Limit,tx-${index},order-${index},2026-05-27 09:${String(index % 60).padStart(2, '0')}:00`);
  }

  rows.push('BTCUSDT,Funding,0,0,0,0,0.25,USDT,0.25,Long,Funding,tx-69,order-69,2026-05-27 12:00:00');
  return [headers, ...rows].join('\n');
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function makeMinimalXlsx(csv: string) {
  const rows = csv.split('\n').map((line) => line.split(','));
  const worksheetRows = rows
    .map((cells, rowIndex) => {
      const cellXml = cells
        .map((cell, columnIndex) => {
          const ref = `${columnLetters(columnIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIndex + 1}">${cellXml}</row>`;
    })
    .join('');
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>'),
    'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet><sheetData>${worksheetRows}</sheetData></worksheet>`)
  };

  return Buffer.from(zipSync(files));
}

function columnLetters(index: number) {
  let value = index + 1;
  let letters = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
