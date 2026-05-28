import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-md border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-normal">403 Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account does not have permission to use the admin console.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/login?callbackUrl=%2Fadmin">Use admin login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Return to site</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
