import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { I18nServerProvider } from '@/components/i18n-server-provider';
import { requireAdmin } from '@/lib/admin';
import { adminNamespaces } from '@/lib/i18n-namespaces';

export const metadata: Metadata = {
  title: 'Admin Console | TradeHarbor',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin('admin.access', '/admin', { logAccess: true });
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';

  return (
    <I18nServerProvider namespaces={adminNamespaces}>
      <AdminShell admin={admin} environment={environment}>
        {children}
      </AdminShell>
    </I18nServerProvider>
  );
}
