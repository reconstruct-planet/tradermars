'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Info,
  RotateCcw,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { ImportHistory } from '@/components/import/import-history';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CsvMapping,
  getMappedMetadata,
  getMissingRequiredMappings,
  guessMapping,
  importableTradeFields,
  normalizeRows,
  parseCsv,
  requiredImportFields
} from '@/lib/csv';
import type { ImportHistoryItem } from '@/lib/import-history';

type PreviewValidRow = {
  rowNumber: number;
  data: {
    symbol: string;
    side: string;
    quantity: number;
    entryPrice: number;
    exitPrice: number | null;
    entryTime: string;
    exitTime: string | null;
    fees: number;
    netPnl: number;
    strategy?: string | null;
    tags: string[];
  };
};

type PreviewInvalidRow = {
  rowNumber: number;
  reason: string;
  raw: Record<string, string>;
};

type PreviewResult = {
  totalRows: number;
  broker: string | null;
  account: string | null;
  validRows: PreviewValidRow[];
  invalidRows: PreviewInvalidRow[];
};

type ImportResult = {
  batchId: string;
  importedRows: number;
  rejectedRows: number;
  totalRows: number;
  broker: string | null;
  account: string | null;
  errors: PreviewInvalidRow[];
};

type ExchangeMode = 'GENERIC_CSV' | 'BYBIT_FUTURES';

type BybitDetection = {
  fileName: string;
  detectedExchange: string;
  detectedFileType: string;
  confidenceScore: number;
  rowCount: number;
  symbolCount: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  missingColumns: string[];
  warnings: string[];
};

type BybitPreviewRow = {
  rowIndex: number;
  symbol: string;
  warnings: string[];
};

type BybitClosedPnlPreviewRow = BybitPreviewRow & {
  inferredSide: string;
  quantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  grossPnl: number;
  netPnl: number;
  openingFee: number;
  closingFee: number;
  fundingFee: number;
  closedAt: string;
};

type BybitExecutionPreviewRow = BybitPreviewRow & {
  filledType: string;
  direction: string | null;
  quantity: number;
  filledPrice: number;
  orderType: string | null;
  fee: number;
  feeRate: number | null;
  tradeId: string | null;
  orderId: string | null;
  executedAt: string;
};

type BybitRejectedPreviewRow = {
  rowIndex: number;
  sourceFileName: string;
  reason: string;
  raw: Record<string, string>;
};

type BybitPreviewResult = {
  dataQuality: 'HIGH' | 'MEDIUM' | 'LIMITED' | 'LOW';
  timezone: string;
  files: Array<{ detection: BybitDetection }>;
  closedPnl: {
    rows: BybitClosedPnlPreviewRow[];
    rejectedRows: BybitRejectedPreviewRow[];
  };
  tradeHistory: {
    executions: BybitExecutionPreviewRow[];
    fundingRows: BybitPreviewRow[];
    rejectedRows: BybitRejectedPreviewRow[];
  };
  matchResult: {
    matchedClosedPnlRows: number;
    unmatchedClosedPnlRows: number;
    matchedTradeHistoryExecutions: number;
    unmatchedExecutions: number;
    fundingRows: number;
    feeValidationStatus: string;
    feeDifference: number | null;
    feeTolerance: number | null;
    closedTradeFeeTotal: number | null;
    executionFeeTotal: number | null;
    quantityValidationStatus: string;
    reconstructionConfidence: number;
    warnings: string[];
  };
  reconstructedPositions: Array<{ tempId: string }>;
  warnings: string[];
};

type BybitImportResult = {
  batchId: string;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LIMITED' | 'LOW';
  totalRows: number;
  importedClosedPnlSegments: number;
  importedExecutions: number;
  importedFundingEntries: number;
  reconstructedPositions: number;
  duplicatesSkipped: number;
  rejectedRows: number;
  errors: PreviewInvalidRow[];
};

export function ImportCenter({ history }: { history: ImportHistoryItem[] }) {
  const { t, formatCurrency } = useI18n();
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>('GENERIC_CSV');
  const [resetKey, setResetKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const localRows = useMemo(() => normalizeRows(rows, mapping), [mapping, rows]);
  const localValid = useMemo(() => localRows.filter((row) => row.ok), [localRows]);
  const localInvalid = useMemo(() => localRows.filter((row) => !row.ok), [localRows]);
  const missingRequiredMappings = useMemo(() => getMissingRequiredMappings(mapping), [mapping]);
  const metadata = useMemo(() => getMappedMetadata(rows, mapping), [mapping, rows]);
  const canPreview = Boolean(file && rows.length && !missingRequiredMappings.length);
  const stepLabels =
    exchangeMode === 'BYBIT_FUTURES'
      ? ['Select exchange', 'Upload files', 'Detect and preview', 'Import']
      : (t('importCenter.steps') as unknown as string[]);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setRows([]);
    setHeaders([]);
    setResult(null);
    setPreview(null);
    setError(null);

    if (!nextFile) return;

    try {
      if (!nextFile.name.toLowerCase().endsWith('.csv')) {
        throw new Error(t('importCenter.errors.csvOnly'));
      }
      const parsedRows = parseCsv(await nextFile.text());
      const nextHeaders = Object.keys(parsedRows[0] ?? {});
      if (!nextHeaders.length) {
        throw new Error(t('importCenter.errors.emptyCsv'));
      }
      setRows(parsedRows);
      setHeaders(nextHeaders);
      setMapping(guessMapping(nextHeaders));
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : t('importCenter.errors.parseFailed'));
    }
  }

  async function validateRows() {
    if (!file) return;
    setLoadingPreview(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    const response = await fetch('/api/import/preview', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json().catch(() => null);
    setLoadingPreview(false);

    if (!response.ok) {
      setError(payload?.error ?? t('importCenter.errors.previewFailed'));
      return;
    }

    setPreview(payload);
  }

  async function submitImport() {
    if (!file || !preview?.validRows.length) return;
    setLoadingImport(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json().catch(() => null);
    setLoadingImport(false);

    if (!response.ok) {
      setError(payload?.error ?? t('importCenter.errors.importFailed'));
      return;
    }

    setResult(payload);
  }

  function resetImport() {
    setFile(null);
    setRows([]);
    setHeaders([]);
    setMapping({});
    setError(null);
    setPreview(null);
    setResult(null);
    setResetKey((key) => key + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('importCenter.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('importCenter.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/sample-trades.csv">
              <Download className="mr-2 h-4 w-4" />
              {t('importCenter.sampleCsv')}
            </a>
          </Button>
          <Button variant="outline" onClick={resetImport}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('common.reset')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {stepLabels.map((label, index) => {
          const done = exchangeMode === 'BYBIT_FUTURES'
            ? index === 0
            : [
                Boolean(file),
                Boolean(headers.length && !missingRequiredMappings.length),
                Boolean(preview),
                Boolean(result)
              ][index];
          return (
          <Card key={label} className={done ? 'border-primary/40 bg-primary/5' : ''}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold">{index + 1}</span>
              <span className="text-sm font-medium">{label}</span>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exchange adapter</CardTitle>
          <CardDescription>Select a generic mapped CSV import or a broker-specific futures workflow.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(220px,320px),1fr] md:items-center">
          <Select
            value={exchangeMode}
            onChange={(event) => {
              resetImport();
              setExchangeMode(event.target.value as ExchangeMode);
            }}
          >
            <option value="GENERIC_CSV">Generic mapped CSV</option>
            <option value="BYBIT_FUTURES">Bybit Futures / Perpetual</option>
          </Select>
          <p className="text-sm text-muted-foreground">
            Bybit Futures uses Closed PnL as the performance source of truth and Trade History as execution detail.
          </p>
        </CardContent>
      </Card>

      {exchangeMode === 'BYBIT_FUTURES' ? (
        <BybitFuturesImportPanel key={resetKey} />
      ) : (
        <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            {t('importCenter.uploadTitle')}
          </CardTitle>
          <CardDescription>{t('importCenter.uploadDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-background p-8 text-center hover:bg-secondary/50">
            <UploadCloud className="mb-3 h-8 w-8 text-primary" />
            <span className="font-medium">{file ? file.name : t('importCenter.chooseFile')}</span>
            <span className="mt-1 text-sm text-muted-foreground">{t('importCenter.fileHelp')}</span>
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={onFileChange} />
          </label>
          {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {headers.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              {t('importCenter.detectedTitle')}
            </CardTitle>
            <CardDescription>{t('importCenter.detectedDescription', { columns: headers.length, rows: rows.length })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {headers.map((header) => <Badge key={header} variant="outline">{header}</Badge>)}
            </div>

            {missingRequiredMappings.length ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {t('importCenter.missingMappings', { fields: missingRequiredMappings.map((field) => t(`importCenter.fields.${field}`)).join(', ') })}
              </div>
            ) : (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                {t('importCenter.readyMappings')}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {importableTradeFields.map((field) => {
                const required = requiredImportFields.includes(field as (typeof requiredImportFields)[number]);
                return (
                  <label key={field} className="block text-sm">
                    <span className="mb-2 flex items-center gap-2 font-medium">
                      {t(`importCenter.fields.${field}`)}
                      {required ? <Badge variant="secondary">{t('common.required')}</Badge> : <span className="text-xs text-muted-foreground">{t('common.optional')}</span>}
                    </span>
                    <Select
                      value={mapping[field] ?? ''}
                      onChange={(event) => {
                        setPreview(null);
                        setResult(null);
                        setMapping({ ...mapping, [field]: event.target.value || undefined });
                      }}
                    >
                      <option value="">{t('common.notMapped')}</option>
                      {headers.map((header) => <option key={header}>{header}</option>)}
                    </Select>
                  </label>
                );
              })}
            </div>

            {(metadata.broker || metadata.account) ? (
              <div className="grid gap-3 md:grid-cols-2">
                <MetadataCard label={t('common.broker')} value={metadata.broker ?? t('common.notMapped')} />
                <MetadataCard label={t('common.account')} value={metadata.account ?? t('common.notMapped')} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {rows.length ? (
        <Card>
          <CardHeader className="flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>{t('importCenter.localPreview')}</CardTitle>
              <CardDescription>{t('importCenter.localPreviewDescription', { valid: localValid.length, invalid: localInvalid.length })}</CardDescription>
            </div>
            <Button onClick={validateRows} disabled={!canPreview || loadingPreview}>
              {loadingPreview ? t('importCenter.validating') : t('importCenter.validateRows')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusStrip valid={localValid.length} invalid={localInvalid.length} total={rows.length} />
            <PreviewTable
              title={t('importCenter.firstParsedRows')}
              rows={localRows.slice(0, 8).map((row) => row.ok ? {
                rowNumber: row.rowNumber,
                status: t('common.valid'),
                tone: 'positive',
                symbol: row.data.symbol,
                side: row.data.side,
                quantity: String(row.data.quantity),
                netPnl: formatCurrency(row.data.netPnl),
                reason: ''
              } : {
                rowNumber: row.rowNumber,
                status: t('common.invalid'),
                tone: 'negative',
                symbol: row.raw[mapping.symbol ?? ''] ?? '',
                side: row.raw[mapping.side ?? ''] ?? '',
                quantity: row.raw[mapping.quantity ?? ''] ?? '',
                netPnl: '',
                reason: row.reason
              })}
            />
          </CardContent>
        </Card>
      ) : null}

      {preview ? (
        <Card>
          <CardHeader className="flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>{t('importCenter.validatedPreview')}</CardTitle>
              <CardDescription>{t('importCenter.validatedPreviewDescription', { valid: preview.validRows.length, invalid: preview.invalidRows.length })}</CardDescription>
            </div>
            <Button onClick={submitImport} disabled={!preview.validRows.length || loadingImport}>
              {loadingImport ? t('importCenter.importing') : t('importCenter.importValidRows', { count: preview.validRows.length })}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatusStrip valid={preview.validRows.length} invalid={preview.invalidRows.length} total={preview.totalRows} />
            <div className="grid gap-6 xl:grid-cols-2">
              <PreviewTable
                title={t('importCenter.validRows')}
                rows={preview.validRows.slice(0, 12).map((row) => ({
                  rowNumber: row.rowNumber,
                  status: t('common.valid'),
                  tone: 'positive',
                  symbol: row.data.symbol,
                  side: row.data.side,
                  quantity: String(row.data.quantity),
                  netPnl: formatCurrency(row.data.netPnl),
                  reason: row.data.strategy ?? ''
                }))}
              />
              <PreviewTable
                title={t('importCenter.invalidRows')}
                rows={preview.invalidRows.slice(0, 12).map((row) => ({
                  rowNumber: row.rowNumber,
                  status: t('common.invalid'),
                  tone: 'negative',
                  symbol: row.raw[mapping.symbol ?? ''] ?? '',
                  side: row.raw[mapping.side ?? ''] ?? '',
                  quantity: row.raw[mapping.quantity ?? ''] ?? '',
                  netPnl: '',
                  reason: row.reason
                }))}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t('importCenter.finalSummary')}
            </CardTitle>
            <CardDescription>
              {t('importCenter.finalSummaryDescription', {
                batchId: result.batchId,
                imported: result.importedRows,
                rejected: result.rejectedRows,
                total: result.totalRows
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label={t('common.imported')} value={String(result.importedRows)} tone="positive" />
              <SummaryCard label={t('common.rejected')} value={String(result.rejectedRows)} tone={result.rejectedRows ? 'negative' : 'neutral'} />
              <SummaryCard label={t('common.broker')} value={result.broker ?? t('common.notMapped')} />
              <SummaryCard label={t('common.account')} value={result.account ?? t('common.primaryAccount')} />
            </div>
            {result.errors.length ? (
              <PreviewTable
                title={t('importCenter.savedRowErrors')}
                rows={result.errors.slice(0, 12).map((row) => ({
                  rowNumber: row.rowNumber,
                  status: t('common.rejected'),
                  tone: 'negative',
                  symbol: row.raw[mapping.symbol ?? ''] ?? '',
                  side: row.raw[mapping.side ?? ''] ?? '',
                  quantity: row.raw[mapping.quantity ?? ''] ?? '',
                  netPnl: '',
                  reason: row.reason
                }))}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
        </>
      )}

      <ImportHistory history={history} />
    </div>
  );
}

function BybitFuturesImportPanel() {
  const { formatCurrency } = useI18n();
  const [closedPnlFile, setClosedPnlFile] = useState<File | null>(null);
  const [tradeHistoryFile, setTradeHistoryFile] = useState<File | null>(null);
  const [timezone, setTimezone] = useState('UTC');
  const [preview, setPreview] = useState<BybitPreviewResult | null>(null);
  const [result, setResult] = useState<BybitImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const canPreview = Boolean(closedPnlFile || tradeHistoryFile);

  async function validateBybitFiles() {
    if (!canPreview) return;
    setLoadingPreview(true);
    setError(null);
    setResult(null);

    const formData = buildBybitFormData({ closedPnlFile, tradeHistoryFile, timezone });
    const response = await fetch('/api/import/preview', {
      method: 'POST',
      body: formData
    });
    const payload = await response.json().catch(() => null);
    setLoadingPreview(false);

    if (!response.ok) {
      setError(payload?.error ?? 'Bybit preview failed.');
      return;
    }

    setPreview(payload.bybit);
  }

  async function submitBybitImport() {
    if (!preview) return;
    setLoadingImport(true);
    setError(null);
    setResult(null);

    const formData = buildBybitFormData({ closedPnlFile, tradeHistoryFile, timezone });
    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData
    });
    const payload = await response.json().catch(() => null);
    setLoadingImport(false);

    if (!response.ok) {
      setError(payload?.error ?? 'Bybit import failed.');
      return;
    }

    setResult(payload);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Bybit Futures files
          </CardTitle>
          <CardDescription>Upload Closed PnL first. Add Trade History when you want execution-level analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <BybitUploadBox
              title="Closed PnL"
              requiredLabel="Required for high-quality P&L"
              file={closedPnlFile}
              onChange={(file) => {
                setClosedPnlFile(file);
                setPreview(null);
                setResult(null);
              }}
              description="Closed PnL gives the most accurate realized P&L analysis."
            />
            <BybitUploadBox
              title="Trade History"
              requiredLabel="Optional but recommended"
              file={tradeHistoryFile}
              onChange={(file) => {
                setTradeHistoryFile(file);
                setPreview(null);
                setResult(null);
              }}
              description="Trade History improves execution analysis and helps reconstruct entries and exits."
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(200px,280px),1fr] lg:items-start">
            <label className="block text-sm">
              <span className="mb-2 block font-medium">Detected timezone</span>
              <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="UTC" />
            </label>
            <div className="rounded-md border bg-secondary/30 p-3 text-sm text-muted-foreground">
              <Info className="mr-2 inline h-4 w-4 text-primary" />
              Bybit Trade History timestamps are UTC+0. Closed PnL is parsed as UTC unless you override it here.
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <RequiredColumns
              title="Closed PnL required columns"
              columns={['Market', 'Order Quantity', 'Entry Price', 'Exit Price', 'Opening Fee', 'Closing Fee', 'Funding Fee', 'Trade Type', 'Realized P&L', 'Trade time']}
            />
            <RequiredColumns
              title="Trade History required columns"
              columns={['Market', 'Filled Type', 'Filled Quantity', 'Filled Price', 'Trading Fee', 'Direction', 'Order Type', 'Trasaction ID', 'Order No.', 'Transaction Time(UTC+0)']}
            />
          </div>

          {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

          <Button onClick={validateBybitFiles} disabled={!canPreview || loadingPreview}>
            {loadingPreview ? 'Detecting...' : 'Detect and preview Bybit files'}
          </Button>
        </CardContent>
      </Card>

      {preview ? (
        <>
          <Card>
            <CardHeader className="flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle>Detection result</CardTitle>
                <CardDescription>Detected timezone: {preview.timezone}</CardDescription>
              </div>
              <QualityBadge quality={preview.dataQuality} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                {preview.files.map((file) => (
                  <DetectionSummary key={file.detection.fileName} detection={file.detection} />
                ))}
              </div>
              {preview.warnings.length ? <WarningList warnings={preview.warnings} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Closed PnL preview</CardTitle>
              <CardDescription>
                {preview.closedPnl.rows.length} parsed rows, {preview.closedPnl.rejectedRows.length} rejected rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BybitClosedPnlTable rows={preview.closedPnl.rows.slice(0, 12)} formatCurrency={formatCurrency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trade History preview</CardTitle>
              <CardDescription>
                {preview.tradeHistory.executions.length} trade executions, {preview.tradeHistory.fundingRows.length} funding rows, {preview.tradeHistory.rejectedRows.length} rejected rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BybitExecutionTable rows={preview.tradeHistory.executions.slice(0, 12)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle>Match result</CardTitle>
                <CardDescription>Closed PnL is matched to executions without counting every fill as a completed trade.</CardDescription>
              </div>
              <Button onClick={submitBybitImport} disabled={loadingImport}>
                {loadingImport ? 'Importing...' : 'Import Bybit records'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <SummaryCard label="Matched PnL rows" value={String(preview.matchResult.matchedClosedPnlRows)} tone="positive" />
                <SummaryCard label="Unmatched PnL rows" value={String(preview.matchResult.unmatchedClosedPnlRows)} tone={preview.matchResult.unmatchedClosedPnlRows ? 'negative' : 'neutral'} />
                <SummaryCard label="Matched executions" value={String(preview.matchResult.matchedTradeHistoryExecutions)} />
                <SummaryCard label="Unmatched fills" value={String(preview.matchResult.unmatchedExecutions)} />
                <SummaryCard label="Funding rows" value={String(preview.matchResult.fundingRows)} />
                <SummaryCard label="Confidence" value={`${Math.round(preview.matchResult.reconstructionConfidence * 100)}%`} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <SummaryCard label="Fee validation" value={preview.matchResult.feeValidationStatus} tone={preview.matchResult.feeValidationStatus === 'PASSED' ? 'positive' : 'neutral'} />
                <SummaryCard label="Closed PnL trade fees" value={formatDecimal(preview.matchResult.closedTradeFeeTotal)} />
                <SummaryCard label="Execution fees" value={formatDecimal(preview.matchResult.executionFeeTotal)} />
              </div>
              {preview.matchResult.warnings.length ? <WarningList warnings={preview.matchResult.warnings} /> : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      {result ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Bybit import result
            </CardTitle>
            <CardDescription>Batch {result.batchId} finished with {result.dataQuality} data quality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Closed PnL segments" value={String(result.importedClosedPnlSegments)} tone="positive" />
              <SummaryCard label="Executions" value={String(result.importedExecutions)} />
              <SummaryCard label="Funding entries" value={String(result.importedFundingEntries)} />
              <SummaryCard label="Positions" value={String(result.reconstructedPositions)} />
              <SummaryCard label="Duplicates skipped" value={String(result.duplicatesSkipped)} />
              <SummaryCard label="Rejected rows" value={String(result.rejectedRows)} tone={result.rejectedRows ? 'negative' : 'neutral'} />
              <SummaryCard label="Total source rows" value={String(result.totalRows)} />
              <SummaryCard label="Data quality" value={result.dataQuality} tone={result.dataQuality === 'HIGH' ? 'positive' : result.dataQuality === 'LOW' ? 'negative' : 'neutral'} />
            </div>
            {result.errors.length ? (
              <PreviewTable
                title="Bybit rejected rows"
                rows={result.errors.slice(0, 12).map((row) => ({
                  rowNumber: row.rowNumber,
                  status: 'Rejected',
                  tone: 'negative',
                  symbol: row.raw.Market ?? '',
                  side: '',
                  quantity: '',
                  netPnl: '',
                  reason: row.reason
                }))}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function buildBybitFormData({
  closedPnlFile,
  tradeHistoryFile,
  timezone
}: {
  closedPnlFile: File | null;
  tradeHistoryFile: File | null;
  timezone: string;
}) {
  const formData = new FormData();
  formData.append('exchange', 'BYBIT_FUTURES');
  formData.append('timezone', timezone.trim() || 'UTC');
  if (closedPnlFile) formData.append('closedPnlFile', closedPnlFile);
  if (tradeHistoryFile) formData.append('tradeHistoryFile', tradeHistoryFile);
  return formData;
}

function BybitUploadBox({
  title,
  requiredLabel,
  file,
  description,
  onChange
}: {
  title: string;
  requiredLabel: string;
  file: File | null;
  description: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex min-h-44 cursor-pointer flex-col justify-between rounded-md border border-dashed bg-background p-5 hover:bg-secondary/50">
      <span>
        <span className="flex items-center justify-between gap-3">
          <span className="font-semibold">{title}</span>
          <Badge variant="secondary">{requiredLabel}</Badge>
        </span>
        <span className="mt-2 block text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="mt-5 flex items-center gap-3 rounded-md border bg-secondary/30 p-3 text-sm">
        <UploadCloud className="h-4 w-4 text-primary" />
        <span className="min-w-0 truncate">{file ? file.name : 'Choose CSV or XLSX'}</span>
      </span>
      <input
        className="sr-only"
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function RequiredColumns({ title, columns }: { title: string; columns: string[] }) {
  return (
    <div className="rounded-md border bg-secondary/20 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {columns.map((column) => (
          <Badge key={column} variant="outline">
            {column}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function QualityBadge({ quality }: { quality: 'HIGH' | 'MEDIUM' | 'LIMITED' | 'LOW' }) {
  const variant = quality === 'HIGH' ? 'positive' : quality === 'LOW' ? 'negative' : 'secondary';
  const label = {
    HIGH: 'High data quality',
    MEDIUM: 'Medium data quality',
    LIMITED: 'Limited data quality',
    LOW: 'Low data quality'
  }[quality];

  return <Badge variant={variant}>{label}</Badge>;
}

function DetectionSummary({ detection }: { detection: BybitDetection }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{detection.fileName}</p>
        <Badge variant={detection.detectedFileType === 'UNKNOWN' ? 'negative' : 'positive'}>
          {detection.detectedFileType}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <span>Rows: {detection.rowCount}</span>
        <span>Symbols: {detection.symbolCount}</span>
        <span>Confidence: {detection.confidenceScore}%</span>
        <span>Date range: {formatDateRange(detection.dateRange.start, detection.dateRange.end)}</span>
      </div>
      {detection.missingColumns.length ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          Missing: {detection.missingColumns.join(', ')}
        </p>
      ) : null}
      {detection.warnings.length ? <WarningList warnings={detection.warnings} /> : null}
    </div>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      {warnings.map((warning) => (
        <p key={warning} className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </p>
      ))}
    </div>
  );
}

function BybitClosedPnlTable({
  rows,
  formatCurrency
}: {
  rows: BybitClosedPnlPreviewRow[];
  formatCurrency: (value: number) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Row</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Entry</TableHead>
            <TableHead>Exit</TableHead>
            <TableHead>Gross P&L</TableHead>
            <TableHead>Net P&L</TableHead>
            <TableHead>Open fee</TableHead>
            <TableHead>Close fee</TableHead>
            <TableHead>Funding</TableHead>
            <TableHead>Closed at</TableHead>
            <TableHead>Warning</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow key={`closed-${row.rowIndex}`}>
              <TableCell>{row.rowIndex}</TableCell>
              <TableCell>{row.symbol}</TableCell>
              <TableCell><Badge variant={row.inferredSide === 'UNKNOWN' ? 'secondary' : 'outline'}>{row.inferredSide}</Badge></TableCell>
              <TableCell>{formatDecimal(row.quantity)}</TableCell>
              <TableCell>{formatDecimal(row.avgEntryPrice)}</TableCell>
              <TableCell>{formatDecimal(row.avgExitPrice)}</TableCell>
              <TableCell>{formatCurrency(row.grossPnl)}</TableCell>
              <TableCell>{formatCurrency(row.netPnl)}</TableCell>
              <TableCell>{formatDecimal(row.openingFee)}</TableCell>
              <TableCell>{formatDecimal(row.closingFee)}</TableCell>
              <TableCell>{formatDecimal(row.fundingFee)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(row.closedAt)}</TableCell>
              <TableCell className="min-w-56 text-muted-foreground">{row.warnings.join(' ')}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">No Closed PnL rows to show.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function BybitExecutionTable({ rows }: { rows: BybitExecutionPreviewRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Row</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Filled type</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Filled price</TableHead>
            <TableHead>Order type</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Fee rate</TableHead>
            <TableHead>Trade ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Executed at</TableHead>
            <TableHead>Warning</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow key={`execution-${row.rowIndex}`}>
              <TableCell>{row.rowIndex}</TableCell>
              <TableCell>{row.symbol}</TableCell>
              <TableCell>{row.filledType}</TableCell>
              <TableCell>{row.direction ?? ''}</TableCell>
              <TableCell>{formatDecimal(row.quantity)}</TableCell>
              <TableCell>{formatDecimal(row.filledPrice)}</TableCell>
              <TableCell>{row.orderType ?? ''}</TableCell>
              <TableCell>{formatDecimal(row.fee)}</TableCell>
              <TableCell>{formatDecimal(row.feeRate)}</TableCell>
              <TableCell className="whitespace-nowrap">{row.tradeId ?? ''}</TableCell>
              <TableCell className="whitespace-nowrap">{row.orderId ?? ''}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(row.executedAt)}</TableCell>
              <TableCell className="min-w-56 text-muted-foreground">{row.warnings.join(' ')}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">No Trade History execution rows to show.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8
  }).format(value);
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19);
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) return 'n/a';
  return `${formatDateTime(start)} to ${formatDateTime(end)}`;
}

function StatusStrip({ valid, invalid, total }: { valid: number; invalid: number; total: number }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Badge variant="secondary"><Database className="mr-1 h-3 w-3" /> {total} {t('common.total')}</Badge>
      <Badge variant="positive"><CheckCircle2 className="mr-1 h-3 w-3" /> {valid} {t('common.valid')}</Badge>
      <Badge variant={invalid ? 'negative' : 'secondary'}><XCircle className="mr-1 h-3 w-3" /> {invalid} {t('common.invalid')}</Badge>
    </div>
  );
}

function PreviewTable({
  title,
  rows
}: {
  title: string;
  rows: Array<{ rowNumber: number; status: string; tone?: 'positive' | 'negative' | 'secondary'; symbol: string; side: string; quantity: string; netPnl: string; reason: string }>;
}) {
  const { t } = useI18n();

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.row')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('common.symbol')}</TableHead>
              <TableHead>{t('common.side')}</TableHead>
              <TableHead>{t('common.quantityShort')}</TableHead>
              <TableHead>{t('common.net')}</TableHead>
              <TableHead>{t('common.message')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? rows.map((row) => (
              <TableRow key={`${title}-${row.rowNumber}`}>
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell><Badge variant={row.tone ?? 'secondary'}>{row.status}</Badge></TableCell>
                <TableCell>{row.symbol}</TableCell>
                <TableCell>{row.side}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.netPnl}</TableCell>
                <TableCell className="max-w-md text-muted-foreground">{row.reason}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{t('common.noRowsToShow')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-secondary/40 p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
