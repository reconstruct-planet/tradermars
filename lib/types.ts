export type AssetType = 'STOCK' | 'OPTION' | 'FUTURE' | 'FOREX' | 'CRYPTO';
export type TradeSide = 'LONG' | 'SHORT';
export type Plan = 'FREE' | 'PRO' | 'ELITE';

export type TradeRecord = {
  id: string;
  symbol: string;
  assetType: AssetType;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  fees: number;
  grossPnl: number;
  netPnl: number;
  riskAmount: number | null;
  rMultiple: number;
  strategy: string | null;
  session: string | null;
  setup: string | null;
  mistake: string | null;
  tags: string[];
  notes: string | null;
};

export type TagRecord = {
  id: string;
  name: string;
  color: string;
  category: string;
  tradeCount?: number;
};

export type NoteRecord = {
  id: string;
  scope: 'GENERAL' | 'TRADE' | 'DAY';
  title: string;
  content: string;
  mood: string | null;
  day: string | null;
  tradeId: string | null;
  tagName?: string | null;
  createdAt: string;
};

export type GoalRecord = {
  id: string;
  type: 'MONTHLY_PNL' | 'MAX_DRAWDOWN' | 'MIN_WIN_RATE' | 'DAILY_MAX_LOSS';
  name: string;
  targetValue: number;
  currentValue: number;
  periodStart: string;
  periodEnd: string;
  isActive: boolean;
};

export type ChecklistTemplateRecord = {
  id: string;
  name: string;
  items: Array<{ id: string; label: string; isRequired: boolean; sortOrder: number }>;
};

export type DailyPlanRecord = {
  id: string;
  day: string;
  bias: string | null;
  maxLoss: number | null;
  notes: string | null;
  checklistState: Record<string, boolean> | null;
};

export type TradingData = {
  user: {
    name: string;
    email: string;
    timezone: string;
    plan: Plan;
  };
  account: {
    id: string;
    name: string;
    broker: string | null;
    baseCurrency: string;
    startingBalance: number;
  };
  trades: TradeRecord[];
  tags: TagRecord[];
  notes: NoteRecord[];
  goals: GoalRecord[];
  dailyPlans: DailyPlanRecord[];
  checklistTemplates: ChecklistTemplateRecord[];
  isDemoFallback: boolean;
};

export type AppShellData = Pick<TradingData, 'user' | 'account' | 'isDemoFallback'>;
