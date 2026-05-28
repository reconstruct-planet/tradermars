import { describe, expect, it } from 'vitest';
import {
  buildDrawdownCurve,
  buildEquityCurve,
  buildHourOfDayPerformance,
  buildTradeDurationScatter,
  calculateKpis,
  calculateMaxDrawdown,
  filterTrades,
  groupPerformance
} from '@/lib/metrics';
import type { TradeRecord } from '@/lib/types';

const trades: TradeRecord[] = [
  trade('one', 'AAPL', 100, 1),
  trade('two', 'AAPL', -50, -0.5),
  trade('three', 'MSFT', 200, 2),
  trade('four', 'TSLA', -150, -1.5)
];

describe('trade metrics', () => {
  it('calculates KPI metrics from closed trades', () => {
    const kpis = calculateKpis(trades);

    expect(kpis.netPnl).toBe(100);
    expect(kpis.grossProfit).toBe(300);
    expect(kpis.grossLoss).toBe(200);
    expect(kpis.totalTrades).toBe(4);
    expect(kpis.winRate).toBe(0.5);
    expect(kpis.profitFactor).toBe(1.5);
    expect(kpis.averageWin).toBe(150);
    expect(kpis.averageLoss).toBe(-100);
    expect(kpis.expectancy).toBe(25);
    expect(kpis.averageR).toBe(0.25);
    expect(kpis.bestTrade?.symbol).toBe('MSFT');
    expect(kpis.worstTrade?.symbol).toBe('TSLA');
  });

  it('calculates max drawdown from the equity curve', () => {
    expect(calculateMaxDrawdown(trades)).toBe(150);
    expect(Math.max(...buildDrawdownCurve(trades).map((point) => point.drawdown))).toBe(150);
  });

  it('builds an equity curve from starting balance', () => {
    const curve = buildEquityCurve(trades, 1000);
    expect(curve.at(-1)?.equity).toBe(1100);
  });

  it('groups performance by an arbitrary trade property', () => {
    const groups = groupPerformance(trades, (item) => item.symbol);
    expect(groups[0].name).toBe('MSFT');
    expect(groups.find((item) => item.name === 'AAPL')?.pnl).toBe(50);
  });

  it('filters trades by date, asset type, strategy, and tag', () => {
    const taggedTrades = trades.map((item, index) => ({
      ...item,
      tags: index < 2 ? ['opening range'] : ['trend']
    }));

    const filtered = filterTrades(taggedTrades, {
      dateStart: '2026-05-02',
      dateEnd: '2026-05-03',
      assetType: 'STOCK',
      strategy: 'Test',
      tag: 'trend'
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.symbol).toBe('MSFT');
  });

  it('builds duration scatter and hour buckets', () => {
    const scatter = buildTradeDurationScatter(trades);
    const hourly = buildHourOfDayPerformance(trades);

    expect(scatter[0]).toMatchObject({ symbol: 'AAPL', durationMinutes: 60, pnl: 100 });
    expect(hourly[13]?.trades).toBe(4);
    expect(hourly[13]?.pnl).toBe(100);
    expect(hourly[13]?.winRate).toBe(0.5);
  });
});

function trade(id: string, symbol: string, netPnl: number, rMultiple: number): TradeRecord {
  return {
    id,
    symbol,
    assetType: 'STOCK',
    side: 'LONG',
    quantity: 1,
    entryPrice: 100,
    exitPrice: 100 + netPnl,
    entryTime: `2026-05-0${tradesIndex(id) + 1}T13:30:00.000Z`,
    exitTime: `2026-05-0${tradesIndex(id) + 1}T14:30:00.000Z`,
    fees: 0,
    grossPnl: netPnl,
    netPnl,
    riskAmount: 100,
    rMultiple,
    strategy: 'Test',
    session: 'Test',
    setup: null,
    mistake: netPnl < 0 ? 'Loss' : null,
    tags: [],
    notes: null
  };
}

function tradesIndex(id: string) {
  return ['one', 'two', 'three', 'four'].indexOf(id);
}
