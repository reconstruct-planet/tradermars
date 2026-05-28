import { createHash } from 'crypto';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const BYBIT_FUTURES_ADAPTER_VERSION = 'bybit-futures-v1';

export type BybitDetectedFileType = 'BYBIT_CLOSED_PNL' | 'BYBIT_TRADE_HISTORY' | 'UNKNOWN';
export type BybitDataQuality = 'HIGH' | 'MEDIUM' | 'LIMITED' | 'LOW';
export type BybitPositionSide = 'LONG' | 'SHORT' | 'UNKNOWN';
export type BybitFeeValidationStatus = 'PASSED' | 'WARNING' | 'SKIPPED';

export type BybitParsedFile = {
  requestedSlot: 'closedPnl' | 'tradeHistory';
  fileName: string;
  fileHash: string;
  rows: Record<string, string>[];
  headers: string[];
  detection: BybitFileDetection;
};

export type BybitFileDetection = {
  fileName: string;
  fileHash: string;
  detectedExchange: 'BYBIT' | 'UNKNOWN';
  detectedFileType: BybitDetectedFileType;
  confidenceScore: number;
  rowCount: number;
  symbolCount: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  headers: string[];
  missingColumns: string[];
  warnings: string[];
};

export type BybitClosedPnlSegment = {
  rowIndex: number;
  raw: Record<string, string>;
  exchange: 'BYBIT';
  marketType: 'PERPETUAL';
  sourceType: 'BYBIT_CLOSED_PNL';
  sourceFileName: string;
  sourceFileHash: string;
  sourceRowHash: string;
  duplicateKey: string;
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  openingFee: number;
  closingFee: number;
  fundingFee: number;
  grossPnl: number;
  netPnl: number;
  closedAt: Date;
  tradeType: string | null;
  inferredSide: BybitPositionSide;
  sideInferenceConfidence: number;
  formulaTolerance: number;
  warnings: string[];
};

export type BybitExecution = {
  rowIndex: number;
  raw: Record<string, string>;
  exchange: 'BYBIT';
  marketType: 'PERPETUAL';
  sourceType: 'BYBIT_TRADE_HISTORY';
  sourceFileName: string;
  sourceFileHash: string;
  sourceRowHash: string;
  duplicateKey: string;
  symbol: string;
  filledType: string;
  quantity: number;
  filledPrice: number;
  orderPrice: number | null;
  feeRate: number | null;
  fee: number;
  feeCoin: string | null;
  execFeeV2: number | null;
  direction: string | null;
  orderType: string | null;
  tradeId: string | null;
  orderId: string | null;
  executedAt: Date;
  warnings: string[];
};

export type BybitFundingEntry = {
  rowIndex: number;
  raw: Record<string, string>;
  exchange: 'BYBIT';
  marketType: 'PERPETUAL';
  sourceType: 'BYBIT_TRADE_HISTORY';
  sourceFileName: string;
  sourceFileHash: string;
  sourceRowHash: string;
  duplicateKey: string;
  symbol: string;
  amount: number;
  currency: string | null;
  fundingType: string;
  executedAt: Date;
  warnings: string[];
};

export type BybitRejectedRow = {
  rowIndex: number;
  sourceFileName: string;
  detectedFileType: BybitDetectedFileType;
  reason: string;
  raw: Record<string, string>;
};

export type BybitParsedClosedPnl = {
  sourceFile: BybitParsedFile | null;
  rows: BybitClosedPnlSegment[];
  rejectedRows: BybitRejectedRow[];
};

export type BybitParsedTradeHistory = {
  sourceFile: BybitParsedFile | null;
  executions: BybitExecution[];
  fundingRows: BybitFundingEntry[];
  rejectedRows: BybitRejectedRow[];
};

export type BybitMatchResult = {
  matchedClosedPnlRows: number;
  unmatchedClosedPnlRows: number;
  matchedTradeHistoryExecutions: number;
  unmatchedExecutions: number;
  fundingRows: number;
  feeValidationStatus: BybitFeeValidationStatus;
  feeDifference: number | null;
  feeTolerance: number | null;
  closedTradeFeeTotal: number | null;
  executionFeeTotal: number | null;
  quantityValidationStatus: 'PASSED' | 'WARNING' | 'SKIPPED';
  reconstructionConfidence: number;
  matchedExecutionRowIndexes: number[];
  warnings: string[];
};

export type BybitReconstructedPosition = {
  tempId: string;
  symbol: string;
  side: BybitPositionSide;
  quantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  openingFee: number;
  closingFee: number;
  fundingFee: number;
  grossPnl: number;
  netPnl: number;
  openedAt: Date | null;
  closedAt: Date;
  confidenceScore: number;
  dataQuality: BybitDataQuality;
  segmentRowIndexes: number[];
  executionRowIndexes: number[];
  warnings: string[];
};

export type BybitImportAnalysis = {
  adapterVersion: string;
  exchange: 'BYBIT';
  marketType: 'PERPETUAL';
  timezone: string;
  dataQuality: BybitDataQuality;
  files: BybitParsedFile[];
  closedPnl: BybitParsedClosedPnl;
  tradeHistory: BybitParsedTradeHistory;
  matchResult: BybitMatchResult;
  reconstructedPositions: BybitReconstructedPosition[];
  warnings: string[];
};

const closedPnlColumns = {
  market: ['Market'],
  quantity: ['Order Quantity', 'Closed Quantity', 'Closed Qty', 'Quantity'],
  entryPrice: ['Entry Price', 'Avg Entry Price'],
  exitPrice: ['Exit Price', 'Avg Exit Price'],
  openingFee: ['Opening Fee', 'Open Fee'],
  closingFee: ['Closing Fee', 'Close Fee'],
  fundingFee: ['Funding Fee'],
  tradeType: ['Trade Type'],
  realizedPnl: ['Realized P&L', 'Realized PnL', 'Realized PNL', 'Closed P&L'],
  tradeTime: ['Trade time', 'Trade Time', 'Closed At', 'Close Time']
} as const;

const tradeHistoryColumns = {
  market: ['Market'],
  filledType: ['Filled Type', 'Exec Type'],
  filledQuantity: ['Filled Quantity', 'Filled Qty', 'Exec Qty', 'Quantity'],
  filledPrice: ['Filled Price', 'Exec Price', 'Price'],
  orderPrice: ['Order Price'],
  feeRate: ['Fee Rate'],
  tradingFee: ['Trading Fee', 'Fee'],
  feeCoin: ['feeCoin', 'Fee Coin', 'Fee Currency'],
  execFeeV2: ['ExecFeeV2', 'Exec Fee V2'],
  direction: ['Direction'],
  orderType: ['Order Type'],
  tradeId: ['Trasaction ID', 'Transaction ID', 'Trade ID', 'Exec ID'],
  orderId: ['Order No.', 'Order No', 'Order ID', 'OrderId'],
  transactionTime: ['Transaction Time(UTC+0)', 'Transaction Time (UTC+0)', 'Transaction Time', 'Exec Time']
} as const;

const closedPnlRequiredKeys: Array<keyof typeof closedPnlColumns> = [
  'market',
  'quantity',
  'entryPrice',
  'exitPrice',
  'openingFee',
  'closingFee',
  'fundingFee',
  'tradeType',
  'realizedPnl',
  'tradeTime'
];

const tradeHistoryRequiredKeys: Array<keyof typeof tradeHistoryColumns> = [
  'market',
  'filledType',
  'filledQuantity',
  'filledPrice',
  'tradingFee',
  'direction',
  'orderType',
  'tradeId',
  'orderId',
  'transactionTime'
];

export async function readBybitUploadedFile({
  file,
  requestedSlot
}: {
  file: File;
  requestedSlot: 'closedPnl' | 'tradeHistory';
}): Promise<BybitParsedFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseTabularBuffer(file.name, buffer);
  const fileHash = sha256(buffer);
  const headers = Object.keys(rows[0] ?? {});
  const detection = detectBybitFile({
    fileName: file.name,
    fileHash,
    rows,
    headers
  });

  return {
    requestedSlot,
    fileName: file.name,
    fileHash,
    rows,
    headers,
    detection
  };
}

export function parseTabularBuffer(fileName: string, buffer: Buffer): Record<string, string>[] {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, raw: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    return cleanRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false }));
  }

  const parsed = Papa.parse<Record<string, string>>(stripBom(buffer.toString('utf8')), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV parsing failed.');
  }

  return cleanRows(parsed.data);
}

export function detectBybitFile({
  fileName,
  fileHash = '',
  rows,
  headers = Object.keys(rows[0] ?? {})
}: {
  fileName: string;
  fileHash?: string;
  rows: Record<string, string>[];
  headers?: string[];
}): BybitFileDetection {
  const closedScore = scoreSignature(headers, closedPnlColumns, closedPnlRequiredKeys);
  const tradeScore = scoreSignature(headers, tradeHistoryColumns, tradeHistoryRequiredKeys);
  const warnings: string[] = [];
  let detectedFileType: BybitDetectedFileType = 'UNKNOWN';
  let confidenceScore = Math.max(closedScore.confidenceScore, tradeScore.confidenceScore);

  if (closedScore.confidenceScore >= 72 && closedScore.confidenceScore >= tradeScore.confidenceScore) {
    detectedFileType = 'BYBIT_CLOSED_PNL';
    confidenceScore = closedScore.confidenceScore;
  } else if (tradeScore.confidenceScore >= 72) {
    detectedFileType = 'BYBIT_TRADE_HISTORY';
    confidenceScore = tradeScore.confidenceScore;
  } else {
    confidenceScore = Math.max(closedScore.confidenceScore, tradeScore.confidenceScore);
    warnings.push('The file does not match the required Bybit Closed PnL or Trade History column signatures.');
  }

  const missingColumns =
    detectedFileType === 'BYBIT_CLOSED_PNL'
      ? closedScore.missingColumns
      : detectedFileType === 'BYBIT_TRADE_HISTORY'
        ? tradeScore.missingColumns
        : Array.from(new Set([...closedScore.missingColumns, ...tradeScore.missingColumns]));

  const dateRange = detectDateRange(rows, detectedFileType);
  const symbolCount = new Set(
    rows
      .map((row) => getCell(row, [...closedPnlColumns.market, ...tradeHistoryColumns.market]))
      .filter(Boolean)
      .map((symbol) => symbol.toUpperCase())
  ).size;

  return {
    fileName,
    fileHash,
    detectedExchange: detectedFileType === 'UNKNOWN' ? 'UNKNOWN' : 'BYBIT',
    detectedFileType,
    confidenceScore,
    rowCount: rows.length,
    symbolCount,
    dateRange,
    headers,
    missingColumns,
    warnings
  };
}

export function buildBybitFuturesImportAnalysis({
  files,
  timezone = 'UTC'
}: {
  files: BybitParsedFile[];
  timezone?: string;
}): BybitImportAnalysis {
  const warnings: string[] = [];
  const closedFile = chooseFile(files, 'BYBIT_CLOSED_PNL', warnings);
  const tradeFile = chooseFile(files, 'BYBIT_TRADE_HISTORY', warnings);
  const unknownFiles = files.filter((file) => file.detection.detectedFileType === 'UNKNOWN');

  for (const file of unknownFiles) {
    warnings.push(`${file.fileName} could not be identified from its columns.`);
  }

  const closedPnl = closedFile ? parseBybitClosedPnlRows(closedFile, timezone) : emptyClosedPnl();
  const tradeHistory = tradeFile ? parseBybitTradeHistoryRows(tradeFile, timezone) : emptyTradeHistory();
  const matchResult = matchBybitClosedPnlToExecutions(closedPnl.rows, tradeHistory.executions, tradeHistory.fundingRows);
  const dataQuality = inferBybitDataQuality({
    closedRows: closedPnl.rows.length,
    executionRows: tradeHistory.executions.length,
    unknownFiles: unknownFiles.length,
    matchResult
  });
  const reconstructedPositions = reconstructBybitPositions({
    segments: closedPnl.rows,
    executions: tradeHistory.executions,
    matchResult,
    dataQuality
  });

  if (!closedPnl.rows.length && tradeHistory.executions.length) {
    warnings.push('Trade History was imported as execution detail only. Realized P&L analytics require Closed PnL.');
  }

  if (closedPnl.rows.length && !tradeHistory.executions.length) {
    warnings.push('Closed PnL can power realized P&L analytics, but execution detail is missing.');
  }

  return {
    adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
    exchange: 'BYBIT',
    marketType: 'PERPETUAL',
    timezone,
    dataQuality,
    files,
    closedPnl,
    tradeHistory,
    matchResult,
    reconstructedPositions,
    warnings
  };
}

export function parseBybitClosedPnlRows(file: BybitParsedFile, timezone = 'UTC'): BybitParsedClosedPnl {
  const rows: BybitClosedPnlSegment[] = [];
  const rejectedRows: BybitRejectedRow[] = [];

  for (const [index, rawRow] of file.rows.entries()) {
    const rowIndex = index + 2;
    const required = [
      ['Market', getCell(rawRow, closedPnlColumns.market)],
      ['Order Quantity', getCell(rawRow, closedPnlColumns.quantity)],
      ['Entry Price', getCell(rawRow, closedPnlColumns.entryPrice)],
      ['Exit Price', getCell(rawRow, closedPnlColumns.exitPrice)],
      ['Opening Fee', getCell(rawRow, closedPnlColumns.openingFee)],
      ['Closing Fee', getCell(rawRow, closedPnlColumns.closingFee)],
      ['Funding Fee', getCell(rawRow, closedPnlColumns.fundingFee)],
      ['Trade Type', getCell(rawRow, closedPnlColumns.tradeType)],
      ['Realized P&L', getCell(rawRow, closedPnlColumns.realizedPnl)],
      ['Trade time', getCell(rawRow, closedPnlColumns.tradeTime)]
    ];
    const missing = required.filter(([, value]) => !value).map(([label]) => label);

    if (missing.length) {
      rejectedRows.push(makeRejectedRow(file, rowIndex, rawRow, `Missing required columns or values: ${missing.join(', ')}`));
      continue;
    }

    const symbol = required[0]?.[1]?.toUpperCase() ?? '';
    const quantity = parseNumber(required[1]?.[1]);
    const avgEntryPrice = parseNumber(required[2]?.[1]);
    const avgExitPrice = parseNumber(required[3]?.[1]);
    const openingFee = parseNumber(required[4]?.[1]);
    const closingFee = parseNumber(required[5]?.[1]);
    const fundingFee = parseNumber(required[6]?.[1]);
    const tradeType = required[7]?.[1] ?? null;
    const netPnl = parseNumber(required[8]?.[1]);
    const parsedDate = parseBybitDate(required[9]?.[1] ?? '', timezone);
    const numericValues = {
      quantity,
      avgEntryPrice,
      avgExitPrice,
      openingFee,
      closingFee,
      fundingFee,
      netPnl
    };
    const invalid = Object.entries(numericValues)
      .filter(([, value]) => value === null || !Number.isFinite(value))
      .map(([label]) => label);

    if (invalid.length || !parsedDate.date) {
      rejectedRows.push(
        makeRejectedRow(
          file,
          rowIndex,
          rawRow,
          [
            invalid.length ? `Invalid numeric values: ${invalid.join(', ')}` : null,
            parsedDate.date ? null : 'Invalid Trade time'
          ]
            .filter(Boolean)
            .join('; ')
        )
      );
      continue;
    }

    const safeQuantity = quantity ?? 0;
    const safeEntryPrice = avgEntryPrice ?? 0;
    const safeExitPrice = avgExitPrice ?? 0;
    const safeOpeningFee = openingFee ?? 0;
    const safeClosingFee = closingFee ?? 0;
    const safeFundingFee = fundingFee ?? 0;
    const safeNetPnl = netPnl ?? 0;
    const feeTotal = safeOpeningFee + safeClosingFee + safeFundingFee;
    const grossPnl = safeNetPnl + feeTotal;
    const sideInference = inferClosedPnlSide({
      quantity: safeQuantity,
      avgEntryPrice: safeEntryPrice,
      avgExitPrice: safeExitPrice,
      openingFee: safeOpeningFee,
      closingFee: safeClosingFee,
      fundingFee: safeFundingFee,
      netPnl: safeNetPnl
    });
    const warnings = [...parsedDate.warnings, ...sideInference.warnings];
    const sourceRowHash = sourceRowHashFor(rawRow);

    rows.push({
      rowIndex,
      raw: rawRow,
      exchange: 'BYBIT',
      marketType: 'PERPETUAL',
      sourceType: 'BYBIT_CLOSED_PNL',
      sourceFileName: file.fileName,
      sourceFileHash: file.fileHash,
      sourceRowHash,
      duplicateKey: bybitClosedPnlDuplicateKey({
        exchange: 'BYBIT',
        symbol,
        quantity: safeQuantity,
        avgEntryPrice: safeEntryPrice,
        avgExitPrice: safeExitPrice,
        closedAt: parsedDate.date,
        netPnl: safeNetPnl,
        openingFee: safeOpeningFee,
        closingFee: safeClosingFee
      }),
      symbol,
      quantity: safeQuantity,
      avgEntryPrice: safeEntryPrice,
      avgExitPrice: safeExitPrice,
      openingFee: safeOpeningFee,
      closingFee: safeClosingFee,
      fundingFee: safeFundingFee,
      grossPnl,
      netPnl: safeNetPnl,
      closedAt: parsedDate.date,
      tradeType,
      inferredSide: sideInference.side,
      sideInferenceConfidence: sideInference.confidence,
      formulaTolerance: sideInference.tolerance,
      warnings
    });
  }

  return {
    sourceFile: file,
    rows,
    rejectedRows
  };
}

export function parseBybitTradeHistoryRows(file: BybitParsedFile, timezone = 'UTC'): BybitParsedTradeHistory {
  const executions: BybitExecution[] = [];
  const fundingRows: BybitFundingEntry[] = [];
  const rejectedRows: BybitRejectedRow[] = [];

  for (const [index, rawRow] of file.rows.entries()) {
    const rowIndex = index + 2;
    const symbol = getCell(rawRow, tradeHistoryColumns.market)?.toUpperCase() ?? '';
    const filledType = getCell(rawRow, tradeHistoryColumns.filledType) ?? '';
    const executedAtValue = getCell(rawRow, tradeHistoryColumns.transactionTime);
    const parsedDate = parseBybitDate(executedAtValue ?? '', timezone);
    const fee = parseNumber(getCell(rawRow, tradeHistoryColumns.tradingFee)) ?? 0;
    const feeCoin = getCell(rawRow, tradeHistoryColumns.feeCoin) || null;
    const sourceRowHash = sourceRowHashFor(rawRow);
    const warnings = [...parsedDate.warnings];

    if (!symbol || !filledType || !parsedDate.date) {
      rejectedRows.push(
        makeRejectedRow(
          file,
          rowIndex,
          rawRow,
          [
            !symbol ? 'Missing Market' : null,
            !filledType ? 'Missing Filled Type' : null,
            parsedDate.date ? null : 'Invalid Transaction Time(UTC+0)'
          ]
            .filter(Boolean)
            .join('; ')
        )
      );
      continue;
    }

    if (isFundingFilledType(filledType)) {
      fundingRows.push({
        rowIndex,
        raw: rawRow,
        exchange: 'BYBIT',
        marketType: 'PERPETUAL',
        sourceType: 'BYBIT_TRADE_HISTORY',
        sourceFileName: file.fileName,
        sourceFileHash: file.fileHash,
        sourceRowHash,
        duplicateKey: bybitFundingDuplicateKey({
          symbol,
          amount: fee,
          currency: feeCoin,
          executedAt: parsedDate.date,
          sourceRowHash
        }),
        symbol,
        amount: fee,
        currency: feeCoin,
        fundingType: filledType,
        executedAt: parsedDate.date,
        warnings
      });
      continue;
    }

    const quantity = parseNumber(getCell(rawRow, tradeHistoryColumns.filledQuantity));
    const filledPrice = parseNumber(getCell(rawRow, tradeHistoryColumns.filledPrice));
    const orderPrice = parseNumber(getCell(rawRow, tradeHistoryColumns.orderPrice));
    const feeRate = parseNumber(getCell(rawRow, tradeHistoryColumns.feeRate));
    const execFeeV2 = parseNumber(getCell(rawRow, tradeHistoryColumns.execFeeV2));
    const direction = getCell(rawRow, tradeHistoryColumns.direction) || null;
    const orderType = getCell(rawRow, tradeHistoryColumns.orderType) || null;
    const tradeId = getCell(rawRow, tradeHistoryColumns.tradeId) || null;
    const orderId = getCell(rawRow, tradeHistoryColumns.orderId) || null;
    const invalid = [
      quantity === null || !Number.isFinite(quantity) ? 'Filled Quantity' : null,
      filledPrice === null || !Number.isFinite(filledPrice) ? 'Filled Price' : null
    ].filter(Boolean);

    if (invalid.length) {
      rejectedRows.push(makeRejectedRow(file, rowIndex, rawRow, `Invalid trade values: ${invalid.join(', ')}`));
      continue;
    }

    executions.push({
      rowIndex,
      raw: rawRow,
      exchange: 'BYBIT',
      marketType: 'PERPETUAL',
      sourceType: 'BYBIT_TRADE_HISTORY',
      sourceFileName: file.fileName,
      sourceFileHash: file.fileHash,
      sourceRowHash,
      duplicateKey: bybitExecutionDuplicateKey({
        tradeId,
        orderId,
        executedAt: parsedDate.date,
        symbol,
        quantity: quantity ?? 0,
        filledPrice: filledPrice ?? 0,
        sourceRowHash
      }),
      symbol,
      filledType,
      quantity: quantity ?? 0,
      filledPrice: filledPrice ?? 0,
      orderPrice,
      feeRate,
      fee,
      feeCoin,
      execFeeV2,
      direction,
      orderType,
      tradeId,
      orderId,
      executedAt: parsedDate.date,
      warnings
    });
  }

  return {
    sourceFile: file,
    executions,
    fundingRows,
    rejectedRows
  };
}

export function inferClosedPnlSide({
  quantity,
  avgEntryPrice,
  avgExitPrice,
  openingFee,
  closingFee,
  fundingFee,
  netPnl
}: {
  quantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  openingFee: number;
  closingFee: number;
  fundingFee: number;
  netPnl: number;
}): {
  side: BybitPositionSide;
  confidence: number;
  tolerance: number;
  longNetCandidate: number;
  shortNetCandidate: number;
  warnings: string[];
} {
  const fees = openingFee + closingFee + fundingFee;
  const longNetCandidate = (avgExitPrice - avgEntryPrice) * quantity - fees;
  const shortNetCandidate = (avgEntryPrice - avgExitPrice) * quantity - fees;
  const longDiff = Math.abs(longNetCandidate - netPnl);
  const shortDiff = Math.abs(shortNetCandidate - netPnl);
  const tolerance = Math.max(0.01, Math.abs(netPnl) * 0.0001, Math.abs(avgEntryPrice * quantity) * 0.000001);
  const warnings: string[] = [];

  if (Math.abs(longDiff - shortDiff) <= tolerance * 0.1) {
    warnings.push('Side inference is ambiguous because long and short formulas are similarly close.');
    return {
      side: 'UNKNOWN',
      confidence: 0,
      tolerance,
      longNetCandidate,
      shortNetCandidate,
      warnings
    };
  }

  const bestSide: BybitPositionSide = longDiff < shortDiff ? 'LONG' : 'SHORT';
  const bestDiff = Math.min(longDiff, shortDiff);

  if (bestDiff > tolerance) {
    warnings.push('Realized P&L did not match the long or short fee-adjusted formula within tolerance.');
    return {
      side: 'UNKNOWN',
      confidence: 0,
      tolerance,
      longNetCandidate,
      shortNetCandidate,
      warnings
    };
  }

  return {
    side: bestSide,
    confidence: clamp01(1 - bestDiff / tolerance),
    tolerance,
    longNetCandidate,
    shortNetCandidate,
    warnings
  };
}

export function matchBybitClosedPnlToExecutions(
  segments: BybitClosedPnlSegment[],
  executions: BybitExecution[],
  fundingRows: BybitFundingEntry[] = []
): BybitMatchResult {
  const warnings: string[] = [];
  const matchedExecutionRowIndexes = new Set<number>();
  let matchedClosedPnlRows = 0;

  for (const segment of segments) {
    const candidates = executions
      .filter((execution) => {
        if (execution.symbol !== segment.symbol) return false;
        const priceTolerance = Math.max(0.01, Math.abs(segment.avgExitPrice) * 0.0005);
        const timeDiff = Math.abs(execution.executedAt.getTime() - segment.closedAt.getTime());
        return Math.abs(execution.filledPrice - segment.avgExitPrice) <= priceTolerance && timeDiff <= 24 * 60 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          Math.abs(a.executedAt.getTime() - segment.closedAt.getTime()) -
          Math.abs(b.executedAt.getTime() - segment.closedAt.getTime())
      );

    let quantity = 0;
    const selected: BybitExecution[] = [];
    for (const candidate of candidates) {
      quantity += candidate.quantity;
      selected.push(candidate);
      if (quantity >= segment.quantity) break;
    }

    const quantityTolerance = Math.max(0.00000001, segment.quantity * 0.001);
    if (selected.length && Math.abs(quantity - segment.quantity) <= quantityTolerance) {
      matchedClosedPnlRows += 1;
      for (const execution of selected) {
        matchedExecutionRowIndexes.add(execution.rowIndex);
      }
    }
  }

  const closedTradeFeeTotal = segments.length
    ? roundForComparison(segments.reduce((total, segment) => total + segment.openingFee + segment.closingFee, 0))
    : null;
  const executionFeeTotal = executions.length
    ? roundForComparison(executions.reduce((total, execution) => total + execution.fee, 0))
    : null;
  const feeTolerance =
    closedTradeFeeTotal !== null && executionFeeTotal !== null ? Math.max(0.01, Math.abs(closedTradeFeeTotal) * 0.01) : null;
  const feeDifference =
    closedTradeFeeTotal !== null && executionFeeTotal !== null ? roundForComparison(Math.abs(closedTradeFeeTotal - executionFeeTotal)) : null;
  const feeValidationStatus: BybitFeeValidationStatus =
    feeDifference === null || feeTolerance === null ? 'SKIPPED' : feeDifference <= feeTolerance ? 'PASSED' : 'WARNING';

  if (feeValidationStatus === 'WARNING') {
    warnings.push('Trade History fees do not reconcile with Closed PnL opening plus closing fees within tolerance.');
  }

  const quantityValidationStatus =
    !segments.length || !executions.length ? 'SKIPPED' : matchedClosedPnlRows === segments.length ? 'PASSED' : 'WARNING';

  if (quantityValidationStatus === 'WARNING') {
    warnings.push('Some Closed PnL rows could not be matched to nearby executions by symbol, exit price, time, and quantity.');
  }

  const matchedRatio = segments.length ? matchedClosedPnlRows / segments.length : 0;
  const feeScore = feeValidationStatus === 'PASSED' ? 0.4 : feeValidationStatus === 'SKIPPED' ? 0 : 0.15;
  const matchScore = matchedRatio * 0.4;
  const symbolOverlap = calculateSymbolOverlap(segments, executions) * 0.2;
  const reconstructionConfidence = segments.length && executions.length ? clamp01(feeScore + matchScore + symbolOverlap) : 0;

  return {
    matchedClosedPnlRows,
    unmatchedClosedPnlRows: Math.max(0, segments.length - matchedClosedPnlRows),
    matchedTradeHistoryExecutions: matchedExecutionRowIndexes.size,
    unmatchedExecutions: Math.max(0, executions.length - matchedExecutionRowIndexes.size),
    fundingRows: fundingRows.length,
    feeValidationStatus,
    feeDifference,
    feeTolerance,
    closedTradeFeeTotal,
    executionFeeTotal,
    quantityValidationStatus,
    reconstructionConfidence,
    matchedExecutionRowIndexes: Array.from(matchedExecutionRowIndexes).sort((a, b) => a - b),
    warnings
  };
}

export function reconstructBybitPositions({
  segments,
  executions,
  matchResult,
  dataQuality
}: {
  segments: BybitClosedPnlSegment[];
  executions: BybitExecution[];
  matchResult: BybitMatchResult;
  dataQuality: BybitDataQuality;
}): BybitReconstructedPosition[] {
  if (!segments.length) return [];

  const shouldUsePositionLevel = dataQuality === 'HIGH' && matchResult.reconstructionConfidence >= 0.7;
  const groups = groupClosedPnlSegments(segments);

  return groups
    .map((group, index) => {
      const groupExecutions = shouldUsePositionLevel
        ? executions.filter((execution) => {
            const earliestClose = Math.min(...group.map((segment) => segment.closedAt.getTime()));
            const latestClose = Math.max(...group.map((segment) => segment.closedAt.getTime()));
            return (
              execution.symbol === group[0]?.symbol &&
              execution.executedAt.getTime() <= latestClose + 5 * 60 * 1000 &&
              execution.executedAt.getTime() >= earliestClose - 7 * 24 * 60 * 60 * 1000
            );
          })
        : [];
      const quantity = group.reduce((total, segment) => total + segment.quantity, 0);
      const openedAt = groupExecutions.length
        ? new Date(Math.min(...groupExecutions.map((execution) => execution.executedAt.getTime())))
        : null;
      const closedAt = new Date(Math.max(...group.map((segment) => segment.closedAt.getTime())));
      const openingFee = group.reduce((total, segment) => total + segment.openingFee, 0);
      const closingFee = group.reduce((total, segment) => total + segment.closingFee, 0);
      const fundingFee = group.reduce((total, segment) => total + segment.fundingFee, 0);
      const netPnl = group.reduce((total, segment) => total + segment.netPnl, 0);
      const grossPnl = netPnl + openingFee + closingFee + fundingFee;
      const positionDataQuality: BybitDataQuality = shouldUsePositionLevel ? dataQuality : 'MEDIUM';

      return {
        tempId: `bybit-position-${index + 1}`,
        symbol: group[0]?.symbol ?? 'UNKNOWN',
        side: group[0]?.inferredSide ?? 'UNKNOWN',
        quantity,
        avgEntryPrice: weightedAverage(group, 'avgEntryPrice'),
        avgExitPrice: weightedAverage(group, 'avgExitPrice'),
        openingFee,
        closingFee,
        fundingFee,
        grossPnl,
        netPnl,
        openedAt,
        closedAt,
        confidenceScore: shouldUsePositionLevel ? matchResult.reconstructionConfidence : 0.55,
        dataQuality: positionDataQuality,
        segmentRowIndexes: group.map((segment) => segment.rowIndex),
        executionRowIndexes: groupExecutions.map((execution) => execution.rowIndex),
        warnings: shouldUsePositionLevel ? [] : ['Position grouping is available only as a medium-confidence segment grouping.']
      };
    })
    .filter((position) => position.side !== 'UNKNOWN');
}

export function groupClosedPnlSegments(segments: BybitClosedPnlSegment[]): BybitClosedPnlSegment[][] {
  const sorted = [...segments].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
  const groups: BybitClosedPnlSegment[][] = [];

  for (const segment of sorted) {
    const lastMatchingGroup = groups.find((group) => {
      const first = group[0];
      const last = group[group.length - 1];
      if (!first || !last) return false;
      const sameKey =
        first.symbol === segment.symbol &&
        first.inferredSide === segment.inferredSide &&
        Math.abs(first.avgEntryPrice - segment.avgEntryPrice) <= Math.max(0.00000001, first.avgEntryPrice * 0.000001) &&
        (first.tradeType ?? '') === (segment.tradeType ?? '');
      const closeEnough = segment.closedAt.getTime() - last.closedAt.getTime() <= 24 * 60 * 60 * 1000;
      return sameKey && closeEnough;
    });

    if (lastMatchingGroup) {
      lastMatchingGroup.push(segment);
    } else {
      groups.push([segment]);
    }
  }

  return groups;
}

export function inferBybitDataQuality({
  closedRows,
  executionRows,
  unknownFiles,
  matchResult
}: {
  closedRows: number;
  executionRows: number;
  unknownFiles: number;
  matchResult: BybitMatchResult;
}): BybitDataQuality {
  if (unknownFiles > 0 || (!closedRows && !executionRows)) return 'LOW';
  if (closedRows && executionRows && matchResult.feeValidationStatus === 'PASSED' && matchResult.reconstructionConfidence >= 0.7) {
    return 'HIGH';
  }
  if (closedRows) return 'MEDIUM';
  if (executionRows) return 'LIMITED';
  return 'LOW';
}

export function bybitClosedPnlDuplicateKey({
  exchange,
  symbol,
  quantity,
  avgEntryPrice,
  avgExitPrice,
  closedAt,
  netPnl,
  openingFee,
  closingFee
}: {
  exchange: string;
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  closedAt: Date;
  netPnl: number;
  openingFee: number;
  closingFee: number;
}) {
  return [
    exchange.toUpperCase(),
    symbol.toUpperCase(),
    normalizeNumberForKey(quantity),
    normalizeNumberForKey(avgEntryPrice),
    normalizeNumberForKey(avgExitPrice),
    closedAt.toISOString(),
    normalizeNumberForKey(netPnl),
    normalizeNumberForKey(openingFee),
    normalizeNumberForKey(closingFee)
  ].join('|');
}

export function bybitExecutionDuplicateKey({
  tradeId,
  orderId,
  executedAt,
  symbol,
  quantity,
  filledPrice,
  sourceRowHash
}: {
  tradeId: string | null;
  orderId: string | null;
  executedAt: Date;
  symbol: string;
  quantity: number;
  filledPrice: number;
  sourceRowHash: string;
}) {
  if (tradeId) {
    return [
      tradeId,
      orderId ?? '',
      executedAt.toISOString(),
      symbol.toUpperCase(),
      normalizeNumberForKey(quantity),
      normalizeNumberForKey(filledPrice)
    ].join('|');
  }

  return `row:${sourceRowHash}`;
}

export function bybitFundingDuplicateKey({
  symbol,
  amount,
  currency,
  executedAt,
  sourceRowHash
}: {
  symbol: string;
  amount: number;
  currency: string | null;
  executedAt: Date;
  sourceRowHash: string;
}) {
  return [
    symbol.toUpperCase(),
    normalizeNumberForKey(amount),
    currency ?? '',
    executedAt.toISOString(),
    sourceRowHash
  ].join('|');
}

export function parseBybitDate(value: string, timezone = 'UTC'): { date: Date | null; warnings: string[] } {
  const raw = value.trim();
  const warnings: string[] = [];
  if (!raw) return { date: null, warnings };

  const serial = Number(raw);
  if (Number.isFinite(serial) && serial > 20000 && serial < 100000) {
    return { date: excelSerialDateToUtc(serial), warnings };
  }

  const normalized = raw.replace(/\s+/g, ' ');
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized)) {
    const parsed = new Date(normalized.replace(' ', 'T'));
    return Number.isNaN(parsed.getTime()) ? { date: null, warnings } : { date: parsed, warnings };
  }

  const match = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
  );
  if (!match) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? { date: null, warnings } : { date: parsed, warnings };
  }

  const [, year, month, day, hour = '0', minute = '0', second = '0', millisecond = '0'] = match;
  const utcLike = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.padEnd(3, '0'))
  );
  const offset = getTimezoneOffsetMinutes(timezone, new Date(utcLike), warnings);
  return {
    date: new Date(utcLike - offset * 60 * 1000),
    warnings
  };
}

function chooseFile(files: BybitParsedFile[], type: BybitDetectedFileType, warnings: string[]) {
  const matches = files.filter((file) => file.detection.detectedFileType === type);
  if (matches.length > 1) {
    warnings.push(`Multiple ${type} files were detected. The highest-confidence file was used for preview.`);
  }
  return matches.sort((a, b) => b.detection.confidenceScore - a.detection.confidenceScore)[0] ?? null;
}

function emptyClosedPnl(): BybitParsedClosedPnl {
  return {
    sourceFile: null,
    rows: [],
    rejectedRows: []
  };
}

function emptyTradeHistory(): BybitParsedTradeHistory {
  return {
    sourceFile: null,
    executions: [],
    fundingRows: [],
    rejectedRows: []
  };
}

function scoreSignature<T extends Record<string, readonly string[]>>(
  headers: string[],
  columns: T,
  requiredKeys: Array<keyof T>
) {
  const missingColumns: string[] = [];
  let matches = 0;

  for (const key of requiredKeys) {
    if (hasHeader(headers, columns[key])) {
      matches += 1;
    } else {
      missingColumns.push(columns[key][0] ?? String(key));
    }
  }

  return {
    confidenceScore: Math.round((matches / requiredKeys.length) * 100),
    missingColumns
  };
}

function detectDateRange(rows: Record<string, string>[], detectedFileType: BybitDetectedFileType) {
  const aliases =
    detectedFileType === 'BYBIT_CLOSED_PNL'
      ? closedPnlColumns.tradeTime
      : detectedFileType === 'BYBIT_TRADE_HISTORY'
        ? tradeHistoryColumns.transactionTime
        : [...closedPnlColumns.tradeTime, ...tradeHistoryColumns.transactionTime];
  const dates = rows
    .map((row) => getCell(row, aliases))
    .map((value) => (value ? parseBybitDate(value, 'UTC').date : null))
    .filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    start: dates[0]?.toISOString() ?? null,
    end: dates.at(-1)?.toISOString() ?? null
  };
}

function getCell(row: Record<string, string>, aliases: readonly string[]) {
  const lookup = new Map(Object.keys(row).map((header) => [normalizeHeader(header), header]));
  const matchedHeader = aliases.map(normalizeHeader).find((alias) => lookup.has(alias));
  if (!matchedHeader) return '';
  const value = row[lookup.get(matchedHeader) ?? ''];
  return typeof value === 'string' ? value.trim() : '';
}

function hasHeader(headers: string[], aliases: readonly string[]) {
  const normalizedHeaders = new Set(headers.map(normalizeHeader));
  return aliases.map(normalizeHeader).some((alias) => normalizedHeaders.has(alias));
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[\uFEFF]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/[^\p{L}\p{N}&+ ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isParenthetical = /^\(.*\)$/.test(trimmed);
  const normalized = trimmed.replace(/[,$%]/g, '').replace(/[()]/g, '').replace(/\s+/g, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return isParenthetical ? -parsed : parsed;
}

function isFundingFilledType(value: string) {
  return normalizeHeader(value) === 'funding';
}

function makeRejectedRow(
  file: BybitParsedFile,
  rowIndex: number,
  raw: Record<string, string>,
  reason: string
): BybitRejectedRow {
  return {
    rowIndex,
    sourceFileName: file.fileName,
    detectedFileType: file.detection.detectedFileType,
    reason,
    raw
  };
}

function cleanRows(rows: Array<Record<string, unknown>>) {
  return rows
    .map((row) => {
      const cleaned: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const header = key.trim();
        if (!header) continue;
        cleaned[header] = value === null || value === undefined ? '' : String(value).trim();
      }
      return cleaned;
    })
    .filter((row) => Object.values(row).some((value) => value.trim()));
}

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, '');
}

function sourceRowHashFor(row: Record<string, string>) {
  return sha256(stableStringify(row));
}

function stableStringify(row: Record<string, string>) {
  return JSON.stringify(
    Object.keys(row)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = row[key] ?? '';
        return acc;
      }, {})
  );
}

function sha256(value: Buffer | string) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeNumberForKey(value: number) {
  return Number(value).toFixed(8);
}

function roundForComparison(value: number) {
  return Math.round(value * 100000000) / 100000000;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function calculateSymbolOverlap(segments: BybitClosedPnlSegment[], executions: BybitExecution[]) {
  if (!segments.length || !executions.length) return 0;
  const executionSymbols = new Set(executions.map((execution) => execution.symbol));
  const matchingSymbols = new Set(segments.filter((segment) => executionSymbols.has(segment.symbol)).map((segment) => segment.symbol));
  const segmentSymbols = new Set(segments.map((segment) => segment.symbol));
  return matchingSymbols.size / segmentSymbols.size;
}

function groupKey(segment: BybitClosedPnlSegment) {
  return [
    segment.symbol,
    segment.inferredSide,
    normalizeNumberForKey(segment.avgEntryPrice),
    segment.tradeType ?? ''
  ].join('|');
}

function weightedAverage(segments: BybitClosedPnlSegment[], field: 'avgEntryPrice' | 'avgExitPrice') {
  const totalQuantity = segments.reduce((total, segment) => total + segment.quantity, 0);
  if (!totalQuantity) return 0;
  return segments.reduce((total, segment) => total + segment[field] * segment.quantity, 0) / totalQuantity;
}

function getTimezoneOffsetMinutes(timezone: string, date: Date, warnings: string[]) {
  const normalized = timezone.trim();
  if (!normalized || ['UTC', 'Etc/UTC', 'GMT', 'UTC+0', 'UTC+00:00', '+00:00'].includes(normalized)) return 0;

  const offsetMatch = normalized.match(/^(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1;
    const hours = Number(offsetMatch[2]);
    const minutes = Number(offsetMatch[3] ?? '0');
    return sign * (hours * 60 + minutes);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: normalized,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return (asUtc - date.getTime()) / 60000;
  } catch {
    warnings.push(`Unknown timezone "${timezone}". Parsed this timestamp as UTC.`);
    return 0;
  }
}

function excelSerialDateToUtc(serial: number) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  return new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
}
