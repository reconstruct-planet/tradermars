'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminUsersError({ reset }: { reset: () => void }) {
  return (
    <Card className="rounded-md border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold tracking-normal">Users could not be loaded</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Check the database connection and try again. If this continues, review recent deploys and Prisma migrations.
        </p>
        <Button className="mt-6" onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
