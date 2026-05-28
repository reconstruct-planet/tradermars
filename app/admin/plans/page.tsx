import { Check, Minus } from 'lucide-react';
import { PlanBadge } from '@/components/admin/admin-badges';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatAdminDate,
  formatAdminNumber,
  getAdminPlansData,
  requireAdmin
} from '@/lib/admin';
import { featureLabels, planOrder } from '@/lib/plans';

export default async function AdminPlansPage() {
  await requireAdmin('plans.view', '/admin/plans');
  const data = await getAdminPlansData();
  const featureKeys = Object.keys(featureLabels) as Array<keyof typeof featureLabels>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Plans & Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan distribution, usage limits, feature gates, and manual plan changes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.plans.map((plan) => (
          <Card key={plan.id} className="rounded-md">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <PlanBadge plan={plan.id} />
                <span className="text-2xl font-semibold">{formatAdminNumber(plan.userCount)}</span>
              </div>
              <CardDescription>{plan.definition.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Limit label="Monthly price" value={`$${plan.definition.monthlyPrice}`} />
              <Limit label="Account limit" value={String(plan.definition.accountLimit)} />
              <Limit label="Import limit" value={String(plan.definition.importLimit)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Feature Gates</CardTitle>
          <CardDescription>Server-side plan feature matrix currently used by the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                {planOrder.map((plan) => <TableHead key={plan} className="text-center">{plan}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureKeys.map((feature) => (
                <TableRow key={feature}>
                  <TableCell className="font-medium">{featureLabels[feature]}</TableCell>
                  {planOrder.map((plan) => {
                    const enabled = data.plans.find((item) => item.id === plan)?.definition.features.includes(feature);
                    return (
                      <TableCell key={plan} className="text-center">
                        {enabled ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Recent Plan Changes</CardTitle>
          <CardDescription>Manual plan changes made through the admin console.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.planLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.actor?.name ?? 'System'}</TableCell>
                  <TableCell>{log.target?.name ?? 'Unknown user'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{JSON.stringify(log.metadata ?? {})}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDate(log.createdAt)}</TableCell>
                </TableRow>
              ))}
              {data.planLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">No manual plan changes yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
