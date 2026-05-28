import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getMessage, type Messages } from '@/lib/i18n-messages';
import type { NoteRecord } from '@/lib/types';
import { defaultLocale, type Locale } from '@/lib/i18n-routing';
import { formatDateForLocale } from '@/lib/utils';

export function NotesWorkspace({ locale = defaultLocale, messages, notes }: { locale?: Locale; messages: Messages; notes: NoteRecord[] }) {
  const t = (key: string, values?: Record<string, string | number>) => getMessage(messages, key, values);
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => formatDateForLocale(date, locale, options);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('workspaces.notes.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('workspaces.notes.subtitle')}</p>
        </div>
        <Button disabled>{t('workspaces.notes.newNote')}</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('workspaces.notes.quickCapture')}</CardTitle>
            <CardDescription>{t('workspaces.notes.quickCaptureDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder={t('workspaces.notes.placeholder')} />
            <Button disabled>{t('workspaces.notes.saveNote')}</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{note.title}</CardTitle>
                  <Badge variant="secondary">{note.scope}</Badge>
                  {note.tagName ? <Badge variant="outline">{note.tagName}</Badge> : null}
                </div>
                <CardDescription>
                  {formatDate(note.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                  {note.mood ? ` · ${note.mood}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{note.content}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
