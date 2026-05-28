import Link from 'next/link';
import { Search } from 'lucide-react';
import { ConfirmSubmitButton } from '@/components/admin/confirm-submit-button';
import { PlanBadge, RoleBadge, StatusBadge } from '@/components/admin/admin-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { deleteAdminNoteAction, updateAdminNoteAction } from '../actions';
import {
  formatAdminDate,
  formatAdminNumber,
  getAdminSupportData,
  requireAdmin
} from '@/lib/admin';

export default async function AdminSupportPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin('notes.write', '/admin/support');
  const params = await searchParams;
  const data = await getAdminSupportData(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Support Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal notes for support follow-up and operational context.
        </p>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Search Notes</CardTitle>
          <CardDescription>Search by note text, target user, or author.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
            <Input name="q" placeholder="Search support notes" defaultValue={data.filters.q} />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{formatAdminNumber(data.total)} notes</CardTitle>
          <p className="text-sm text-muted-foreground">Page {data.page} of {data.pageCount}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.notes.map((note) => (
            <div key={note.id} className="rounded-md border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <Link href={`/admin/users/${note.user.id}`} className="font-medium hover:text-primary">
                    {note.user.name}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{note.user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={note.user.status} />
                    <PlanBadge plan={note.user.plan} />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground lg:text-right">
                  <p>{formatAdminDate(note.createdAt)}</p>
                  <div className="mt-2 flex justify-start lg:justify-end">
                    {note.author ? <RoleBadge role={note.author.role} /> : null}
                  </div>
                  <p className="mt-1">{note.author?.name ?? 'System'}</p>
                </div>
              </div>

              <form action={updateAdminNoteAction} className="mt-4 space-y-2">
                <input type="hidden" name="noteId" value={note.id} />
                <input type="hidden" name="returnTo" value="/admin/support" />
                <Textarea name="note" defaultValue={note.note} required />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="outline" size="sm">Save note</Button>
                </div>
              </form>
              <form action={deleteAdminNoteAction} className="mt-2">
                <input type="hidden" name="noteId" value={note.id} />
                <input type="hidden" name="returnTo" value="/admin/support" />
                <ConfirmSubmitButton message="Soft delete this support note?" variant="ghost" size="sm">
                  Delete note
                </ConfirmSubmitButton>
              </form>
            </div>
          ))}
          {data.notes.length === 0 ? (
            <p className="rounded-md border p-4 text-sm text-muted-foreground">No support notes match these filters.</p>
          ) : null}
          <div className="flex items-center justify-between">
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(params, Math.max(1, data.page - 1))}>Previous</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(params, Math.min(data.pageCount, data.page + 1))}>Next</Link>
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
  return `/admin/support?${next.toString()}`;
}
