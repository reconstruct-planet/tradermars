import { Search } from 'lucide-react';
import { ActionBadge, SeverityBadge } from '@/components/admin/admin-severity';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { RoleBadge } from '@/components/admin/admin-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatAdminDate,
  formatAdminNumber,
  getAdminAuditLogsData,
  requireAdmin
} from '@/lib/admin';

export default async function AdminAuditLogsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin('audit.view', '/admin/audit-logs');
  const params = await searchParams;
  const data = await getAdminAuditLogsData(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable record of administrator actions and denied access attempts.
        </p>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input name="q" placeholder="Actor, target, or entity" defaultValue={data.filters.q} />
            <Input name="action" placeholder="Action type" defaultValue={data.filters.action} />
            <Input name="from" type="date" defaultValue={data.filters.from} aria-label="From date" />
            <Input name="to" type="date" defaultValue={data.filters.to} aria-label="To date" />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{formatAdminNumber(data.total)} log entries</CardTitle>
          <Badge variant="secondary">Export placeholder</Badge>
        </CardHeader>
        <CardContent>
          {data.logs.length === 0 ? (
            <AdminEmptyState
              title="No audit logs match these filters"
              description="Clear the action, actor, target, or date filters to broaden the investigation window."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium"><ActionBadge action={log.action} /></TableCell>
                      <TableCell><SeverityBadge action={log.action} /></TableCell>
                      <TableCell>
                        {log.actor ? (
                          <div className="space-y-1">
                            <p>{log.actor.name}</p>
                            <RoleBadge role={log.actor.role} />
                          </div>
                        ) : 'System'}
                      </TableCell>
                      <TableCell>
                        {log.target ? (
                          <div className="space-y-1">
                            <p>{log.target.name}</p>
                            <p className="text-xs text-muted-foreground">{log.target.email}</p>
                          </div>
                        ) : 'None'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{log.entityType}{log.entityId ? ` / ${log.entityId.slice(0, 8)}` : ''}</TableCell>
                      <TableCell className="min-w-72 max-w-md">
                        <details className="rounded-md border bg-secondary/30">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
                            View metadata
                          </summary>
                          <pre className="max-h-48 overflow-auto border-t p-3 text-xs text-muted-foreground">
                            {JSON.stringify(log.metadata ?? {}, null, 2)}
                          </pre>
                        </details>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(log.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm">
              <a href={pageHref(params, Math.max(1, data.page - 1))}>Previous</a>
            </Button>
            <span className="text-sm text-muted-foreground">Page {data.page} of {data.pageCount}</span>
            <Button asChild variant="outline" size="sm">
              <a href={pageHref(params, Math.min(data.pageCount, data.page + 1))}>Next</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function pageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'page') return;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) next.set(key, text);
  });
  next.set('page', String(Math.max(1, page)));
  return `/admin/audit-logs?${next.toString()}`;
}
