import { describe, expect, it } from 'vitest';
import {
  canImportThisMonth,
  canUseAccount,
  hasFeature,
  normalizePlan,
  requiredPlanForFeature
} from '../lib/plans';

describe('feature gates', () => {
  it('normalizes unknown plans to free', () => {
    expect(normalizePlan(undefined)).toBe('FREE');
    expect(normalizePlan('TEAM')).toBe('FREE');
    expect(normalizePlan('ELITE')).toBe('ELITE');
  });

  it('allows free core journaling but blocks premium workflows', () => {
    expect(hasFeature('FREE', 'manual_trades')).toBe(true);
    expect(hasFeature('FREE', 'basic_dashboard')).toBe(true);
    expect(hasFeature('FREE', 'advanced_analytics')).toBe(false);
    expect(hasFeature('FREE', 'ai_insights')).toBe(false);
  });

  it('allows pro analytics, imports, goals, and calendar', () => {
    expect(hasFeature('PRO', 'csv_import')).toBe(true);
    expect(hasFeature('PRO', 'advanced_analytics')).toBe(true);
    expect(hasFeature('PRO', 'goals')).toBe(true);
    expect(hasFeature('PRO', 'calendar')).toBe(true);
    expect(hasFeature('PRO', 'ai_insights')).toBe(false);
  });

  it('reserves AI insights, advanced dashboards, and risk simulator for elite', () => {
    expect(hasFeature('ELITE', 'ai_insights')).toBe(true);
    expect(hasFeature('ELITE', 'advanced_dashboards')).toBe(true);
    expect(hasFeature('ELITE', 'risk_simulator')).toBe(true);
  });

  it('finds the minimum plan needed for a feature', () => {
    expect(requiredPlanForFeature('manual_trades')).toBe('FREE');
    expect(requiredPlanForFeature('csv_import')).toBe('PRO');
    expect(requiredPlanForFeature('risk_simulator')).toBe('ELITE');
  });

  it('enforces free account and import limits', () => {
    expect(canUseAccount('FREE', 0)).toBe(true);
    expect(canUseAccount('FREE', 1)).toBe(false);
    expect(canUseAccount('PRO', 12)).toBe(true);
    expect(canImportThisMonth('FREE', 2)).toBe(true);
    expect(canImportThisMonth('FREE', 3)).toBe(false);
    expect(canImportThisMonth('ELITE', 100)).toBe(true);
  });
});
