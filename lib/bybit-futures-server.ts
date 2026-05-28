import type { PrismaClient } from '@prisma/client';
import {
  BYBIT_FUTURES_ADAPTER_VERSION,
  buildBybitFuturesImportAnalysis,
  readBybitUploadedFile,
  type BybitClosedPnlSegment,
  type BybitDataQuality,
  type BybitExecution,
  type BybitFundingEntry,
  type BybitImportAnalysis,
  type BybitParsedFile,
  type BybitRejectedRow,
  type BybitReconstructedPosition
} from './bybit-futures';

export type BybitImportResult = {
  batchId: string;
  dataQuality: BybitDataQuality;
  totalRows: number;
  importedClosedPnlSegments: number;
  importedExecutions: number;
  importedFundingEntries: number;
  reconstructedPositions: number;
  duplicatesSkipped: number;
  rejectedRows: number;
  matchResult: BybitImportAnalysis['matchResult'];
  errors: Array<{ rowNumber: number; reason: string; raw: Record<string, string> }>;
};

export async function previewBybitFuturesImport({
  closedPnlFile,
  tradeHistoryFile,
  timezone = 'UTC'
}: {
  closedPnlFile: File | null;
  tradeHistoryFile: File | null;
  timezone?: string;
}) {
  const files = await parseBybitFiles({ closedPnlFile, tradeHistoryFile });
  return buildBybitFuturesImportAnalysis({ files, timezone });
}

export async function importBybitFutures({
  db,
  userId,
  closedPnlFile,
  tradeHistoryFile,
  timezone = 'UTC'
}: {
  db: PrismaClient;
  userId: string;
  closedPnlFile: File | null;
  tradeHistoryFile: File | null;
  timezone?: string;
}): Promise<BybitImportResult> {
  const analysis = await previewBybitFuturesImport({ closedPnlFile, tradeHistoryFile, timezone });
  const duplicateKeys = await findExistingDuplicateKeys({ db, userId, analysis });
  const duplicateClosed = analysis.closedPnl.rows.filter((row) => duplicateKeys.closedPnl.has(row.duplicateKey));
  const duplicateExecutions = analysis.tradeHistory.executions.filter((row) => duplicateKeys.executions.has(row.duplicateKey));
  const duplicateFunding = analysis.tradeHistory.fundingRows.filter((row) => duplicateKeys.funding.has(row.duplicateKey));
  const acceptedClosed = analysis.closedPnl.rows.filter((row) => !duplicateKeys.closedPnl.has(row.duplicateKey));
  const acceptedExecutions = analysis.tradeHistory.executions.filter((row) => !duplicateKeys.executions.has(row.duplicateKey));
  const acceptedFunding = analysis.tradeHistory.fundingRows.filter((row) => !duplicateKeys.funding.has(row.duplicateKey));
  const rejectedRows = [
    ...analysis.closedPnl.rejectedRows,
    ...analysis.tradeHistory.rejectedRows,
    ...duplicateClosed.map((row) => duplicateRejected(row, 'Duplicate Closed PnL segment already exists.')),
    ...duplicateExecutions.map((row) => duplicateRejected(row, 'Duplicate Trade History execution already exists.')),
    ...duplicateFunding.map((row) => duplicateRejected(row, 'Duplicate funding entry already exists.'))
  ];
  const totalRows = analysis.files.reduce((total, file) => total + file.rows.length, 0);
  const fileNames = analysis.files.map((file) => file.fileName).join(' + ');
  const combinedHash = analysis.files.map((file) => file.fileHash).join('|');

  const batch = await db.importBatch.create({
    data: {
      userId,
      filename: fileNames || 'bybit-futures-import',
      broker: 'Bybit Futures',
      status: 'PROCESSING',
      exchange: 'BYBIT',
      marketType: 'PERPETUAL',
      sourceType: sourceTypeForAnalysis(analysis),
      dataQuality: analysis.dataQuality,
      adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
      timezone: analysis.timezone,
      sourceFileHash: combinedHash || null,
      totalRows,
      importedRows: 0,
      rejectedRows: rejectedRows.length
    }
  });

  const exchangeFiles = new Map<string, string>();
  for (const file of analysis.files) {
    const created = await db.exchangeImportFile.create({
      data: {
        userId,
        batchId: batch.id,
        sourceFileName: file.fileName,
        sourceFileHash: file.fileHash,
        sourceType: file.detection.detectedFileType,
        adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
        detectedExchange: file.detection.detectedExchange,
        detectedFileType: file.detection.detectedFileType,
        confidenceScore: file.detection.confidenceScore,
        rowCount: file.detection.rowCount,
        symbolCount: file.detection.symbolCount,
        dateStart: file.detection.dateRange.start ? new Date(file.detection.dateRange.start) : null,
        dateEnd: file.detection.dateRange.end ? new Date(file.detection.dateRange.end) : null,
        warnings: file.detection.warnings,
        errors: file.detection.missingColumns
      }
    });
    exchangeFiles.set(file.fileHash, created.id);
  }

  const closedIdsByRowIndex = new Map<number, string>();
  for (const row of acceptedClosed) {
    const created = await db.closedPnlSegment.create({
      data: {
        userId,
        batchId: batch.id,
        exchangeImportFileId: exchangeFiles.get(row.sourceFileHash) ?? null,
        sourceFileName: row.sourceFileName,
        sourceFileHash: row.sourceFileHash,
        sourceType: row.sourceType,
        adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
        rowIndex: row.rowIndex,
        exchange: row.exchange,
        marketType: row.marketType,
        symbol: row.symbol,
        quantity: row.quantity,
        avgEntryPrice: row.avgEntryPrice,
        avgExitPrice: row.avgExitPrice,
        openingFee: row.openingFee,
        closingFee: row.closingFee,
        fundingFee: row.fundingFee,
        grossPnl: row.grossPnl,
        netPnl: row.netPnl,
        closedAt: row.closedAt,
        tradeType: row.tradeType,
        inferredSide: row.inferredSide,
        sideInferenceConfidence: row.sideInferenceConfidence,
        formulaTolerance: row.formulaTolerance,
        duplicateKey: row.duplicateKey,
        sourceRowHash: row.sourceRowHash,
        warnings: row.warnings,
        errors: []
      }
    });
    closedIdsByRowIndex.set(row.rowIndex, created.id);
  }

  const executionIdsByRowIndex = new Map<number, string>();
  for (const row of acceptedExecutions) {
    const created = await db.importedExecution.create({
      data: {
        userId,
        batchId: batch.id,
        exchangeImportFileId: exchangeFiles.get(row.sourceFileHash) ?? null,
        sourceFileName: row.sourceFileName,
        sourceFileHash: row.sourceFileHash,
        sourceType: row.sourceType,
        adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
        rowIndex: row.rowIndex,
        exchange: row.exchange,
        marketType: row.marketType,
        symbol: row.symbol,
        filledType: row.filledType,
        quantity: row.quantity,
        filledPrice: row.filledPrice,
        orderPrice: row.orderPrice,
        feeRate: row.feeRate,
        fee: row.fee,
        feeCoin: row.feeCoin,
        execFeeV2: row.execFeeV2,
        direction: row.direction,
        orderType: row.orderType,
        tradeId: row.tradeId,
        orderId: row.orderId,
        executedAt: row.executedAt,
        duplicateKey: row.duplicateKey,
        sourceRowHash: row.sourceRowHash,
        warnings: row.warnings,
        errors: []
      }
    });
    executionIdsByRowIndex.set(row.rowIndex, created.id);
  }

  for (const row of acceptedFunding) {
    await db.importedFundingEntry.create({
      data: {
        userId,
        batchId: batch.id,
        exchangeImportFileId: exchangeFiles.get(row.sourceFileHash) ?? null,
        sourceFileName: row.sourceFileName,
        sourceFileHash: row.sourceFileHash,
        sourceType: row.sourceType,
        adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
        rowIndex: row.rowIndex,
        exchange: row.exchange,
        marketType: row.marketType,
        symbol: row.symbol,
        amount: row.amount,
        currency: row.currency,
        fundingType: row.fundingType,
        executedAt: row.executedAt,
        duplicateKey: row.duplicateKey,
        sourceRowHash: row.sourceRowHash,
        warnings: row.warnings,
        errors: []
      }
    });
  }

  let reconstructedPositions = 0;
  for (const position of analysis.reconstructedPositions.filter((item) => item.confidenceScore >= 0.7)) {
    const closedSegmentIds = position.segmentRowIndexes
      .map((rowIndex) => closedIdsByRowIndex.get(rowIndex))
      .filter((id): id is string => Boolean(id));
    if (closedSegmentIds.length !== position.segmentRowIndexes.length) continue;

    const created = await createReconstructedPosition({
      db,
      userId,
      batchId: batch.id,
      position
    });
    reconstructedPositions += 1;

    await db.closedPnlSegment.updateMany({
      where: { id: { in: closedSegmentIds } },
      data: { reconstructedPositionId: created.id }
    });

    for (const rowIndex of position.executionRowIndexes) {
      const executionId = executionIdsByRowIndex.get(rowIndex);
      if (!executionId) continue;
      await db.positionExecutionLink.create({
        data: {
          positionId: created.id,
          executionId,
          linkType: 'MATCHED_EXECUTION',
          confidenceScore: position.confidenceScore
        }
      });
    }
  }

  for (const row of rejectedRows) {
    await db.importRowError.create({
      data: {
        batchId: batch.id,
        rowNumber: row.rowIndex,
        reason: row.reason,
        raw: row.raw
      }
    });
  }

  const importedRows = acceptedClosed.length + acceptedExecutions.length + acceptedFunding.length;
  await db.importBatch.update({
    where: { id: batch.id },
    data: {
      status: rejectedRows.length ? 'IMPORTED_WITH_ERRORS' : 'IMPORTED',
      importedRows,
      rejectedRows: rejectedRows.length
    }
  });

  return {
    batchId: batch.id,
    dataQuality: analysis.dataQuality,
    totalRows,
    importedClosedPnlSegments: acceptedClosed.length,
    importedExecutions: acceptedExecutions.length,
    importedFundingEntries: acceptedFunding.length,
    reconstructedPositions,
    duplicatesSkipped: duplicateClosed.length + duplicateExecutions.length + duplicateFunding.length,
    rejectedRows: rejectedRows.length,
    matchResult: analysis.matchResult,
    errors: rejectedRows.map((row) => ({
      rowNumber: row.rowIndex,
      reason: row.reason,
      raw: row.raw
    }))
  };
}

async function parseBybitFiles({
  closedPnlFile,
  tradeHistoryFile
}: {
  closedPnlFile: File | null;
  tradeHistoryFile: File | null;
}) {
  const files: BybitParsedFile[] = [];

  if (closedPnlFile) {
    files.push(await readBybitUploadedFile({ file: closedPnlFile, requestedSlot: 'closedPnl' }));
  }

  if (tradeHistoryFile) {
    files.push(await readBybitUploadedFile({ file: tradeHistoryFile, requestedSlot: 'tradeHistory' }));
  }

  if (!files.length) {
    throw new Error('Upload a Bybit Closed PnL file or Trade History file.');
  }

  return files;
}

async function findExistingDuplicateKeys({
  db,
  userId,
  analysis
}: {
  db: PrismaClient;
  userId: string;
  analysis: BybitImportAnalysis;
}) {
  const [closedPnl, executions, funding] = await Promise.all([
    analysis.closedPnl.rows.length
      ? db.closedPnlSegment.findMany({
          where: {
            userId,
            duplicateKey: { in: analysis.closedPnl.rows.map((row) => row.duplicateKey) }
          },
          select: { duplicateKey: true }
        })
      : Promise.resolve([]),
    analysis.tradeHistory.executions.length
      ? db.importedExecution.findMany({
          where: {
            userId,
            duplicateKey: { in: analysis.tradeHistory.executions.map((row) => row.duplicateKey) }
          },
          select: { duplicateKey: true }
        })
      : Promise.resolve([]),
    analysis.tradeHistory.fundingRows.length
      ? db.importedFundingEntry.findMany({
          where: {
            userId,
            duplicateKey: { in: analysis.tradeHistory.fundingRows.map((row) => row.duplicateKey) }
          },
          select: { duplicateKey: true }
        })
      : Promise.resolve([])
  ]);

  return {
    closedPnl: new Set(closedPnl.map((row) => row.duplicateKey)),
    executions: new Set(executions.map((row) => row.duplicateKey)),
    funding: new Set(funding.map((row) => row.duplicateKey))
  };
}

function duplicateRejected(
  row: BybitClosedPnlSegment | BybitExecution | BybitFundingEntry,
  reason: string
): BybitRejectedRow {
  return {
    rowIndex: row.rowIndex,
    sourceFileName: row.sourceFileName,
    detectedFileType: row.sourceType,
    reason,
    raw: row.raw
  };
}

async function createReconstructedPosition({
  db,
  userId,
  batchId,
  position
}: {
  db: PrismaClient;
  userId: string;
  batchId: string;
  position: BybitReconstructedPosition;
}) {
  return db.reconstructedPosition.create({
    data: {
      userId,
      batchId,
      sourceType: 'BYBIT_RECONSTRUCTED_POSITION',
      adapterVersion: BYBIT_FUTURES_ADAPTER_VERSION,
      exchange: 'BYBIT',
      marketType: 'PERPETUAL',
      symbol: position.symbol,
      side: position.side,
      quantity: position.quantity,
      avgEntryPrice: position.avgEntryPrice,
      avgExitPrice: position.avgExitPrice,
      openingFee: position.openingFee,
      closingFee: position.closingFee,
      fundingFee: position.fundingFee,
      grossPnl: position.grossPnl,
      netPnl: position.netPnl,
      openedAt: position.openedAt,
      closedAt: position.closedAt,
      confidenceScore: position.confidenceScore,
      dataQuality: position.dataQuality,
      segmentRowIndexes: position.segmentRowIndexes,
      warnings: position.warnings
    }
  });
}

function sourceTypeForAnalysis(analysis: BybitImportAnalysis) {
  if (analysis.closedPnl.rows.length && analysis.tradeHistory.executions.length) return 'BYBIT_CLOSED_PNL_WITH_TRADE_HISTORY';
  if (analysis.closedPnl.rows.length) return 'BYBIT_CLOSED_PNL';
  if (analysis.tradeHistory.executions.length || analysis.tradeHistory.fundingRows.length) return 'BYBIT_TRADE_HISTORY';
  return 'UNKNOWN';
}

