import type { Plan } from './types';

export type FeatureKey =
  | 'manual_trades'
  | 'basic_dashboard'
  | 'basic_analytics'
  | 'limited_imports'
  | 'multiple_accounts'
  | 'unlimited_imports'
  | 'advanced_analytics'
  | 'csv_import'
  | 'goals'
  | 'calendar'
  | 'ai_insights'
  | 'advanced_dashboards'
  | 'risk_simulator'
  | 'priority_features';

export type PlanDefinition = {
  id: Plan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  accountLimit: number | 'unlimited';
  importLimit: number | 'unlimited';
  features: FeatureKey[];
};

export const planOrder: Plan[] = ['FREE', 'PRO', 'ELITE'];

export const planDefinitions: Record<Plan, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Start with manual journaling and a focused dashboard.',
    accountLimit: 1,
    importLimit: 3,
    features: ['manual_trades', 'basic_dashboard', 'basic_analytics', 'limited_imports']
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    monthlyPrice: 24,
    yearlyPrice: 19,
    description: 'For active traders importing sessions and reviewing performance.',
    accountLimit: 'unlimited',
    importLimit: 'unlimited',
    features: [
      'manual_trades',
      'basic_dashboard',
      'basic_analytics',
      'limited_imports',
      'multiple_accounts',
      'unlimited_imports',
      'advanced_analytics',
      'csv_import',
      'goals',
      'calendar'
    ]
  },
  ELITE: {
    id: 'ELITE',
    name: 'Elite',
    monthlyPrice: 59,
    yearlyPrice: 49,
    description: 'For advanced review workflows, AI insights, and risk tools.',
    accountLimit: 'unlimited',
    importLimit: 'unlimited',
    features: [
      'manual_trades',
      'basic_dashboard',
      'basic_analytics',
      'limited_imports',
      'multiple_accounts',
      'unlimited_imports',
      'advanced_analytics',
      'csv_import',
      'goals',
      'calendar',
      'ai_insights',
      'advanced_dashboards',
      'risk_simulator',
      'priority_features'
    ]
  }
};

export const featureLabels: Record<FeatureKey, string> = {
  manual_trades: 'Manual trades',
  basic_dashboard: 'Basic dashboard',
  basic_analytics: 'Basic analytics',
  limited_imports: 'Limited imports',
  multiple_accounts: 'Multiple accounts',
  unlimited_imports: 'Unlimited imports',
  advanced_analytics: 'Advanced analytics',
  csv_import: 'CSV import',
  goals: 'Goals',
  calendar: 'Calendar',
  ai_insights: 'AI insights',
  advanced_dashboards: 'Advanced dashboards',
  risk_simulator: 'Risk simulator',
  priority_features: 'Priority features'
};

export function normalizePlan(plan: Plan | string | null | undefined): Plan {
  return plan === 'PRO' || plan === 'ELITE' ? plan : 'FREE';
}

export function hasFeature(plan: Plan | string | null | undefined, feature: FeatureKey) {
  return planDefinitions[normalizePlan(plan)].features.includes(feature);
}

export function requiredPlanForFeature(feature: FeatureKey): Plan {
  return planOrder.find((plan) => planDefinitions[plan].features.includes(feature)) ?? 'ELITE';
}

export function canUseAccount(plan: Plan | string | null | undefined, accountCount: number) {
  const limit = planDefinitions[normalizePlan(plan)].accountLimit;
  return limit === 'unlimited' || accountCount < limit;
}

export function canImportThisMonth(plan: Plan | string | null | undefined, importCount: number) {
  const limit = planDefinitions[normalizePlan(plan)].importLimit;
  return limit === 'unlimited' || importCount < limit;
}

export function getPlanPrice(plan: Plan, billingInterval: 'monthly' | 'yearly') {
  return billingInterval === 'monthly' ? planDefinitions[plan].monthlyPrice : planDefinitions[plan].yearlyPrice;
}

// Stripe adapter placeholder:
// Later, map plan ids to Stripe price ids and keep this feature gate as the
// server-side source of truth after webhook events update User.plan.
export const stripePlanPlaceholders: Record<Plan, { monthlyPriceId: string; yearlyPriceId: string }> = {
  FREE: { monthlyPriceId: 'manual-free-plan', yearlyPriceId: 'manual-free-plan' },
  PRO: { monthlyPriceId: 'stripe_price_pro_monthly_todo', yearlyPriceId: 'stripe_price_pro_yearly_todo' },
  ELITE: { monthlyPriceId: 'stripe_price_elite_monthly_todo', yearlyPriceId: 'stripe_price_elite_yearly_todo' }
};
