import { Badge } from '@/components/ui/badge';

export function actionSeverity(action: string): 'critical' | 'warning' | 'info' {
  if (action.includes('DENIED') || action.includes('DELETED') || action.includes('ROLE')) return 'critical';
  if (action.includes('SUSPENDED') || action.includes('PLAN') || action.includes('IMPORT_ERROR')) return 'warning';
  return 'info';
}

export function ActionBadge({ action }: { action: string }) {
  const severity = actionSeverity(action);
  const className =
    severity === 'critical'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
      : severity === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
        : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300';

  return <Badge variant="outline" className={className}>{action}</Badge>;
}

export function SeverityBadge({ action }: { action: string }) {
  const severity = actionSeverity(action);
  return (
    <Badge variant={severity === 'critical' ? 'negative' : severity === 'warning' ? 'secondary' : 'outline'}>
      {severity}
    </Badge>
  );
}
