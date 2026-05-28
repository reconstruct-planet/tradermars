import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getMessage, type Messages } from '@/lib/i18n-messages';
import type { TagRecord } from '@/lib/types';

export function TagsWorkspace({ messages, tags }: { messages: Messages; tags: TagRecord[] }) {
  const t = (key: string, values?: Record<string, string | number>) => getMessage(messages, key, values);
  const categories = Array.from(new Set(tags.map((tag) => tag.category)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('workspaces.tags.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('workspaces.tags.subtitle')}</p>
        </div>
        <Button disabled>{t('workspaces.tags.createTag')}</Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input placeholder={t('workspaces.tags.tagName')} />
          <Input placeholder={t('workspaces.tags.category')} />
          <Input placeholder="#0f766e" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>{t('workspaces.tags.tagCount', { count: tags.filter((tag) => tag.category === category).length })}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tags.filter((tag) => tag.category === category).map((tag) => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color }}>
                  {tag.name} · {tag.tradeCount ?? 0}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
