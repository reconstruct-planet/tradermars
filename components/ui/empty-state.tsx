import type { ReactNode } from 'react';
import { Card } from './card';

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </Card>
  );
}
