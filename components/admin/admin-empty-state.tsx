import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-normal">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
