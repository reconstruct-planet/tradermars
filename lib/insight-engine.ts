import {
  buildDrawdownCurve,
  buildTagPerformance,
  calculateKpis,
  groupByWeekday,
  groupPerformance,
  mistakeSummary,
  sortTrades
} from './metrics';
import type { TradeRecord } from './types';
import { formatCurrency, formatNumber, formatPercent } from './utils';

export type InsightIntent =
  | 'best_symbols'
  | 'worst_symbols'
  | 'best_strategies'
  | 'worst_strategies'
  | 'win_rate'
  | 'profit_factor'
  | 'drawdown'
  | 'weekday_performance'
  | 'session_performance'
  | 'tag_performance'
  | 'mistake_analysis'
  | 'recent_performance_summary'
  | 'risk_reward_summary'
  | 'unknown';

export type InsightChart = {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<Record<string, string | number>>;
  nameKey: string;
  dataKey: string;
  secondaryDataKey?: string;
};

export type InsightAnswer = {
  intent: InsightIntent;
  title: string;
  answer: string;
  confidence: number;
  howCalculated: string;
  supportingRows: Array<Record<string, string | number>>;
  chart?: InsightChart;
  suggestedFollowUps: string[];
  empty?: boolean;
};

type IntentMatch = {
  intent: InsightIntent;
  confidence: number;
  matchedKeywords: string[];
};

type GroupMetricRow = {
  name: string;
  pnl: number;
  trades: number;
  winRate: number;
  averageR: number;
};

const supportedQuestions = [
  'What symbols am I most profitable on?',
  'Which symbols are costing me the most?',
  'What are my best strategies?',
  'Which strategy has the worst win rate?',
  'What is my current win rate?',
  'What is my profit factor?',
  'How bad is my drawdown?',
  'What days of week are best for me?',
  'Which trading session performs best?',
  'Which tags are hurting my performance?',
  'What mistakes show up most often?',
  'Summarize my recent performance.',
  'How is my risk reward profile?'
];

const followUpsByIntent: Record<Exclude<InsightIntent, 'unknown'>, string[]> = {
  best_symbols: [
    'Which symbols are costing me the most?',
    'What is my profit factor?',
    'How is my risk reward profile?'
  ],
  worst_symbols: [
    'What symbols am I most profitable on?',
    'Which tags are hurting my performance?',
    'What mistakes show up most often?'
  ],
  best_strategies: [
    'Which strategy has the worst win rate?',
    'What days of week are best for me?',
    'How is my risk reward profile?'
  ],
  worst_strategies: [
    'What are my best strategies?',
    'Which tags are hurting my performance?',
    'What mistakes show up most often?'
  ],
  win_rate: [
    'What is my profit factor?',
    'How is my risk reward profile?',
    'Summarize my recent performance.'
  ],
  profit_factor: [
    'What is my current win rate?',
    'How bad is my drawdown?',
    'Which strategy has the worst win rate?'
  ],
  drawdown: [
    'How is my risk reward profile?',
    'Summarize my recent performance.',
    'Which tags are hurting my performance?'
  ],
  weekday_performance: [
    'Which trading session performs best?',
    'What are my best strategies?',
    'What symbols am I most profitable on?'
  ],
  session_performance: [
    'What days of week are best for me?',
    'Which strategy has the worst win rate?',
    'How is my risk reward profile?'
  ],
  tag_performance: [
    'What mistakes show up most often?',
    'Which symbols are costing me the most?',
    'How bad is my drawdown?'
  ],
  mistake_analysis: [
    'Which tags are hurting my performance?',
    'Which strategy has the worst win rate?',
    'Summarize my recent performance.'
  ],
  recent_performance_summary: [
    'What is my current win rate?',
    'How bad is my drawdown?',
    'What are my best strategies?'
  ],
  risk_reward_summary: [
    'What is my profit factor?',
    'What is my current win rate?',
    'Which symbols are costing me the most?'
  ]
};

const intentKeywords: Array<{ intent: InsightIntent; keywords: string[] }> = [
  { intent: 'worst_symbols', keywords: ['worst symbol', 'losing symbol', 'costing', 'least profitable', 'bad ticker', 'weak symbol'] },
  { intent: 'best_symbols', keywords: ['best symbol', 'profitable symbol', 'most profitable', 'top symbol', 'ticker', 'symbols'] },
  { intent: 'worst_strategies', keywords: ['worst strategy', 'weak strategy', 'lowest win rate', 'bad strategy', 'strategy losing'] },
  { intent: 'best_strategies', keywords: ['best strategy', 'top strategy', 'profitable strategy', 'strategies'] },
  { intent: 'profit_factor', keywords: ['profit factor', 'gross profit', 'gross loss'] },
  { intent: 'win_rate', keywords: ['win rate', 'winning percentage', 'wins', 'losses'] },
  { intent: 'drawdown', keywords: ['drawdown', 'max drawdown', 'equity pullback', 'losing streak'] },
  { intent: 'weekday_performance', keywords: ['weekday', 'day of week', 'days of week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
  { intent: 'session_performance', keywords: ['session', 'premarket', 'open', 'morning', 'midday', 'afternoon', 'power hour'] },
  { intent: 'tag_performance', keywords: ['tag', 'tags', 'labels', 'hurting'] },
  { intent: 'mistake_analysis', keywords: ['mistake', 'mistakes', 'error', 'discipline', 'revenge', 'fomo', 'overtrade'] },
  { intent: 'recent_performance_summary', keywords: ['recent', 'lately', 'last trades', 'summary', 'this week', 'trend'] },
  { intent: 'risk_reward_summary', keywords: ['risk reward', 'risk/reward', 'r multiple', 'average r', 'expectancy', 'average win', 'average loss'] }
];

export function getSuggestedQuestions() {
  return supportedQuestions;
}

export function classifyInsightIntent(question: string): IntentMatch {
  const normalized = question.toLowerCase().replace(/[?.!,]/g, ' ');
  const asksWorst = /\b(worst|weak|weakest|lowest|bad|least|costing|losing)\b/.test(normalized);
  const asksBest = /\b(best|top|strong|strongest|highest|most profitable|profitable)\b/.test(normalized);

  if (normalized.includes('strategy') && asksWorst) {
    return { intent: 'worst_strategies', confidence: 0.9, matchedKeywords: ['strategy', 'worst'] };
  }

  if (normalized.includes('strategy') && asksBest) {
    return { intent: 'best_strategies', confidence: 0.88, matchedKeywords: ['strategy', 'best'] };
  }

  if ((normalized.includes('symbol') || normalized.includes('ticker')) && asksWorst) {
    return { intent: 'worst_symbols', confidence: 0.9, matchedKeywords: ['symbol', 'worst'] };
  }

  if ((normalized.includes('symbol') || normalized.includes('ticker')) && asksBest) {
    return { intent: 'best_symbols', confidence: 0.88, matchedKeywords: ['symbol', 'best'] };
  }

  let best: IntentMatch = { intent: 'unknown', confidence: 0.35, matchedKeywords: [] };

  for (const candidate of intentKeywords) {
    const matchedKeywords = candidate.keywords.filter((keyword) => normalized.includes(keyword));
    if (!matchedKeywords.length) continue;

    const score = Math.min(0.96, 0.48 + matchedKeywords.length * 0.18 + Math.min(question.length, 90) / 600);
    if (score > best.confidence) {
      best = { intent: candidate.intent, confidence: Number(score.toFixed(2)), matchedKeywords };
    }
  }

  if (best.intent === 'unknown') {
    if (normalized.includes('best')) best = { intent: 'best_symbols', confidence: 0.56, matchedKeywords: ['best'] };
    if (normalized.includes('worst')) best = { intent: 'worst_symbols', confidence: 0.56, matchedKeywords: ['worst'] };
  }

  return best;
}

export function answerTradingQuestion(question: string, trades: TradeRecord[]): InsightAnswer {
  const closedTrades = trades.filter((trade) => trade.exitTime);
  const match = classifyInsightIntent(question);

  if (!closedTrades.length) {
    return emptyAnswer(match.intent);
  }

  switch (match.intent) {
    case 'best_symbols':
      return buildSymbolAnswer(closedTrades, match.confidence, 'best');
    case 'worst_symbols':
      return buildSymbolAnswer(closedTrades, match.confidence, 'worst');
    case 'best_strategies':
      return buildStrategyAnswer(closedTrades, match.confidence, 'best');
    case 'worst_strategies':
      return buildStrategyAnswer(closedTrades, match.confidence, 'worst');
    case 'win_rate':
      return buildWinRateAnswer(closedTrades, match.confidence);
    case 'profit_factor':
      return buildProfitFactorAnswer(closedTrades, match.confidence);
    case 'drawdown':
      return buildDrawdownAnswer(closedTrades, match.confidence);
    case 'weekday_performance':
      return buildWeekdayAnswer(closedTrades, match.confidence);
    case 'session_performance':
      return buildSessionAnswer(closedTrades, match.confidence);
    case 'tag_performance':
      return buildTagAnswer(closedTrades, match.confidence);
    case 'mistake_analysis':
      return buildMistakeAnswer(closedTrades, match.confidence);
    case 'recent_performance_summary':
      return buildRecentAnswer(closedTrades, match.confidence);
    case 'risk_reward_summary':
      return buildRiskRewardAnswer(closedTrades, match.confidence);
    default:
      return buildRiskRewardAnswer(closedTrades, 0.42);
  }
}

function buildSymbolAnswer(trades: TradeRecord[], confidence: number, mode: 'best' | 'worst'): InsightAnswer {
  const rows = sortedGroups(groupPerformance(trades, (trade) => trade.symbol), mode).slice(0, 6);
  const lead = rows[0];

  return {
    intent: mode === 'best' ? 'best_symbols' : 'worst_symbols',
    title: mode === 'best' ? 'Best symbols by net P&L' : 'Weakest symbols by net P&L',
    answer: lead
      ? `${lead.name} is ${mode === 'best' ? 'leading' : 'dragging'} your symbol performance with ${formatCurrency(lead.pnl)} across ${lead.trades} closed trades.`
      : 'There are not enough symbol-level trades to rank yet.',
    confidence,
    howCalculated: 'Grouped closed trades by symbol, summed net P&L, then sorted by total net P&L.',
    supportingRows: rows.map(formatGroupRow),
    chart: makeBarChart('Symbol P&L', rows),
    suggestedFollowUps: followUpsByIntent[mode === 'best' ? 'best_symbols' : 'worst_symbols']
  };
}

function buildStrategyAnswer(trades: TradeRecord[], confidence: number, mode: 'best' | 'worst'): InsightAnswer {
  const groups = groupPerformance(trades, (trade) => trade.strategy ?? 'Unassigned');
  const rows = (mode === 'best'
    ? groups.sort((a, b) => b.pnl - a.pnl)
    : groups.sort((a, b) => a.winRate - b.winRate || a.pnl - b.pnl)
  ).slice(0, 6);
  const lead = rows[0];

  return {
    intent: mode === 'best' ? 'best_strategies' : 'worst_strategies',
    title: mode === 'best' ? 'Best strategies' : 'Strategies needing review',
    answer: lead
      ? mode === 'best'
        ? `${lead.name} is your strongest strategy at ${formatCurrency(lead.pnl)} with a ${formatPercent(lead.winRate)} win rate.`
        : `${lead.name} has the weakest win rate at ${formatPercent(lead.winRate)} and has produced ${formatCurrency(lead.pnl)}.`
      : 'There are not enough strategy labels to compare yet.',
    confidence,
    howCalculated: mode === 'best'
      ? 'Grouped closed trades by strategy and sorted by net P&L.'
      : 'Grouped closed trades by strategy and sorted by win rate first, then net P&L.',
    supportingRows: rows.map(formatGroupRow),
    chart: makeBarChart(mode === 'best' ? 'Strategy P&L' : 'Strategy win rate', rows, mode === 'best' ? 'pnl' : 'winRate'),
    suggestedFollowUps: followUpsByIntent[mode === 'best' ? 'best_strategies' : 'worst_strategies']
  };
}

function buildWinRateAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const kpis = calculateKpis(trades);
  const losses = Math.max(0, kpis.totalTrades - kpis.wins);

  return {
    intent: 'win_rate',
    title: 'Win rate',
    answer: `Your win rate is ${formatPercent(kpis.winRate)} from ${kpis.wins} winners and ${losses} losing trades.`,
    confidence,
    howCalculated: 'Counted closed trades with positive net P&L and divided by total closed trades.',
    supportingRows: [
      { metric: 'Win rate', value: formatPercent(kpis.winRate) },
      { metric: 'Winning trades', value: kpis.wins },
      { metric: 'Losing trades', value: losses },
      { metric: 'Closed trades', value: kpis.totalTrades }
    ],
    chart: {
      type: 'pie',
      title: 'Wins vs losses',
      data: [
        { name: 'Wins', value: kpis.wins },
        { name: 'Losses', value: losses }
      ],
      nameKey: 'name',
      dataKey: 'value'
    },
    suggestedFollowUps: followUpsByIntent.win_rate
  };
}

function buildProfitFactorAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const kpis = calculateKpis(trades);

  return {
    intent: 'profit_factor',
    title: 'Profit factor',
    answer: `Your profit factor is ${formatNumber(kpis.profitFactor)}. Gross profit is ${formatCurrency(kpis.grossProfit)} versus ${formatCurrency(kpis.grossLoss)} in gross losses.`,
    confidence,
    howCalculated: 'Divided gross profit from winning closed trades by absolute gross loss from losing closed trades.',
    supportingRows: [
      { metric: 'Profit factor', value: formatNumber(kpis.profitFactor) },
      { metric: 'Gross profit', value: formatCurrency(kpis.grossProfit) },
      { metric: 'Gross loss', value: formatCurrency(kpis.grossLoss) },
      { metric: 'Net P&L', value: formatCurrency(kpis.netPnl) }
    ],
    chart: {
      type: 'bar',
      title: 'Gross profit vs loss',
      data: [
        { name: 'Gross profit', value: kpis.grossProfit },
        { name: 'Gross loss', value: kpis.grossLoss }
      ],
      nameKey: 'name',
      dataKey: 'value'
    },
    suggestedFollowUps: followUpsByIntent.profit_factor
  };
}

function buildDrawdownAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const kpis = calculateKpis(trades);
  const curve = buildDrawdownCurve(trades);
  const worstPoint = [...curve].sort((a, b) => b.drawdown - a.drawdown)[0];

  return {
    intent: 'drawdown',
    title: 'Drawdown profile',
    answer: `Your max drawdown is ${formatCurrency(kpis.maxDrawdown)}${worstPoint ? `, peaking on ${worstPoint.date} after ${worstPoint.symbol}` : ''}.`,
    confidence,
    howCalculated: 'Sorted closed trades by exit time, tracked cumulative equity peaks, and measured each pullback from peak equity.',
    supportingRows: curve.slice(-8).map((point) => ({
      date: point.date,
      symbol: point.symbol,
      drawdown: formatCurrency(point.drawdown),
      pnl: formatCurrency(point.pnl)
    })),
    chart: {
      type: 'line',
      title: 'Drawdown curve',
      data: curve.map((point) => ({ date: point.date, drawdown: point.drawdown })),
      nameKey: 'date',
      dataKey: 'drawdown'
    },
    suggestedFollowUps: followUpsByIntent.drawdown
  };
}

function buildWeekdayAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const rows = groupByWeekday(trades);
  const best = [...rows].sort((a, b) => b.pnl - a.pnl)[0];

  return {
    intent: 'weekday_performance',
    title: 'Weekday performance',
    answer: best
      ? `${best.name} is your strongest weekday with ${formatCurrency(best.pnl)} and a ${formatPercent(best.winRate)} win rate.`
      : 'There are not enough dated trades to compare weekdays.',
    confidence,
    howCalculated: 'Grouped closed trades by the weekday of their exit time and calculated net P&L, win rate, trade count, and average R.',
    supportingRows: rows.map(formatGroupRow),
    chart: makeBarChart('P&L by weekday', rows),
    suggestedFollowUps: followUpsByIntent.weekday_performance
  };
}

function buildSessionAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const rows = groupPerformance(trades, (trade) => trade.session ?? inferSession(trade.entryTime)).slice(0, 6);
  const best = rows[0];

  return {
    intent: 'session_performance',
    title: 'Session performance',
    answer: best
      ? `${best.name} is your best trading session at ${formatCurrency(best.pnl)} across ${best.trades} trades.`
      : 'There are not enough session labels to compare yet.',
    confidence,
    howCalculated: 'Used the saved session label when present; otherwise inferred a broad session from entry hour, then grouped closed trades by session.',
    supportingRows: rows.map(formatGroupRow),
    chart: makeBarChart('P&L by session', rows),
    suggestedFollowUps: followUpsByIntent.session_performance
  };
}

function buildTagAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const rows = buildTagPerformance(trades).sort((a, b) => a.pnl - b.pnl).slice(0, 6);
  const worst = rows[0];

  return {
    intent: 'tag_performance',
    title: 'Tag performance',
    answer: worst
      ? `${worst.name} is the tag most associated with losses at ${formatCurrency(worst.pnl)} across ${worst.trades} tagged trades.`
      : 'No tagged trades are available yet.',
    confidence,
    howCalculated: 'Expanded trades by tag, grouped by tag name, then ranked tags by net P&L from lowest to highest.',
    supportingRows: rows.map(formatGroupRow),
    chart: makeBarChart('Lowest P&L tags', rows),
    suggestedFollowUps: followUpsByIntent.tag_performance
  };
}

function buildMistakeAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const rows = mistakeSummary(trades).sort((a, b) => a.pnl - b.pnl).slice(0, 6);
  const worst = rows[0];

  return {
    intent: 'mistake_analysis',
    title: 'Mistake analysis',
    answer: worst
      ? `${worst.name} is the most expensive recorded mistake, linked to ${formatCurrency(worst.pnl)} across ${worst.trades} trades.`
      : 'No mistake labels are recorded yet. Add mistake tags to trade reviews to unlock this view.',
    confidence,
    howCalculated: 'Filtered trades with a mistake label, grouped by mistake, then ranked by net P&L from lowest to highest.',
    supportingRows: rows.map(formatGroupRow),
    chart: makeBarChart('Mistake cost', rows),
    suggestedFollowUps: followUpsByIntent.mistake_analysis
  };
}

function buildRecentAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const recent = sortTrades(trades).slice(-20);
  const kpis = calculateKpis(recent);
  const dailyRows = groupPerformance(recent, (trade) => new Date(trade.exitTime ?? trade.entryTime).toISOString().slice(5, 10));

  return {
    intent: 'recent_performance_summary',
    title: 'Recent performance summary',
    answer: `Across your last ${kpis.totalTrades} closed trades, net P&L is ${formatCurrency(kpis.netPnl)}, win rate is ${formatPercent(kpis.winRate)}, and expectancy is ${formatCurrency(kpis.expectancy)} per trade.`,
    confidence,
    howCalculated: 'Sorted closed trades chronologically, selected the most recent 20, then recalculated KPI metrics on that subset.',
    supportingRows: [
      { metric: 'Recent net P&L', value: formatCurrency(kpis.netPnl) },
      { metric: 'Recent win rate', value: formatPercent(kpis.winRate) },
      { metric: 'Recent profit factor', value: formatNumber(kpis.profitFactor) },
      { metric: 'Recent expectancy', value: formatCurrency(kpis.expectancy) },
      { metric: 'Recent average R', value: formatNumber(kpis.averageR) }
    ],
    chart: makeBarChart('Recent daily P&L', dailyRows),
    suggestedFollowUps: followUpsByIntent.recent_performance_summary
  };
}

function buildRiskRewardAnswer(trades: TradeRecord[], confidence: number): InsightAnswer {
  const kpis = calculateKpis(trades);

  return {
    intent: 'risk_reward_summary',
    title: 'Risk/reward summary',
    answer: `Your expectancy is ${formatCurrency(kpis.expectancy)} per trade with an average win of ${formatCurrency(kpis.averageWin)}, average loss of ${formatCurrency(kpis.averageLoss)}, and average R of ${formatNumber(kpis.averageR)}.`,
    confidence,
    howCalculated: 'Calculated average win, average loss, win rate, loss rate, expectancy, profit factor, and average R from closed trades.',
    supportingRows: [
      { metric: 'Expectancy', value: formatCurrency(kpis.expectancy) },
      { metric: 'Average win', value: formatCurrency(kpis.averageWin) },
      { metric: 'Average loss', value: formatCurrency(kpis.averageLoss) },
      { metric: 'Average R', value: formatNumber(kpis.averageR) },
      { metric: 'Profit factor', value: formatNumber(kpis.profitFactor) }
    ],
    chart: {
      type: 'bar',
      title: 'Average win/loss',
      data: [
        { name: 'Average win', value: kpis.averageWin },
        { name: 'Average loss', value: kpis.averageLoss }
      ],
      nameKey: 'name',
      dataKey: 'value'
    },
    suggestedFollowUps: followUpsByIntent.risk_reward_summary
  };
}

function emptyAnswer(intent: InsightIntent): InsightAnswer {
  return {
    intent,
    title: 'No trade data yet',
    answer: 'Import or add closed trades before asking the analytics assistant for performance insights.',
    confidence: 1,
    howCalculated: 'The engine looked for closed trades with exit timestamps and did not find any.',
    supportingRows: [],
    suggestedFollowUps: [
      'Download the sample CSV from Import Center',
      'Add a closed trade manually',
      'Come back after importing your first batch'
    ],
    empty: true
  };
}

function sortedGroups(rows: GroupMetricRow[], mode: 'best' | 'worst') {
  return [...rows].sort((a, b) => (mode === 'best' ? b.pnl - a.pnl : a.pnl - b.pnl));
}

function formatGroupRow(row: GroupMetricRow) {
  return {
    name: row.name,
    pnl: formatCurrency(row.pnl),
    trades: row.trades,
    winRate: formatPercent(row.winRate),
    averageR: formatNumber(row.averageR)
  };
}

function makeBarChart(title: string, rows: GroupMetricRow[], dataKey: 'pnl' | 'winRate' = 'pnl'): InsightChart {
  return {
    type: 'bar',
    title,
    data: rows.map((row) => ({
      name: row.name,
      pnl: row.pnl,
      winRate: Number((row.winRate * 100).toFixed(1)),
      trades: row.trades
    })),
    nameKey: 'name',
    dataKey
  };
}

function inferSession(entryTime: string) {
  const hour = new Date(entryTime).getUTCHours();
  if (hour < 13) return 'Pre-market';
  if (hour < 16) return 'Opening drive';
  if (hour < 19) return 'Midday';
  if (hour < 21) return 'Power hour';
  return 'After-hours';
}

// Future LLM adapter boundary:
// Replace the keyword classifier and answer wording with an LLM adapter later, but keep
// these deterministic analytics functions as audited tools that produce cited context.
