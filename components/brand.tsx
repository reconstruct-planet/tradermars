import Link from 'next/link';
import { ActivitySquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2 font-semibold tracking-normal', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ActivitySquare className="h-5 w-5" />
      </span>
      <span>Edgefolio</span>
    </Link>
  );
}
