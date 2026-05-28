import type { TradeRecord } from './types';

export type KpiMetrics = {
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  expectancy: number;
  averageR: number;
  totalTrades: number;
  maxDrawdown: number;
  wins: number;
  losses: number;
  bestTrade: TradeRecord | null;
  worstTrade: TradeRecord | null;
};

export type TradeFilters = {
  dateStart?: string;
  dateEnd?: string;
  assetType?: string;
  strategy?: string;
  tag?: string;
};

export function calculateKpis(trades: TradeRecord[]): KpiMetrics {
  const closedTrades = trades.filter((trade) => trade.exitTime);
  const netPnl = sum(closedTrades.map((trade) => trade.netPnl));
  const wins = closedTrades.filter((trade) => trade.netPnl > 0);
  const losses = closedTrades.filter((trade) => trade.netPnl < 0);
  const grossProfit = sum(wins.map((trade) => trade.netPnl));
  const grossLoss = Math.abs(sum(losses.map((trade) => trade.netPnl)));
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  const averageWin = wins.length ? grossProfit / wins.length : 0;
  const averageLoss = losses.length ? sum(losses.map((trade) => trade.netPnl)) / losses.length : 0;
  const winRate = closedTrades.length ? wins.length / closedTrades.length : 0;
  const lossRate = closedTrades.length ? losses.length / closedTrades.length : 0;
  const expectancy = winRate * averageWin + lossRate * averageLoss;
  const averageR = closedTrades.length
    ? sum(closedTrades.map((trade) => trade.rMultiple)) / closedTrades.length
    : 0;
  const ranked = [...closedTrades].sort((a, b) => b.netPnl - a.netPnl);

  return {
    netPnl,
    grossProfit,
    grossLoss,
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    expectancy,
    averageR,
    totalTrades: closedTrades.length,
    maxDrawdown: calculateMaxDrawdown(closedTrades),
    wins: wins.length,
    losses: losses.length,
    bestTrade: ranked[0] ?? null,
    worstTrade: ranked.at(-1) ?? null
  };
}

export const calculateAdvancedMetrics = calculateKpis;

export function filterTrades(trades: TradeRecord[], filters: TradeFilters) {
  return trades.filter((trade) => {
    const tradeDate = dayKey(trade.exitTime ?? trade.entryTime);
    return (
      (!filters.dateStart || tradeDate >= filters.dateStart) &&
      (!filters.dateEnd || tradeDate <= filters.dateEnd) &&
      (!filters.assetType || trade.assetType === filters.assetType) &&
      (!filters.strategy || trade.strategy === filters.strategy) &&
      (!filters.tag || trade.tags.includes(filters.tag))
    );
  });
}

export function calculateMaxDrawdown(trades: TradeRecord[]) {
  const ordered = [...trades].sort(
    (a, b) => new Date(a.exitTime ?? a.entryTime).getTime() - new Date(b.exitTime ?? b.entryTime).getTime()
  );
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const trade of ordered) {
    equity += trade.netPnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  return maxDrawdown;
}

export function buildEquityCurve(trades: TradeRecord[], startingBalance = 50000) {
  let equity = startingBalance;
  return [...trades]
    .sort((a, b) => new Date(a.exitTime ?? a.entryTime).getTime() - new Date(b.exitTime ?? b.entryTime).getTime())
    .map((trade) => {
      equity += trade.netPnl;
      return {
        date: dayKey(trade.exitTime ?? trade.entryTime),
        equity,
        cumulativePnl: equity - startingBalance,
        pnl: trade.netPnl,
        trade: trade.symbol
      };
    });
}

export function buildDrawdownCurve(trades: TradeRecord[]) {
  let equity = 0;
  let peak = 0;

  return sortTrades(trades).map((trade) => {
    equity += trade.netPnl;
    peak = Math.max(peak, equity);
    return {
      date: dayKey(trade.exitTime ?? trade.entryTime),
      drawdown: peak - equity,
      pnl: trade.netPnl,
      symbol: trade.symbol
    };
  });
}

export function groupPerformance<T extends TradeRecord>(
  trades: T[],
  keySelector: (trade: T) => string
) {
  const groups = new Map<string, T[]>();

  for (const trade of trades) {
    const key = keySelector(trade) || 'Unassigned';
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  }

  return Array.from(groups.entries())
    .map(([name, rows]) => {
      const kpis = calculateKpis(rows);
      return {
        name,
        pnl: kpis.netPnl,
        trades: kpis.totalTrades,
        winRate: kpis.winRate,
        averageR: kpis.averageR
      };
    })
    .sort((a, b) => b.pnl - a.pnl);
}

export function groupByDay(trades: TradeRecord[]) {
  return groupPerformance(trades, (trade) => dayKey(trade.exitTime ?? trade.entryTime));
}

export function groupByWeekday(trades: TradeRecord[], locale = 'en-US') {
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  return groupPerformance(trades, (trade) =>
    formatter.format(new Date(trade.exitTime ?? trade.entryTime))
  ).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

export function groupByMonth(trades: TradeRecord[], locale = 'en-US') {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
  return groupPerformance(trades, (trade) =>
    formatter.format(new Date(trade.exitTime ?? trade.entryTime))
  );
}

export function buildCalendarDays(trades: TradeRecord[]) {
  const groups = new Map<string, TradeRecord[]>();
  for (const trade of trades) {
    const key = dayKey(trade.exitTime ?? trade.entryTime);
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  }

  return Array.from(groups.entries()).map(([date, rows]) => {
    const kpis = calculateKpis(rows);
    return {
      date,
      pnl: kpis.netPnl,
      trades: rows.length,
      wins: kpis.wins,
      losses: kpis.losses,
      rows
    };
  });
}

export function buildWinRateTrend(trades: TradeRecord[]) {
  let wins = 0;
  return [...trades]
    .sort((a, b) => new Date(a.exitTime ?? a.entryTime).getTime() - new Date(b.exitTime ?? b.entryTime).getTime())
    .map((trade, index) => {
      if (trade.netPnl > 0) wins += 1;
      return {
        trade: index + 1,
        winRate: wins / (index + 1),
        symbol: trade.symbol
      };
    });
}

export function mistakeSummary(trades: TradeRecord[]) {
  return groupPerformance(
    trades.filter((trade) => trade.mistake),
    (trade) => trade.mistake ?? 'No mistake'
  );
}

export function buildTradeDurationScatter(trades: TradeRecord[]) {
  return trades
    .filter((trade) => trade.exitTime)
    .map((trade) => ({
      id: trade.id,
      symbol: trade.symbol,
      durationMinutes: Math.max(
        0,
        Math.round((new Date(trade.exitTime ?? trade.entryTime).getTime() - new Date(trade.entryTime).getTime()) / 60000)
      ),
      pnl: trade.netPnl,
      strategy: trade.strategy ?? 'Unassigned'
    }));
}

export function buildHourOfDayPerformance(trades: TradeRecord[]) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    pnl: 0,
    trades: 0,
    winRate: 0,
    wins: 0
  }));

  for (const trade of trades) {
    const hour = new Date(trade.entryTime).getUTCHours();
    buckets[hour].pnl += trade.netPnl;
    buckets[hour].trades += 1;
    if (trade.netPnl > 0) buckets[hour].wins += 1;
  }

  return buckets.map((bucket) => ({
    ...bucket,
    winRate: bucket.trades ? bucket.wins / bucket.trades : 0
  }));
}

export function buildTagPerformance(trades: TradeRecord[]) {
  return groupPerformance(
    trades.flatMap((trade) => trade.tags.map((tag) => ({ ...trade, tag }))),
    (trade) => trade.tag
  );
}

export function sortTrades(trades: TradeRecord[]) {
  return [...trades].sort(
    (a, b) => new Date(a.exitTime ?? a.entryTime).getTime() - new Date(b.exitTime ?? b.entryTime).getTime()
  );
}

export function dayKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
