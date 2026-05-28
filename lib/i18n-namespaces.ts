import type { MessageNamespace } from './i18n-messages';

export const shellNamespaces = ['common', 'nav', 'gates', 'features'] as const satisfies readonly MessageNamespace[];
export const authNamespaces = ['common', 'auth'] as const satisfies readonly MessageNamespace[];
export const pricingNamespaces = ['common', 'pricing', 'features'] as const satisfies readonly MessageNamespace[];
export const landingNamespaces = [
  'common',
  'nav',
  'landing',
  'pricing',
  'dashboard',
  'trades',
  'analytics',
  'calendar',
  'insights',
  'features',
  'importCenter',
  'workspaces'
] as const satisfies readonly MessageNamespace[];
export const dashboardNamespaces = ['common', 'nav', 'dashboard', 'trades', 'calendar'] as const satisfies readonly MessageNamespace[];
export const tradesNamespaces = ['common', 'nav', 'trades', 'calendar'] as const satisfies readonly MessageNamespace[];
export const analyticsNamespaces = ['common', 'dashboard', 'analytics'] as const satisfies readonly MessageNamespace[];
export const calendarNamespaces = ['common', 'calendar', 'trades'] as const satisfies readonly MessageNamespace[];
export const importNamespaces = ['common', 'importCenter'] as const satisfies readonly MessageNamespace[];
export const insightsNamespaces = ['common', 'insights'] as const satisfies readonly MessageNamespace[];
export const workspaceNamespaces = ['common', 'workspaces', 'settings'] as const satisfies readonly MessageNamespace[];
