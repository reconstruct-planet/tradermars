import Link from 'next/link';
import { ArrowDownUp, Eye } from 'lucide-react';
import { PlanBadge, RoleBadge, StatusBadge } from '@/components/admin/admin-badges';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { ClickableTableRow } from '@/components/admin/clickable-table-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatAdminDate,
  formatAdminNumber,
  getAdminUsersData,
  requireAdmin
} from '@/lib/admin';
import { planValues, userRoles, userStatuses } from '@/lib/admin-permissions';

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin('users.view', '/admin/users');
  const params = await searchParams;
  const data = await getAdminUsersData(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, filter, and inspect accounts without exposing raw trading data.
        </p>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Input name="q" placeholder="Email or name" defaultValue={data.filters.q} />
            <Select name="role" defaultValue={data.filters.role}>
              <option value="">All roles</option>
              {userRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </Select>
            <Select name="status" defaultValue={data.filters.status}>
              <option value="">Active non-deleted</option>
              {userStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <Select name="plan" defaultValue={data.filters.plan}>
              <option value="">All plans</option>
              {planValues.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
            </Select>
            <Select name="sort" defaultValue={data.filters.sort}>
              <option value="createdAt_desc">Newest signup</option>
              <option value="createdAt_asc">Oldest signup</option>
              <option value="email_asc">Email A-Z</option>
              <option value="lastLoginAt_desc">Recent login</option>
              <option value="lastLoginAt_asc">Old login</option>
              <option value="tradeCount_desc">Most trades</option>
              <option value="tradeCount_asc">Fewest trades</option>
              <option value="importCount_desc">Most imports</option>
              <option value="importCount_asc">Fewest imports</option>
            </Select>
            <Button type="submit">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Apply
            </Button>
            <Input name="createdFrom" type="date" defaultValue={data.filters.createdFrom} aria-label="Created from" />
            <Input name="createdTo" type="date" defaultValue={data.filters.createdTo} aria-label="Created to" />
            <Input name="lastLoginFrom" type="date" defaultValue={data.filters.lastLoginFrom} aria-label="Last login from" />
            <Input name="lastLoginTo" type="date" defaultValue={data.filters.lastLoginTo} aria-label="Last login to" />
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{formatAdminNumber(data.total)} users</CardTitle>
          <p className="text-sm text-muted-foreground">Page {data.page} of {data.pageCount}</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Imports</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <ClickableTableRow key={user.id} href={`/admin/users/${user.id}`} className="group cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/admin/users/${user.id}`} className="block hover:text-primary">{user.name}</Link>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      <Link href={`/admin/users/${user.id}`} className="block hover:text-primary">{user.email}</Link>
                    </TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={user.status} />
                        {user.status === 'SUSPENDED' || user.status === 'DELETED' ? <Badge variant="negative">Risk</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell><PlanBadge plan={user.plan} /></TableCell>
                    <TableCell className="text-right">{formatAdminNumber(user.tradeCount)}</TableCell>
                    <TableCell className="text-right">{formatAdminNumber(user.importCount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(user.lastLoginAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </ClickableTableRow>
                ))}
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-muted-foreground">No users match these filters.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          {data.users.length === 0 ? (
            <div className="mt-4">
              <AdminEmptyState
                title="No users found"
                description="Clear one or more filters, broaden the signup/login date range, or search by a different email or name."
              />
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm" disabled={data.page <= 1}>
              <Link href={pageHref(params, data.page - 1)} aria-disabled={data.page <= 1}>Previous</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={data.page >= data.pageCount}>
              <Link href={pageHref(params, data.page + 1)} aria-disabled={data.page >= data.pageCount}>Next</Link>
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
  return `/admin/users?${next.toString()}`;
}
