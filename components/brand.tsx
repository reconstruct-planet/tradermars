import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={cn('h-5 w-5', className)}
      fill="none"
      role={title ? 'img' : undefined}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M20 4.75 33.25 12.25v15.5L20 35.25 6.75 27.75v-15.5L20 4.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M14 14.5v12M26 14.5v12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="m14 25 5.2-5.4 3.55 3.2L27 17"
        stroke="hsl(var(--accent))"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <circle cx="27" cy="17" r="2.4" fill="hsl(var(--accent))" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      aria-label="TradeHarbor home"
      href="/"
      className={cn('inline-flex items-center gap-2.5 font-semibold tracking-normal', className)}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#07161a] text-white ring-1 ring-white/10 dark:bg-white dark:text-[#07161a]">
        <BrandMark />
      </span>
      <span className="text-[1.05em] leading-none">
        Trade<span className="text-primary">Harbor</span>
      </span>
    </Link>
  );
}
