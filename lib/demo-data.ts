import type {
  ChecklistTemplateRecord,
  DailyPlanRecord,
  GoalRecord,
  NoteRecord,
  TagRecord,
  TradeRecord,
  TradingData
} from './types';

const baseDate = new Date('2026-05-27T16:00:00.000Z');

function isoDaysAgo(daysAgo: number, hour: number, minute = 30) {
  const date = new Date(baseDate);
  date.setUTCDate(baseDate.getUTCDate() - daysAgo);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const tradeSeeds: Array<Omit<TradeRecord, 'id' | 'entryTime' | 'exitTime'> & {
  daysAgo: number;
  entryHour: number;
  exitHour: number;
}> = [
  { daysAgo: 1, entryHour: 13, exitHour: 15, symbol: 'AAPL', assetType: 'STOCK', side: 'LONG', quantity: 120, entryPrice: 187.1, exitPrice: 190.3, fees: 4.8, grossPnl: 384, netPnl: 379.2, riskAmount: 220, rMultiple: 1.72, strategy: 'Opening range', session: 'New York AM', setup: 'Range break', mistake: null, tags: ['disciplined', 'A+ setup'], notes: 'Waited for first pullback and scaled at target.' },
  { daysAgo: 2, entryHour: 14, exitHour: 16, symbol: 'NVDA', assetType: 'STOCK', side: 'SHORT', quantity: 40, entryPrice: 965.2, exitPrice: 953.6, fees: 6.4, grossPnl: 464, netPnl: 457.6, riskAmount: 300, rMultiple: 1.53, strategy: 'VWAP fade', session: 'New York AM', setup: 'Extension fade', mistake: null, tags: ['patience', 'VWAP'], notes: 'Good location after exhaustion wick.' },
  { daysAgo: 3, entryHour: 19, exitHour: 20, symbol: 'ES', assetType: 'FUTURE', side: 'LONG', quantity: 2, entryPrice: 5288.25, exitPrice: 5294, fees: 9.2, grossPnl: 575, netPnl: 565.8, riskAmount: 420, rMultiple: 1.35, strategy: 'Trend continuation', session: 'New York PM', setup: 'Higher low', mistake: null, tags: ['trend day'], notes: 'Followed plan after lunch consolidation.' },
  { daysAgo: 4, entryHour: 13, exitHour: 14, symbol: 'TSLA', assetType: 'STOCK', side: 'LONG', quantity: 90, entryPrice: 174.5, exitPrice: 171.9, fees: 5.2, grossPnl: -234, netPnl: -239.2, riskAmount: 260, rMultiple: -0.92, strategy: 'Breakout', session: 'New York AM', setup: 'News momentum', mistake: 'Chased entry', tags: ['chase', 'news'], notes: 'Entered before retest. Should have passed.' },
  { daysAgo: 5, entryHour: 15, exitHour: 17, symbol: 'MSFT', assetType: 'STOCK', side: 'LONG', quantity: 70, entryPrice: 428.4, exitPrice: 431.7, fees: 4.1, grossPnl: 231, netPnl: 226.9, riskAmount: 180, rMultiple: 1.26, strategy: 'Pullback', session: 'New York AM', setup: 'Moving average reclaim', mistake: null, tags: ['A+ setup'], notes: 'Clean reclaim with market support.' },
  { daysAgo: 6, entryHour: 13, exitHour: 15, symbol: 'META', assetType: 'STOCK', side: 'SHORT', quantity: 55, entryPrice: 476.1, exitPrice: 480.4, fees: 4.6, grossPnl: -236.5, netPnl: -241.1, riskAmount: 230, rMultiple: -1.05, strategy: 'VWAP fade', session: 'New York AM', setup: 'Failed breakout', mistake: 'Ignored market trend', tags: ['impulse', 'VWAP'], notes: 'Market breadth was too strong for the short.' },
  { daysAgo: 7, entryHour: 18, exitHour: 19, symbol: 'NQ', assetType: 'FUTURE', side: 'LONG', quantity: 1, entryPrice: 18712.25, exitPrice: 18744.75, fees: 4.8, grossPnl: 650, netPnl: 645.2, riskAmount: 500, rMultiple: 1.29, strategy: 'Trend continuation', session: 'New York PM', setup: 'Bull flag', mistake: null, tags: ['trend day', 'patience'], notes: 'Held through a shallow retest.' },
  { daysAgo: 8, entryHour: 14, exitHour: 15, symbol: 'AMD', assetType: 'STOCK', side: 'LONG', quantity: 150, entryPrice: 161.2, exitPrice: 159.8, fees: 5.3, grossPnl: -210, netPnl: -215.3, riskAmount: 210, rMultiple: -1.03, strategy: 'Opening range', session: 'New York AM', setup: 'Range break', mistake: 'Late entry', tags: ['chase'], notes: 'Breakout failed quickly. Exit was correct.' },
  { daysAgo: 9, entryHour: 13, exitHour: 16, symbol: 'SPY', assetType: 'OPTION', side: 'LONG', quantity: 6, entryPrice: 4.2, exitPrice: 5.35, fees: 7.2, grossPnl: 690, netPnl: 682.8, riskAmount: 420, rMultiple: 1.63, strategy: 'Gap continuation', session: 'New York AM', setup: 'Relative strength', mistake: null, tags: ['A+ setup', 'disciplined'], notes: 'Scaled out at 1R and 1.8R.' },
  { daysAgo: 10, entryHour: 13, exitHour: 14, symbol: 'QQQ', assetType: 'OPTION', side: 'LONG', quantity: 8, entryPrice: 3.1, exitPrice: 2.52, fees: 8.1, grossPnl: -464, netPnl: -472.1, riskAmount: 450, rMultiple: -1.05, strategy: 'Gap continuation', session: 'New York AM', setup: 'Continuation', mistake: 'Oversized', tags: ['oversized', 'news'], notes: 'Size was too high for event volatility.' },
  { daysAgo: 11, entryHour: 15, exitHour: 17, symbol: 'EURUSD', assetType: 'FOREX', side: 'SHORT', quantity: 100000, entryPrice: 1.0872, exitPrice: 1.0849, fees: 12, grossPnl: 230, netPnl: 218, riskAmount: 180, rMultiple: 1.21, strategy: 'Macro level', session: 'London overlap', setup: 'Liquidity sweep', mistake: null, tags: ['liquidity sweep'], notes: 'Good rejection from prior week level.' },
  { daysAgo: 12, entryHour: 20, exitHour: 21, symbol: 'BTCUSD', assetType: 'CRYPTO', side: 'LONG', quantity: 0.45, entryPrice: 68120, exitPrice: 68910, fees: 18.5, grossPnl: 355.5, netPnl: 337, riskAmount: 240, rMultiple: 1.4, strategy: 'Breakout', session: 'Asia', setup: 'Range expansion', mistake: null, tags: ['breakout'], notes: 'Tight stop under consolidation.' },
  { daysAgo: 13, entryHour: 16, exitHour: 17, symbol: 'AMZN', assetType: 'STOCK', side: 'LONG', quantity: 110, entryPrice: 182.4, exitPrice: 181.55, fees: 4.7, grossPnl: -93.5, netPnl: -98.2, riskAmount: 200, rMultiple: -0.49, strategy: 'Pullback', session: 'New York AM', setup: 'MA reclaim', mistake: 'Weak confirmation', tags: ['small loss'], notes: 'Cut early when market lost support.' },
  { daysAgo: 14, entryHour: 13, exitHour: 15, symbol: 'GOOGL', assetType: 'STOCK', side: 'LONG', quantity: 130, entryPrice: 168.8, exitPrice: 171.15, fees: 4.9, grossPnl: 305.5, netPnl: 300.6, riskAmount: 250, rMultiple: 1.2, strategy: 'Opening range', session: 'New York AM', setup: 'Range reclaim', mistake: null, tags: ['disciplined'], notes: 'Entry after confirmation candle.' },
  { daysAgo: 15, entryHour: 18, exitHour: 19, symbol: 'ES', assetType: 'FUTURE', side: 'SHORT', quantity: 2, entryPrice: 5301.5, exitPrice: 5308.25, fees: 9.2, grossPnl: -675, netPnl: -684.2, riskAmount: 520, rMultiple: -1.32, strategy: 'Reversal', session: 'New York PM', setup: 'Failed high', mistake: 'Fought trend', tags: ['impulse', 'max loss warning'], notes: 'Stopped after this trade, good damage control.' },
  { daysAgo: 16, entryHour: 13, exitHour: 15, symbol: 'NVDA', assetType: 'STOCK', side: 'LONG', quantity: 35, entryPrice: 918.5, exitPrice: 934.2, fees: 5.8, grossPnl: 549.5, netPnl: 543.7, riskAmount: 360, rMultiple: 1.51, strategy: 'Opening range', session: 'New York AM', setup: 'High tight flag', mistake: null, tags: ['A+ setup', 'breakout'], notes: 'Best setup of the week.' },
  { daysAgo: 17, entryHour: 14, exitHour: 16, symbol: 'AAPL', assetType: 'STOCK', side: 'SHORT', quantity: 140, entryPrice: 189.6, exitPrice: 188.3, fees: 5.1, grossPnl: 182, netPnl: 176.9, riskAmount: 210, rMultiple: 0.84, strategy: 'VWAP fade', session: 'New York AM', setup: 'Lower high', mistake: null, tags: ['VWAP'], notes: 'Partial target reached, remainder scratched.' },
  { daysAgo: 18, entryHour: 13, exitHour: 13, symbol: 'TSLA', assetType: 'STOCK', side: 'SHORT', quantity: 100, entryPrice: 177.8, exitPrice: 180.1, fees: 5.1, grossPnl: -230, netPnl: -235.1, riskAmount: 220, rMultiple: -1.07, strategy: 'Reversal', session: 'New York AM', setup: 'Failed push', mistake: 'No confirmation', tags: ['impulse'], notes: 'Premature short into momentum.' },
  { daysAgo: 19, entryHour: 20, exitHour: 22, symbol: 'BTCUSD', assetType: 'CRYPTO', side: 'SHORT', quantity: 0.35, entryPrice: 69350, exitPrice: 68580, fees: 16, grossPnl: 269.5, netPnl: 253.5, riskAmount: 190, rMultiple: 1.33, strategy: 'Macro level', session: 'Asia', setup: 'Failed breakout', mistake: null, tags: ['liquidity sweep'], notes: 'Clean rejection after liquidation wick.' },
  { daysAgo: 20, entryHour: 15, exitHour: 17, symbol: 'MSFT', assetType: 'STOCK', side: 'SHORT', quantity: 75, entryPrice: 421.9, exitPrice: 419.6, fees: 4.4, grossPnl: 172.5, netPnl: 168.1, riskAmount: 170, rMultiple: 0.99, strategy: 'VWAP fade', session: 'New York AM', setup: 'Mean reversion', mistake: null, tags: ['VWAP', 'disciplined'], notes: 'Managed risk well into support.' }
];

export const demoTrades: TradeRecord[] = tradeSeeds.map((seed, index) => ({
  ...seed,
  id: `demo-trade-${index + 1}`,
  entryTime: isoDaysAgo(seed.daysAgo, seed.entryHour),
  exitTime: isoDaysAgo(seed.daysAgo, seed.exitHour),
})).map(({ daysAgo, entryHour, exitHour, ...trade }) => trade);

export const demoTags: TagRecord[] = [
  { id: 'tag-1', name: 'A+ setup', color: '#0f766e', category: 'quality' },
  { id: 'tag-2', name: 'disciplined', color: '#2563eb', category: 'process' },
  { id: 'tag-3', name: 'VWAP', color: '#7c3aed', category: 'setup' },
  { id: 'tag-4', name: 'chase', color: '#dc2626', category: 'mistake' },
  { id: 'tag-5', name: 'oversized', color: '#ea580c', category: 'risk' },
  { id: 'tag-6', name: 'liquidity sweep', color: '#0891b2', category: 'setup' },
  { id: 'tag-7', name: 'trend day', color: '#16a34a', category: 'market' },
  { id: 'tag-8', name: 'impulse', color: '#b91c1c', category: 'mistake' }
];

export const demoNotes: NoteRecord[] = [
  {
    id: 'note-1',
    scope: 'DAY',
    title: 'Stay selective after strong open',
    content: 'Best trades came after waiting for the second push. Avoid taking reversals before breadth turns.',
    mood: 'focused',
    day: isoDaysAgo(1, 0, 0),
    tradeId: null,
    tagName: 'disciplined',
    createdAt: isoDaysAgo(1, 22, 0)
  },
  {
    id: 'note-2',
    scope: 'GENERAL',
    title: 'Review position sizing on options',
    content: 'Options losses were acceptable except the QQQ continuation trade. Add a contract cap for event days.',
    mood: 'analytical',
    day: null,
    tradeId: null,
    tagName: 'oversized',
    createdAt: isoDaysAgo(4, 21, 0)
  },
  {
    id: 'note-3',
    scope: 'TRADE',
    title: 'NVDA fade worked because location was clean',
    content: 'Short entry came after a third failed high and VWAP distance was stretched. This is the model.',
    mood: 'confident',
    day: null,
    tradeId: 'demo-trade-2',
    tagName: 'VWAP',
    createdAt: isoDaysAgo(2, 22, 0)
  }
];

export const demoGoals: GoalRecord[] = [
  {
    id: 'goal-1',
    type: 'MONTHLY_PNL',
    name: 'Monthly net P&L',
    targetValue: 5000,
    currentValue: 2508,
    periodStart: '2026-05-01T00:00:00.000Z',
    periodEnd: '2026-05-31T23:59:59.000Z',
    isActive: true
  },
  {
    id: 'goal-2',
    type: 'MAX_DRAWDOWN',
    name: 'Keep drawdown under',
    targetValue: 1600,
    currentValue: 1017,
    periodStart: '2026-05-01T00:00:00.000Z',
    periodEnd: '2026-05-31T23:59:59.000Z',
    isActive: true
  },
  {
    id: 'goal-3',
    type: 'MIN_WIN_RATE',
    name: 'Minimum win rate',
    targetValue: 55,
    currentValue: 60,
    periodStart: '2026-05-01T00:00:00.000Z',
    periodEnd: '2026-05-31T23:59:59.000Z',
    isActive: true
  },
  {
    id: 'goal-4',
    type: 'DAILY_MAX_LOSS',
    name: 'Daily max loss',
    targetValue: 800,
    currentValue: 684,
    periodStart: '2026-05-01T00:00:00.000Z',
    periodEnd: '2026-05-31T23:59:59.000Z',
    isActive: true
  }
];

export const demoChecklistTemplates: ChecklistTemplateRecord[] = [
  {
    id: 'template-1',
    name: 'Intraday execution plan',
    items: [
      { id: 'item-1', label: 'News and macro calendar reviewed', isRequired: true, sortOrder: 1 },
      { id: 'item-2', label: 'Key levels marked before open', isRequired: true, sortOrder: 2 },
      { id: 'item-3', label: 'Maximum daily loss entered', isRequired: true, sortOrder: 3 },
      { id: 'item-4', label: 'First trade waited for confirmation', isRequired: false, sortOrder: 4 }
    ]
  }
];

export const demoDailyPlans: DailyPlanRecord[] = [
  {
    id: 'plan-1',
    day: isoDaysAgo(1, 0, 0),
    bias: 'Moderately bullish above prior day high. Avoid fading strength until breadth weakens.',
    maxLoss: 800,
    notes: 'Primary focus is opening range and clean pullbacks in large cap tech.',
    checklistState: {
      'item-1': true,
      'item-2': true,
      'item-3': true,
      'item-4': true
    }
  },
  {
    id: 'plan-2',
    day: isoDaysAgo(4, 0, 0),
    bias: 'Event day. Reduce option size and require retest before entries.',
    maxLoss: 650,
    notes: 'TSLA and QQQ are in play, but only after volatility settles.',
    checklistState: {
      'item-1': true,
      'item-2': true,
      'item-3': true,
      'item-4': false
    }
  }
];

export const demoTradingData: TradingData = {
  user: {
    name: 'Demo Trader',
    email: 'demo@tradeharbor.app',
    timezone: 'America/New_York',
    plan: 'PRO'
  },
  account: {
    id: 'demo-account',
    name: 'Primary margin account',
    broker: 'Demo Broker',
    baseCurrency: 'USD',
    startingBalance: 50000
  },
  trades: demoTrades,
  tags: demoTags.map((tag) => ({
    ...tag,
    tradeCount: demoTrades.filter((trade) => trade.tags.includes(tag.name)).length
  })),
  notes: demoNotes,
  goals: demoGoals,
  dailyPlans: demoDailyPlans,
  checklistTemplates: demoChecklistTemplates,
  isDemoFallback: true
};
