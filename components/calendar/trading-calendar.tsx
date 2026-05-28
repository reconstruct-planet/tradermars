'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildCalendarDays, dayKey } from '@/lib/metrics';
import type { DailyPlanRecord, NoteRecord, TradeRecord } from '@/lib/types';

export function TradingCalendar({
  trades,
  notes,
  dailyPlans
}: {
  trades: TradeRecord[];
  notes: NoteRecord[];
  dailyPlans: DailyPlanRecord[];
}) {
  const { t, formatCurrency, formatDate } = useI18n();
  const [month, setMonth] = useState(new Date('2026-05-01T00:00:00.000Z'));
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date('2026-05-26T00:00:00.000Z'));
  const summaries = useMemo(() => buildCalendarDays(trades), [trades]);
  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month))
  }), [month]);
  const selectedKey = selectedDay ? dayKey(selectedDay) : null;
  const selectedSummary = useMemo(
    () => selectedKey ? summaries.find((summary) => summary.date === selectedKey) : null,
    [selectedKey, summaries]
  );
  const selectedNotes = useMemo(
    () => selectedKey ? notes.filter((note) => note.day?.slice(0, 10) === selectedKey) : [],
    [notes, selectedKey]
  );
  const selectedPlan = useMemo(
    () => selectedKey ? dailyPlans.find((plan) => plan.day.slice(0, 10) === selectedKey) : null,
    [dailyPlans, selectedKey]
  );
  const weekdays = t('calendar.weekdays') as unknown as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('calendar.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-44 text-center font-medium">{formatDate(month, { month: 'long', year: 'numeric' })}</div>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2 text-xs font-medium uppercase text-muted-foreground">
              {weekdays.map((day) => <div key={day} className="p-2">{day}</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((day) => {
                const summary = summaries.find((item) => item.date === dayKey(day));
                const inMonth = day.getMonth() === month.getMonth();
                const active = selectedDay && isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toISOString()}
                    className={`min-h-28 rounded-md border p-2 text-left transition-colors hover:bg-secondary ${!inMonth ? 'opacity-45' : ''} ${active ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatDate(day, { day: 'numeric' })}</span>
                      {summary ? <Badge variant={summary.pnl >= 0 ? 'positive' : 'negative'}>{summary.trades}</Badge> : null}
                    </div>
                    {summary ? (
                      <div className="mt-3 space-y-1">
                        <p className={`text-base font-semibold ${summary.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(summary.pnl)}</p>
                        <p className="text-xs text-muted-foreground">{summary.wins}W / {summary.losses}L</p>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{selectedDay ? formatDate(selectedDay, { dateStyle: 'long' }) : t('calendar.dayDetail')}</CardTitle>
            {selectedDay ? (
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSummary ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Stat label="P&L" value={formatCurrency(selectedSummary.pnl)} tone={selectedSummary.pnl >= 0 ? 'positive' : 'negative'} />
                  <Stat label={t('calendar.trades')} value={String(selectedSummary.trades)} />
                  <Stat label={t('calendar.record')} value={`${selectedSummary.wins}W/${selectedSummary.losses}L`} />
                </div>
                <div className="space-y-2">
                  {selectedSummary.rows.map((trade) => (
                    <div key={trade.id} className="rounded-md border p-3 text-sm">
                      <div className="flex justify-between">
                        <strong>{trade.symbol}</strong>
                        <span className={trade.netPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(trade.netPnl)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{trade.strategy ?? t('common.unassigned')} · {trade.tags.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('calendar.noTrades')}</p>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('calendar.notes')}</h3>
              {selectedNotes.length ? selectedNotes.map((note) => (
                <div key={note.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{note.title}</p>
                  <p className="mt-1 text-muted-foreground">{note.content}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">{t('calendar.noNotes')}</p>}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('calendar.planChecklist')}</h3>
              {selectedPlan ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{selectedPlan.bias}</p>
                  <p className="mt-2 text-muted-foreground">{selectedPlan.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('calendar.noPlan')}</p>
              )}
            </div>

            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('calendar.screenshots')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold ${tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}
