import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-md border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-normal">403 Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have permission to use this admin area.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Return to site</Link>
        </Button>
      </div>
    </div>
  );
}
