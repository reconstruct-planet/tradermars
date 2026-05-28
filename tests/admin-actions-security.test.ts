import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const actionsSource = readFileSync('app/admin/actions.ts', 'utf8');

describe('admin action safety rails', () => {
  it('soft delete action does not physically delete users', () => {
    expect(actionsSource).not.toContain('prisma.user.delete(');
    expect(actionsSource).not.toContain('prisma.user.deleteMany(');
    expect(actionsSource).toContain("status: 'DELETED'");
    expect(actionsSource).toContain('deletedAt: new Date()');
  });

  it('sensitive user actions write audit logs', () => {
    for (const action of [
      'USER_SUSPENDED',
      'USER_PLAN_CHANGED',
      'USER_ROLE_CHANGED',
      'USER_SOFT_DELETED',
      'USER_RESTORED'
    ]) {
      expect(actionsSource).toContain(action);
    }
  });

  it('sensitive actions use rate limit guardrails', () => {
    expect(actionsSource).toContain('enforceAdminRateLimit');
  });
});
