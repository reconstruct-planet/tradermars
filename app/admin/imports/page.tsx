import Link from 'next/link';
import { FileWarning, Search } from 'lucide-react';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatAdminDate,
  formatAdminNumber,
  getAdminImportsData,
  requireAdmin
} from '@/lib/admin';

export default async function AdminImportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin('imports.view', '/admin/imports');
  const params = await searchParams;
  const data = await getAdminImportsData(admin, params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Import Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV import health, rejected row counts, and failure patterns across users.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {data.statusCounts.map((item) => (
          <Card key={item.status} className="rounded-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.status}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAdminNumber(item.count)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Input name="q" placeholder={data.canViewUsers ? 'File, broker, or user' : 'File or broker'} defaultValue={data.filters.q} />
            <Select name="status" defaultValue={data.filters.status}>
              <option value="">All statuses</option>
              {data.statusCounts.map((item) => <option key={item.status} value={item.status}>{item.status}</option>)}
            </Select>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {data.selectedBatch ? (
        <Card className="rounded-md border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle>Import Error Details</CardTitle>
            <CardDescription>
              Showing stored validation reasons only. Raw uploaded row payloads remain hidden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="File" value={data.selectedBatch.filename} />
              <Info label="User" value={`${data.selectedBatch.user.name} (${data.selectedBatch.user.email})`} />
              <Info label="Rejected rows" value={formatAdminNumber(data.selectedBatch.rejectedRows)} />
              <Info label="Created" value={formatAdminDate(data.selectedBatch.createdAt)} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.selectedBatch.errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>{error.rowNumber}</TableCell>
                    <TableCell>{error.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{formatAdminNumber(data.total)} import batches</CardTitle>
            <p className="text-sm text-muted-foreground">Page {data.page} of {data.pageCount}</p>
          </CardHeader>
          <CardContent>
          {data.imports.length === 0 ? (
            <AdminEmptyState
              title="No import batches match these filters"
              description="Clear the status or search filter to inspect broader CSV import health."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead className="text-right">Imported</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.imports.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.filename}</TableCell>
                      <TableCell>
                        {data.canViewUsers ? (
                          <Link href={`/admin/users/${batch.user.id}`} className="hover:text-primary">
                            {batch.user.name}
                          </Link>
                        ) : (
                          <span>{batch.user.email}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={batch.rejectedRows > 0 ? 'negative' : 'positive'}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatAdminNumber(batch.totalRows)}</TableCell>
                      <TableCell className="text-right">{formatAdminNumber(batch.importedRows)}</TableCell>
                      <TableCell className="text-right">{formatAdminNumber(batch.rejectedRows)}</TableCell>
                      <TableCell className="max-w-sm">
                        {batch.errors.map((error) => (
                          <p key={error.id} className="truncate text-xs text-muted-foreground">
                            Row {error.rowNumber}: {error.reason}
                          </p>
                        ))}
                        {batch.rejectedRows > 0 && data.canViewErrorDetails ? (
                          <Button asChild variant="ghost" size="sm" className="mt-1 h-7 px-2">
                            <Link href={batchHref(params, batch.id)}>
                              <FileWarning className="mr-2 h-3.5 w-3.5" />
                              Inspect
                            </Link>
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(batch.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            <div className="mt-4 flex items-center justify-between">
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(params, Math.max(1, data.page - 1))}>Previous</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(params, Math.min(data.pageCount, data.page + 1))}>Next</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Error Types</CardTitle>
            <CardDescription>Most common validation failure reasons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.errorReasons.map((item) => (
              <div key={item.reason} className="rounded-md border p-3">
                <p className="text-sm font-medium">{item.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatAdminNumber(item.count)} rows</p>
              </div>
            ))}
            {data.errorReasons.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No import errors recorded. When rejected CSV rows appear, their most common validation reasons will show here.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function batchHref(params: Record<string, string | string[] | undefined>, batchId: string) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'batch') return;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) next.set(key, text);
  });
  next.set('batch', batchId);
  return `/admin/imports?${next.toString()}`;
}

function pageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'page' || key === 'batch') return;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) next.set(key, text);
  });
  next.set('page', String(Math.max(1, page)));
  return `/admin/imports?${next.toString()}`;
}
