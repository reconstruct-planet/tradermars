'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
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

export function ImportCenter({ history }: { history: ImportHistoryItem[] }) {
  const { t, formatCurrency } = useI18n();
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
        {(t('importCenter.steps') as unknown as string[]).map((label, index) => {
          const done = [
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

      <ImportHistory history={history} />
    </div>
  );
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
