import { CheckCircle2, Lock, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminSettingsData, requireAdmin } from '@/lib/admin';

export default async function AdminSettingsPage() {
  await requireAdmin('settings.view', '/admin/settings');
  const data = await getAdminSettingsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only MVP view of operational configuration and placeholders.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Application</CardTitle>
            <CardDescription>Public app settings visible to administrators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Info label="App name" value={data.appName} />
            <Info label="Public URL" value={data.publicUrl} />
            <Info label="Environment" value={data.environment} />
            <Info label="Demo mode" value={data.demoMode ? 'Enabled' : 'Disabled'} />
            <Info label="Audit retention" value={`${data.auditRetentionDays} days`} />
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Access Controls</CardTitle>
            <CardDescription>Security switches planned for admin operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Info label="Admin invites" value={data.adminInvitesEnabled ? 'Enabled' : 'Disabled'} />
            <Info label="Admin 2FA" value={data.featureFlags.find((flag) => flag.key === 'admin_2fa_required')?.state ? 'Required placeholder' : 'Not required'} />
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Settings are read-only in this MVP</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Future changes should be SUPER_ADMIN-only and written to AuditLog.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Supported Languages</CardTitle>
          <CardDescription>Locales configured for the public and product routes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.supportedLanguages.map((locale) => <Badge key={locale} variant="secondary">{locale}</Badge>)}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Operational feature states and placeholders.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.featureFlags.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{flag.key}</span>
              </div>
              <Badge variant={flag.state ? 'positive' : 'secondary'}>
                {flag.state ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
                {flag.placeholder ? 'Placeholder' : flag.state ? 'On' : 'Off'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
