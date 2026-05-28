ALTER TABLE "ImportBatch"
ADD COLUMN "exchange" TEXT,
ADD COLUMN "marketType" TEXT,
ADD COLUMN "sourceType" TEXT,
ADD COLUMN "dataQuality" TEXT,
ADD COLUMN "adapterVersion" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "sourceFileHash" TEXT;

CREATE TABLE "ExchangeImportFile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "sourceFileName" TEXT NOT NULL,
  "sourceFileHash" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "adapterVersion" TEXT NOT NULL,
  "detectedExchange" TEXT NOT NULL,
  "detectedFileType" TEXT NOT NULL,
  "confidenceScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "symbolCount" INTEGER NOT NULL DEFAULT 0,
  "dateStart" TIMESTAMP(3),
  "dateEnd" TIMESTAMP(3),
  "warnings" JSONB,
  "errors" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExchangeImportFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClosedPnlSegment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "exchangeImportFileId" TEXT,
  "reconstructedPositionId" TEXT,
  "sourceFileName" TEXT NOT NULL,
  "sourceFileHash" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "adapterVersion" TEXT NOT NULL,
  "rowIndex" INTEGER NOT NULL,
  "exchange" TEXT NOT NULL,
  "marketType" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "quantity" DECIMAL(28,10) NOT NULL,
  "avgEntryPrice" DECIMAL(28,10) NOT NULL,
  "avgExitPrice" DECIMAL(28,10) NOT NULL,
  "openingFee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "closingFee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "fundingFee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "grossPnl" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "netPnl" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "closedAt" TIMESTAMP(3) NOT NULL,
  "tradeType" TEXT,
  "inferredSide" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "sideInferenceConfidence" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "formulaTolerance" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "duplicateKey" TEXT NOT NULL,
  "sourceRowHash" TEXT NOT NULL,
  "warnings" JSONB,
  "errors" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClosedPnlSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportedExecution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "exchangeImportFileId" TEXT,
  "sourceFileName" TEXT NOT NULL,
  "sourceFileHash" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "adapterVersion" TEXT NOT NULL,
  "rowIndex" INTEGER NOT NULL,
  "exchange" TEXT NOT NULL,
  "marketType" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "filledType" TEXT NOT NULL,
  "quantity" DECIMAL(28,10) NOT NULL,
  "filledPrice" DECIMAL(28,10) NOT NULL,
  "orderPrice" DECIMAL(28,10),
  "feeRate" DECIMAL(28,10),
  "fee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "feeCoin" TEXT,
  "execFeeV2" DECIMAL(28,10),
  "direction" TEXT,
  "orderType" TEXT,
  "tradeId" TEXT,
  "orderId" TEXT,
  "executedAt" TIMESTAMP(3) NOT NULL,
  "duplicateKey" TEXT NOT NULL,
  "sourceRowHash" TEXT NOT NULL,
  "warnings" JSONB,
  "errors" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImportedExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportedFundingEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "exchangeImportFileId" TEXT,
  "sourceFileName" TEXT NOT NULL,
  "sourceFileHash" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "adapterVersion" TEXT NOT NULL,
  "rowIndex" INTEGER NOT NULL,
  "exchange" TEXT NOT NULL,
  "marketType" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "amount" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "currency" TEXT,
  "fundingType" TEXT,
  "executedAt" TIMESTAMP(3) NOT NULL,
  "duplicateKey" TEXT NOT NULL,
  "sourceRowHash" TEXT NOT NULL,
  "warnings" JSONB,
  "errors" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImportedFundingEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReconstructedPosition" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "adapterVersion" TEXT NOT NULL,
  "exchange" TEXT NOT NULL,
  "marketType" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "side" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "quantity" DECIMAL(28,10) NOT NULL,
  "avgEntryPrice" DECIMAL(28,10) NOT NULL,
  "avgExitPrice" DECIMAL(28,10) NOT NULL,
  "openingFee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "closingFee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "fundingFee" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "grossPnl" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "netPnl" DECIMAL(28,10) NOT NULL DEFAULT 0,
  "openedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3) NOT NULL,
  "confidenceScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "dataQuality" TEXT NOT NULL,
  "segmentRowIndexes" JSONB NOT NULL,
  "warnings" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReconstructedPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PositionExecutionLink" (
  "id" TEXT NOT NULL,
  "positionId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "linkType" TEXT NOT NULL,
  "confidenceScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PositionExecutionLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportBatch_exchange_marketType_idx" ON "ImportBatch"("exchange", "marketType");
CREATE INDEX "ExchangeImportFile_userId_createdAt_idx" ON "ExchangeImportFile"("userId", "createdAt");
CREATE INDEX "ExchangeImportFile_batchId_idx" ON "ExchangeImportFile"("batchId");
CREATE INDEX "ExchangeImportFile_detectedExchange_detectedFileType_idx" ON "ExchangeImportFile"("detectedExchange", "detectedFileType");
CREATE UNIQUE INDEX "ClosedPnlSegment_userId_duplicateKey_key" ON "ClosedPnlSegment"("userId", "duplicateKey");
CREATE INDEX "ClosedPnlSegment_batchId_idx" ON "ClosedPnlSegment"("batchId");
CREATE INDEX "ClosedPnlSegment_userId_closedAt_idx" ON "ClosedPnlSegment"("userId", "closedAt");
CREATE INDEX "ClosedPnlSegment_symbol_closedAt_idx" ON "ClosedPnlSegment"("symbol", "closedAt");
CREATE UNIQUE INDEX "ImportedExecution_userId_duplicateKey_key" ON "ImportedExecution"("userId", "duplicateKey");
CREATE INDEX "ImportedExecution_batchId_idx" ON "ImportedExecution"("batchId");
CREATE INDEX "ImportedExecution_userId_executedAt_idx" ON "ImportedExecution"("userId", "executedAt");
CREATE INDEX "ImportedExecution_symbol_executedAt_idx" ON "ImportedExecution"("symbol", "executedAt");
CREATE INDEX "ImportedExecution_tradeId_idx" ON "ImportedExecution"("tradeId");
CREATE INDEX "ImportedExecution_orderId_idx" ON "ImportedExecution"("orderId");
CREATE UNIQUE INDEX "ImportedFundingEntry_userId_duplicateKey_key" ON "ImportedFundingEntry"("userId", "duplicateKey");
CREATE INDEX "ImportedFundingEntry_batchId_idx" ON "ImportedFundingEntry"("batchId");
CREATE INDEX "ImportedFundingEntry_userId_executedAt_idx" ON "ImportedFundingEntry"("userId", "executedAt");
CREATE INDEX "ImportedFundingEntry_symbol_executedAt_idx" ON "ImportedFundingEntry"("symbol", "executedAt");
CREATE INDEX "ReconstructedPosition_batchId_idx" ON "ReconstructedPosition"("batchId");
CREATE INDEX "ReconstructedPosition_userId_closedAt_idx" ON "ReconstructedPosition"("userId", "closedAt");
CREATE INDEX "ReconstructedPosition_symbol_closedAt_idx" ON "ReconstructedPosition"("symbol", "closedAt");
CREATE UNIQUE INDEX "PositionExecutionLink_positionId_executionId_key" ON "PositionExecutionLink"("positionId", "executionId");
CREATE INDEX "PositionExecutionLink_executionId_idx" ON "PositionExecutionLink"("executionId");

ALTER TABLE "ExchangeImportFile" ADD CONSTRAINT "ExchangeImportFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExchangeImportFile" ADD CONSTRAINT "ExchangeImportFile_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClosedPnlSegment" ADD CONSTRAINT "ClosedPnlSegment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClosedPnlSegment" ADD CONSTRAINT "ClosedPnlSegment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClosedPnlSegment" ADD CONSTRAINT "ClosedPnlSegment_exchangeImportFileId_fkey" FOREIGN KEY ("exchangeImportFileId") REFERENCES "ExchangeImportFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClosedPnlSegment" ADD CONSTRAINT "ClosedPnlSegment_reconstructedPositionId_fkey" FOREIGN KEY ("reconstructedPositionId") REFERENCES "ReconstructedPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportedExecution" ADD CONSTRAINT "ImportedExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportedExecution" ADD CONSTRAINT "ImportedExecution_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportedExecution" ADD CONSTRAINT "ImportedExecution_exchangeImportFileId_fkey" FOREIGN KEY ("exchangeImportFileId") REFERENCES "ExchangeImportFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportedFundingEntry" ADD CONSTRAINT "ImportedFundingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportedFundingEntry" ADD CONSTRAINT "ImportedFundingEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportedFundingEntry" ADD CONSTRAINT "ImportedFundingEntry_exchangeImportFileId_fkey" FOREIGN KEY ("exchangeImportFileId") REFERENCES "ExchangeImportFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReconstructedPosition" ADD CONSTRAINT "ReconstructedPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReconstructedPosition" ADD CONSTRAINT "ReconstructedPosition_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionExecutionLink" ADD CONSTRAINT "PositionExecutionLink_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ReconstructedPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionExecutionLink" ADD CONSTRAINT "PositionExecutionLink_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "ImportedExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
