'use client';

import { History } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ImportHistoryItem } from '@/lib/import-history';

export function ImportHistory({ history }: { history: ImportHistoryItem[] }) {
  const { t, formatDate } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {t('importCenter.historyTitle')}
        </CardTitle>
        <CardDescription>{t('importCenter.recentBatches')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.created')}</TableHead>
              <TableHead>{t('common.file')}</TableHead>
              <TableHead>{t('common.broker')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('common.total')}</TableHead>
              <TableHead>{t('common.imported')}</TableHead>
              <TableHead>{t('common.rejected')}</TableHead>
              <TableHead>{t('common.latestErrors')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length ? history.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{formatDate(batch.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                <TableCell className="font-medium">{batch.filename}</TableCell>
                <TableCell>{batch.broker ?? t('common.notMapped')}</TableCell>
                <TableCell><Badge variant={batch.rejectedRows ? 'negative' : 'positive'}>{batch.status}</Badge></TableCell>
                <TableCell>{batch.totalRows}</TableCell>
                <TableCell>{batch.importedRows}</TableCell>
                <TableCell>{batch.rejectedRows}</TableCell>
                <TableCell className="max-w-md text-xs text-muted-foreground">
                  {batch.errors.length
                    ? batch.errors.map((error) => t('importCenter.rowError', { row: error.rowNumber, reason: error.reason })).join(' | ')
                    : t('common.noRowErrors')}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  {t('importCenter.noBatches')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
