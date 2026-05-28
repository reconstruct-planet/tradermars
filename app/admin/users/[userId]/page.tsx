import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  FileWarning,
  LockKeyhole,
  NotebookText,
  RotateCcw,
  Shield,
  UserX
} from 'lucide-react';
import { ActionBadge, SeverityBadge } from '@/components/admin/admin-severity';
import { ConfirmSubmitButton } from '@/components/admin/confirm-submit-button';
import { PlanBadge, RoleBadge, StatusBadge } from '@/components/admin/admin-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  addAdminNoteAction,
  changeUserPlanAction,
  changeUserRoleAction,
  deleteAdminNoteAction,
  softDeleteUserAction,
  restoreUserAction,
  suspendUserAction,
  unsuspendUserAction,
  updateAdminNoteAction
} from '../../actions';
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminNumber,
  getAdminUserDetailData,
  requireAdmin
} from '@/lib/admin';
import { hasAdminPermission, planValues, userRoles } from '@/lib/admin-permissions';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'activity', label: 'Activity', icon: ClipboardList },
  { id: 'imports', label: 'Imports', icon: FileWarning },
  { id: 'notes', label: 'Notes', icon: NotebookText },
  { id: 'audit', label: 'Audit Logs', icon: Shield },
  { id: 'permissions', label: 'Permissions', icon: LockKeyhole }
] as const;

type TabId = (typeof tabs)[number]['id'];

export default async function AdminUserDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await params;
  const query = await searchParams;
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab) ? (requestedTab as TabId) : 'overview';
  const admin = await requireAdmin('users.view', `/admin/users/${userId}`);
  const data = await getAdminUserDetailData(userId);
  const returnTo = `/admin/users/${userId}?tab=${activeTab}`;
  const canChangeStatus = hasAdminPermission(admin.role, 'users.change_status');
  const canChangePlan = hasAdminPermission(admin.role, 'users.change_plan');
  const canChangeRole = hasAdminPermission(admin.role, 'users.change_role');
  const canSoftDelete = hasAdminPermission(admin.role, 'users.soft_delete');
  const canRestore = hasAdminPermission(admin.role, 'users.restore');
  const canWriteNotes = hasAdminPermission(admin.role, 'notes.write');
  const canManageNotes = hasAdminPermission(admin.role, 'notes.manage');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">Back to users</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">{data.user.name}</h1>
          <p className="text-sm text-muted-foreground">{data.user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RoleBadge role={data.user.role} />
          <StatusBadge status={data.user.status} />
          <PlanBadge plan={data.user.plan} />
          {data.user.status === 'SUSPENDED' || data.user.status === 'DELETED' ? (
            <Badge variant="negative">Risk review</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <SummaryCard title="User status" value={<StatusBadge status={data.user.status} />} />
        <SummaryCard title="Plan" value={<PlanBadge plan={data.user.plan} />} />
        <SummaryCard title="Role" value={<RoleBadge role={data.user.role} />} />
        <SummaryCard title="Created" value={formatAdminDate(data.user.createdAt)} compact />
        <SummaryCard title="Last login" value={formatAdminDate(data.user.lastLoginAt)} compact />
        <SummaryCard title="Trades" value={data.tradeSummary.count} />
        <SummaryCard title="Imports" value={data.user.counts.importBatches} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border bg-card p-1">
            <nav className="flex min-w-max gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === activeTab;
                return (
                  <Link
                    key={tab.id}
                    href={`/admin/users/${userId}?tab=${tab.id}`}
                    className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {activeTab === 'overview' ? (
            <OverviewTab data={data} />
          ) : null}

          {activeTab === 'activity' ? (
            <ActivityTab data={data} />
          ) : null}

          {activeTab === 'imports' ? (
            <ImportsTab data={data} />
          ) : null}

          {activeTab === 'notes' ? (
            <NotesTab
              data={data}
              returnTo={returnTo}
              canWriteNotes={canWriteNotes}
              canManageNotes={canManageNotes}
            />
          ) : null}

          {activeTab === 'audit' ? (
            <AuditTab data={data} />
          ) : null}

          {activeTab === 'permissions' ? (
            <PermissionsTab data={data} adminRole={admin.role} />
          ) : null}
        </div>

        <DangerZone
          user={data.user}
          returnTo={returnTo}
          canChangeStatus={canChangeStatus}
          canChangePlan={canChangePlan}
          canChangeRole={canChangeRole}
          canSoftDelete={canSoftDelete}
          canRestore={canRestore}
        />
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: Awaited<ReturnType<typeof getAdminUserDetailData>> }) {
  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Minimal account profile and operational status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Email verified" value={data.user.emailVerified ? 'Verified' : 'Not verified'} />
          <Info label="Last login" value={formatAdminDate(data.user.lastLoginAt)} />
          <Info label="Created" value={formatAdminDate(data.user.createdAt)} />
          <Info label="Timezone" value={data.user.timezone} />
          <Info label="Subscription" value={data.user.subscriptionStatus ?? 'None'} />
          <Info label="Updated" value={formatAdminDate(data.user.updatedAt)} />
          {data.user.suspendedAt ? <Info label="Suspended" value={formatAdminDate(data.user.suspendedAt)} /> : null}
          {data.user.deletedAt ? <Info label="Soft deleted" value={formatAdminDate(data.user.deletedAt)} /> : null}
          {data.user.suspendedReason ? (
            <div className="rounded-md border p-3 sm:col-span-2 lg:col-span-3">
              <p className="text-xs uppercase text-muted-foreground">Suspension reason</p>
              <p className="mt-1 text-sm">{data.user.suspendedReason}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Trades" value={data.tradeSummary.count} />
        <MetricCard title="Net P/L" value={formatAdminCurrency(data.tradeSummary.netPnl)} />
        <MetricCard title="Average R" value={data.tradeSummary.averageR.toFixed(2)} />
        <MetricCard title="Fees" value={formatAdminCurrency(data.tradeSummary.fees)} />
      </div>
    </div>
  );
}

function ActivityTab({ data }: { data: Awaited<ReturnType<typeof getAdminUserDetailData>> }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Activity Summary</CardTitle>
        <CardDescription>Operational counts only. Raw trade rows remain hidden by default.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Trades" value={formatAdminNumber(data.tradeSummary.count)} />
        <Info label="Accounts" value={formatAdminNumber(data.user.counts.accounts)} />
        <Info label="Import batches" value={formatAdminNumber(data.user.counts.importBatches)} />
        <Info label="Goals" value={formatAdminNumber(data.user.counts.goals)} />
        <Info label="Journal notes" value={formatAdminNumber(data.user.counts.notes)} />
        <Info label="Tags" value={formatAdminNumber(data.user.counts.tags)} />
      </CardContent>
    </Card>
  );
}

function ImportsTab({ data }: { data: Awaited<ReturnType<typeof getAdminUserDetailData>> }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Recent Import Failures</CardTitle>
        <CardDescription>Failure summaries only. Raw CSV payloads are not shown.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.recentFailedImports.length === 0 ? (
          <EmptyPanel
            title="No recent import failures"
            description="This user has no failed or partially rejected import batches in the latest monitored window."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead>Reasons</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentFailedImports.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.filename}</TableCell>
                    <TableCell><Badge variant="negative">{batch.status}</Badge></TableCell>
                    <TableCell>{formatAdminNumber(batch.totalRows)}</TableCell>
                    <TableCell>{formatAdminNumber(batch.rejectedRows)}</TableCell>
                    <TableCell className="max-w-sm">
                      {batch.errors.map((error) => (
                        <p key={error.id} className="truncate text-xs text-muted-foreground">
                          Row {error.rowNumber}: {error.reason}
                        </p>
                      ))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(batch.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({
  data,
  returnTo,
  canWriteNotes,
  canManageNotes
}: {
  data: Awaited<ReturnType<typeof getAdminUserDetailData>>;
  returnTo: string;
  canWriteNotes: boolean;
  canManageNotes: boolean;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Support Notes</CardTitle>
        <CardDescription>Internal notes for support handoff. Users cannot see these notes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canWriteNotes ? (
          <form action={addAdminNoteAction} className="space-y-2">
            <input type="hidden" name="userId" value={data.user.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Textarea name="note" placeholder="Add the next support action, context, or follow-up reminder" required />
            <Button type="submit" className="w-full sm:w-auto">Add note</Button>
          </form>
        ) : null}

        <div className="space-y-3">
          {data.adminNotes.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{note.author?.name ?? 'System'}</p>
                  <p className="text-xs text-muted-foreground">{formatAdminDate(note.createdAt)}</p>
                </div>
                <Badge variant="secondary">{note.visibility}</Badge>
              </div>
              {canManageNotes ? (
                <form action={updateAdminNoteAction} className="mt-3 space-y-2">
                  <input type="hidden" name="noteId" value={note.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Textarea name="note" defaultValue={note.note} required />
                  <Button type="submit" variant="outline" size="sm">Save</Button>
                </form>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm">{note.note}</p>
              )}
              {canManageNotes ? (
                <form action={deleteAdminNoteAction} className="mt-2">
                  <input type="hidden" name="noteId" value={note.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <ConfirmSubmitButton message="Soft delete this admin note?" variant="ghost" size="sm">
                    Delete note
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </div>
          ))}
          {data.adminNotes.length === 0 ? (
            <EmptyPanel
              title="No support notes yet"
              description="Add the first internal note when this account needs follow-up, account review, or handoff context."
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditTab({ data }: { data: Awaited<ReturnType<typeof getAdminUserDetailData>> }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Related Audit Logs</CardTitle>
        <CardDescription>Most recent administrative events for this user.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.auditLogs.length === 0 ? (
          <EmptyPanel
            title="No audit events for this user"
            description="Admin actions such as plan changes, suspensions, role changes, and support note edits will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium"><ActionBadge action={log.action} /></TableCell>
                    <TableCell><SeverityBadge action={log.action} /></TableCell>
                    <TableCell>{log.actor ? log.actor.name : 'System'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermissionsTab({
  data,
  adminRole
}: {
  data: Awaited<ReturnType<typeof getAdminUserDetailData>>;
  adminRole: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Current Access</CardTitle>
          <CardDescription>Role, status, and plan that drive server-side access decisions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Info label="User role" value={data.user.role} />
          <Info label="User status" value={data.user.status} />
          <Info label="Plan" value={data.user.plan} />
          <Info label="Signed-in admin role" value={adminRole} />
        </CardContent>
      </Card>
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Guardrails</CardTitle>
          <CardDescription>High-impact permission changes are restricted and audited.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Only SUPER_ADMIN can grant or remove administrator roles.</p>
          <p>The last SUPER_ADMIN cannot be downgraded, deleted, or suspended.</p>
          <p>Every role, plan, status, note, and restore action is checked again on the server.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DangerZone({
  user,
  returnTo,
  canChangeStatus,
  canChangePlan,
  canChangeRole,
  canSoftDelete,
  canRestore
}: {
  user: Awaited<ReturnType<typeof getAdminUserDetailData>>['user'];
  returnTo: string;
  canChangeStatus: boolean;
  canChangePlan: boolean;
  canChangeRole: boolean;
  canSoftDelete: boolean;
  canRestore: boolean;
}) {
  const hasActions = canChangeStatus || canChangePlan || canChangeRole || canSoftDelete || canRestore;

  return (
    <aside className="space-y-4">
      <Card className="rounded-md border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>High-impact changes require confirmation and server-side permission checks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasActions ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Your current role can view this account, but cannot perform risky account changes.
            </p>
          ) : null}

          {canChangeStatus ? (
            user.status === 'SUSPENDED' ? (
              <form action={unsuspendUserAction}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <ConfirmSubmitButton message="Restore this user's active status?" variant="outline" className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Unsuspend user
                </ConfirmSubmitButton>
              </form>
            ) : user.status !== 'DELETED' ? (
              <form action={suspendUserAction} className="space-y-2">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Input name="reason" placeholder="Suspension reason" required />
                <ConfirmSubmitButton message="Suspend this user? They will be blocked from signing in." variant="outline" className="w-full">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Suspend user
                </ConfirmSubmitButton>
              </form>
            ) : null
          ) : null}

          {canChangePlan && user.status !== 'DELETED' ? (
            <form action={changeUserPlanAction} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <Select name="plan" defaultValue={user.plan}>
                {planValues.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
              </Select>
              <ConfirmSubmitButton message="Change this user's plan?" className="w-full">
                Change plan
              </ConfirmSubmitButton>
            </form>
          ) : null}

          {canChangeRole ? (
            <form action={changeUserRoleAction} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <Select name="role" defaultValue={user.role}>
                {userRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </Select>
              <ConfirmSubmitButton message="Change this user's admin role?" variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Change role
              </ConfirmSubmitButton>
            </form>
          ) : null}

          {canSoftDelete && user.status !== 'DELETED' ? (
            <form action={softDeleteUserAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnTo" value="/admin/users?status=DELETED" />
              <ConfirmSubmitButton message="Soft delete this user? Their data will remain in the database but account access will be disabled." variant="destructive" className="w-full">
                <UserX className="mr-2 h-4 w-4" />
                Soft delete user
              </ConfirmSubmitButton>
            </form>
          ) : null}

          {canRestore && user.status === 'DELETED' ? (
            <form action={restoreUserAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <ConfirmSubmitButton message="Restore this soft-deleted user?" className="w-full">
                Restore user
              </ConfirmSubmitButton>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </aside>
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

function SummaryCard({
  title,
  value,
  compact = false
}: {
  title: string;
  value: string | number | ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={compact ? 'text-sm font-semibold leading-tight' : 'text-2xl font-semibold'}>
          {typeof value === 'number' ? formatAdminNumber(value) : value}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="rounded-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{typeof value === 'number' ? formatAdminNumber(value) : value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
