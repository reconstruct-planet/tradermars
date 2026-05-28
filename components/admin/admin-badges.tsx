import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function RoleBadge({ role }: { role: string }) {
  const tone =
    role === 'SUPER_ADMIN'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
      : role === 'ADMIN'
        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300'
        : role === 'SUPPORT'
          ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300'
          : role === 'ANALYST'
            ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300'
            : '';

  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', tone)}>
      {role.replace('_', ' ')}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = status === 'ACTIVE' ? 'positive' : status === 'SUSPENDED' || status === 'DELETED' ? 'negative' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}

export function PlanBadge({ plan }: { plan: string }) {
  const tone =
    plan === 'ELITE'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
      : plan === 'PRO'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
        : '';

  return (
    <Badge variant="outline" className={tone}>
      {plan}
    </Badge>
  );
}
