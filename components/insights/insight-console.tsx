'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Bot, BrainCircuit, Clock3, Database, MessageSquare, Send, Sparkles, UserRound } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { answerTradingQuestion, type InsightAnswer, type InsightChart } from '@/lib/insight-engine';
import type { TradeRecord } from '@/lib/types';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answer?: InsightAnswer;
};

const chartColors = ['#14b8a6', '#f59e0b', '#6366f1', '#ef4444', '#22c55e', '#06b6d4'];

export function InsightConsole({ trades }: { trades: TradeRecord[] }) {
  const { locale, t, dictionary, formatPercent } = useI18n();
  const suggestedQuestions = dictionary.insights?.suggestedQuestions ?? [];
  const initialQuestion = suggestedQuestions[0] ?? 'What symbols am I most profitable on?';
  const initialAnswer = useMemo(() => answerTradingQuestion(initialQuestion, trades), [initialQuestion, trades]);
  const [question, setQuestion] = useState(initialQuestion);
  const [activeAnswer, setActiveAnswer] = useState(initialAnswer);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId('assistant'),
      role: 'assistant',
      content: initialAnswer.answer,
      answer: initialAnswer
    }
  ]);

  const askedQuestions = messages.filter((message) => message.role === 'user').map((message) => message.content);
  const hasTrades = trades.some((trade) => trade.exitTime);

  function ask(event?: FormEvent, prompt = question) {
    event?.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const nextAnswer = answerTradingQuestion(trimmed, trades);
    setQuestion(trimmed);
    setActiveAnswer(nextAnswer);
    setMessages((current) => [
      ...current,
      { id: makeId('user'), role: 'user', content: trimmed },
      { id: makeId('assistant'), role: 'assistant', content: nextAnswer.answer, answer: nextAnswer }
    ]);
  }

  function askSuggestion(prompt: string) {
    ask(undefined, prompt);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-3 w-fit gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {t('insights.badge')}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">{t('insights.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              {t('insights.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MetricPill label={t('insights.metricClosedTrades')} value={trades.filter((trade) => trade.exitTime).length.toString()} />
            <MetricPill label={t('insights.metricIntents')} value="13" />
            <MetricPill label={t('insights.metricApiCalls')} value="0" />
          </div>
        </div>
      </section>

      {!hasTrades ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.noTradesTitle')}</CardTitle>
            <CardDescription>{t('insights.noTradesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href={`/${locale}/import`}>{t('insights.openImportCenter')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_440px]">
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4 w-4 text-primary" />
                {t('insights.history')}
              </CardTitle>
              <CardDescription>{t('insights.historyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {askedQuestions.length ? (
                askedQuestions.slice(-6).reverse().map((item, index) => (
                  <button
                    key={`${item}-${index}`}
                    className="w-full rounded-md border bg-background px-3 py-2 text-left text-xs leading-5 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    onClick={() => askSuggestion(item)}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  {t('insights.emptyHistory')}
                </div>
              )}
              <div className="rounded-md bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground">
                {t('insights.placeholderNotice')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-primary" />
                {t('insights.engineTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-5 text-muted-foreground">
              <PipelineStep title={t('insights.pipelineClassify')} copy={t('insights.pipelineClassifyCopy')} />
              <PipelineStep title={t('insights.pipelineCompute')} copy={t('insights.pipelineComputeCopy')} />
              <PipelineStep title={t('insights.pipelineExplain')} copy={t('insights.pipelineExplainCopy')} />
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                {t('insights.askTitle')}
              </CardTitle>
              <CardDescription>{t('insights.askDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} onInspect={message.answer ? () => setActiveAnswer(message.answer!) : undefined} />
                ))}
              </div>

              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => ask(event)}>
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={t('insights.placeholder')}
                  className="h-11"
                />
                <Button type="submit" className="h-11">
                  <Send className="mr-2 h-4 w-4" />
                  {t('insights.ask')}
                </Button>
              </form>

              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((item) => (
                  <Button key={item} variant="outline" size="sm" onClick={() => askSuggestion(item)}>
                    {item}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        <InsightResult answer={activeAnswer} onAsk={askSuggestion} />
      </div>
    </div>
  );
}

function InsightResult({ answer, onAsk }: { answer: InsightAnswer; onAsk: (question: string) => void }) {
  const { t, dictionary, formatPercent } = useI18n();
  const columns = Object.keys(answer.supportingRows[0] ?? {});
  const answerTitle = answer.empty ? t('insights.noTradesTitle') : t('insights.resultTitle');
  const answerCopy = answer.empty ? t('insights.noTradesDescription') : t('insights.resultSummary');
  const suggestedQuestions = dictionary.insights?.suggestedQuestions ?? [];
  const followUps = answer.empty ? suggestedQuestions.slice(0, 3) : suggestedQuestions.slice(1, 4);

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{answerTitle}</CardTitle>
              <CardDescription className="mt-2 leading-6">{answerCopy}</CardDescription>
            </div>
            <Badge variant={answer.empty ? 'secondary' : 'default'}>{formatPercent(answer.confidence, 0)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-secondary/50 p-3 text-sm leading-6">
            <div className="mb-1 flex items-center gap-2 font-medium">
              <BrainCircuit className="h-4 w-4 text-primary" />
              {t('insights.howCalculated')}
            </div>
            <p className="text-muted-foreground">{t('insights.localCalculation')}</p>
          </div>

          {answer.chart ? <InsightChartView chart={{ ...answer.chart, title: t('insights.supportingChart') }} /> : null}

          {columns.length ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="capitalize">{t(`insights.tableColumns.${column}`)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {answer.supportingRows.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column} className="text-xs">{String(row[column])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            {t('insights.followUp')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {followUps.map((item) => (
            <Button key={item} variant="outline" size="sm" onClick={() => onAsk(item)}>
              {item}
            </Button>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function InsightChartView({ chart }: { chart: InsightChart }) {
  if (!chart.data.length) return null;

  return (
    <div className="rounded-md border bg-background p-3">
      <p className="mb-3 text-sm font-medium">{chart.title}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'line' ? (
            <LineChart data={chart.data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={chart.nameKey} tick={{ fontSize: 11 }} minTickGap={18} />
              <YAxis tick={{ fontSize: 11 }} width={52} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey={chart.dataKey} stroke="#14b8a6" strokeWidth={2} dot={false} />
            </LineChart>
          ) : chart.type === 'pie' ? (
            <PieChart>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
              <Pie data={chart.data} dataKey={chart.dataKey} nameKey={chart.nameKey} innerRadius={54} outerRadius={86} paddingAngle={4}>
                {chart.data.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chart.data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={chart.nameKey} tick={{ fontSize: 11 }} minTickGap={12} />
              <YAxis tick={{ fontSize: 11 }} width={52} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey={chart.dataKey} radius={[4, 4, 0, 0]} fill="#14b8a6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChatBubble({ message, onInspect }: { message: ChatMessage; onInspect?: () => void }) {
  const { t, formatPercent } = useI18n();
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      ) : null}
      <div className={cn('max-w-[82%] rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm', isUser ? 'bg-primary text-primary-foreground' : 'bg-card')}>
        <p>{message.content}</p>
        {message.answer ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{message.answer.intent.replaceAll('_', ' ')}</Badge>
            <Badge variant="outline">{formatPercent(message.answer.confidence, 0)} {t('insights.confidence')}</Badge>
            {onInspect ? (
              <Button size="sm" variant="outline" className="h-7 bg-background/70" onClick={onInspect}>
                {t('insights.inspect')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
          <UserRound className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/75 px-3 py-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function PipelineStep({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="font-medium text-foreground">{title}</p>
      <p>{copy}</p>
    </div>
  );
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
