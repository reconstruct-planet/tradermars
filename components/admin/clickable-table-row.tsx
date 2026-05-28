'use client';

import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { TableRow } from '@/components/ui/table';

export function ClickableTableRow({
  href,
  children,
  className
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function open(event: MouseEvent<HTMLTableRowElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('a, button, input, select, textarea')) return;
    router.push(href);
  }

  function openWithKeyboard(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    router.push(href);
  }

  return (
    <TableRow
      className={className}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={openWithKeyboard}
    >
      {children}
    </TableRow>
  );
}
