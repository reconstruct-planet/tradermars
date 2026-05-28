import Link from 'next/link';
import { Activity, AlertTriangle, Database, FileWarning, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { ActionBadge } from '@/components/admin/admin-severity';
import { PlanBadge, RoleBadge, StatusBadge } from '@/components/admin/admin-badges';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatAdminDate,
  formatAdminNumber,
  getAdminDashboardData,
  requireAdmin
} from '@/lib/admin';

export default async function AdminDashboardPage() {
  const admin = await requireAdmin('dashboard.view', '/admin');
  const data = await getAdminDashboardData(admin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Admin Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Service health, account activity, plan distribution, and recent operations.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total users" value={data.metrics.totalUsers} icon={Users} />
        <MetricCard title="Active users" value={data.metrics.activeUsers} icon={ShieldCheck} />
        <MetricCard title="New today" value={data.metrics.todayNewUsers} icon={UserPlus} />
        <MetricCard title="New this week" value={data.metrics.weeklyNewUsers} icon={Activity} />
        <MetricCard title="Suspended users" value={data.metrics.suspendedUsers} icon={FileWarning} tone="warn" />
        <MetricCard title="Total trades" value={data.metrics.totalTrades} icon={Database} />
        <MetricCard title="CSV imports" value={data.metrics.totalImports} icon={Database} />
        <MetricCard title="Imports with errors" value={data.metrics.failedImports} icon={FileWarning} tone="warn" />
        <Card className="rounded-md">
          <CardHeader className="pb-2">
            <CardTitle>System</CardTitle>
            <CardDescription>{data.system.environment}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatusLine label="Database" value={data.system.database} ok={data.system.database === 'Configured'} />
            <StatusLine label="Auth secret" value={data.system.authSecret} ok={data.system.authSecret === 'Configured'} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>Newest audited actions across the console.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium"><ActionBadge action={log.action} /></TableCell>
                    <TableCell>{log.actor ? log.actor.name : 'System'}</TableCell>
                    <TableCell>{log.target ? log.target.name : log.entityType}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {data.recentLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">No audit activity yet.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle>Risk Alerts</CardTitle>
              <CardDescription>Operational items that deserve a human pass.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.riskAlerts.map((alert) => (
                <div key={alert.title} className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={alert.tone === 'critical' ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-amber-600'} />
                    <p className="font-medium">{alert.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
                </div>
              ))}
              {data.riskAlerts.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No active risk alerts. Review recent imports and audit logs during your normal operating cadence.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Recent Import Failures</CardTitle>
              <CardDescription>Newest failed or partially rejected CSV batches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentImportFailures.map((batch) => (
                <Link key={batch.id} href={`/admin/imports?batch=${batch.id}`} className="block rounded-md border p-3 transition-colors hover:bg-secondary/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{batch.filename}</p>
                      <p className="truncate text-xs text-muted-foreground">{batch.user.name} · {batch.user.email}</p>
                    </div>
                    <Badge variant="negative">{batch.rejectedRows}/{batch.totalRows}</Badge>
                  </div>
                  {batch.errors[0] ? (
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      Row {batch.errors[0].rowNumber}: {batch.errors[0].reason}
                    </p>
                  ) : null}
                </Link>
              ))}
              {data.recentImportFailures.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No recent import failures. If a customer reports upload trouble, search their account from Users.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Users By Plan</CardTitle>
              <CardDescription>Current non-deleted account distribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.planCounts.map((item) => (
                <div key={item.plan} className="flex items-center justify-between rounded-md border p-3">
                  <PlanBadge plan={item.plan} />
                  <span className="text-lg font-semibold">{formatAdminNumber(item.count)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
              <CardDescription>Newest accounts, with PII minimized for analyst views.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentUsers.map((user) => (
                <div key={user.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {user.canOpen ? (
                        <Link href={`/admin/users/${user.id}`} className="truncate font-medium hover:text-primary">
                          {user.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{user.name}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <RoleBadge role={user.role} />
                    <PlanBadge plan={user.plan} />
                    <Badge variant="secondary">{formatAdminDate(user.createdAt)}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone = 'default'
}: {
  title: string;
  value: number;
  icon: typeof Users;
  tone?: 'default' | 'warn';
}) {
  return (
    <Card className="rounded-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={tone === 'warn' ? 'h-4 w-4 text-amber-600' : 'h-4 w-4 text-primary'} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{formatAdminNumber(value)}</p>
      </CardContent>
    </Card>
  );
}

function StatusLine({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={ok ? 'positive' : 'negative'}>{value}</Badge>
    </div>
  );
}
