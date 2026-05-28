import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 animate-pulse rounded-md bg-secondary" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-md bg-secondary" />
      </div>
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Loading filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-md bg-secondary" />
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-md">
        <CardContent className="space-y-3 pt-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-secondary" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
