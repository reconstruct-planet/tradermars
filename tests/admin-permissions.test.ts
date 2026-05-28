import { describe, expect, it } from 'vitest';
import {
  canAccessAdmin,
  canChangePlan,
  canChangeUserRole,
  canSoftDeleteUser,
  canSuspendUser,
  hasAdminPermission
} from '../lib/admin-permissions';

describe('admin permissions', () => {
  it('blocks regular users from admin access', () => {
    expect(canAccessAdmin('USER', 'ACTIVE')).toBe(false);
    expect(canAccessAdmin('USER', 'SUSPENDED')).toBe(false);
  });

  it('lets support view users and write notes but not change plans', () => {
    expect(canAccessAdmin('SUPPORT', 'ACTIVE')).toBe(true);
    expect(hasAdminPermission('SUPPORT', 'users.view')).toBe(true);
    expect(hasAdminPermission('SUPPORT', 'notes.write')).toBe(true);
    expect(hasAdminPermission('SUPPORT', 'users.change_plan')).toBe(false);
  });

  it('lets admins change plans but not roles', () => {
    expect(hasAdminPermission('ADMIN', 'users.change_plan')).toBe(true);
    expect(hasAdminPermission('ADMIN', 'users.change_role')).toBe(false);
  });

  it('limits role changes to super admins', () => {
    expect(hasAdminPermission('SUPER_ADMIN', 'users.change_role')).toBe(true);
    expect(hasAdminPermission('SUPER_ADMIN', 'users.restore')).toBe(true);
    expect(hasAdminPermission('ANALYST', 'users.view')).toBe(false);
  });

  it('blocks suspended admin roles from admin access', () => {
    expect(canAccessAdmin('ADMIN', 'SUSPENDED')).toBe(false);
    expect(canAccessAdmin('SUPER_ADMIN', 'DELETED')).toBe(false);
  });

  it('blocks support from changing roles', () => {
    const support = { id: 'support', role: 'SUPPORT', status: 'ACTIVE' };
    const user = { id: 'user', role: 'USER', status: 'ACTIVE' };

    expect(canChangeUserRole(support, user, 'ADMIN', 1)).toBe(false);
  });

  it('blocks admins from creating or changing super admin roles', () => {
    const admin = { id: 'admin', role: 'ADMIN', status: 'ACTIVE' };
    const user = { id: 'user', role: 'USER', status: 'ACTIVE' };

    expect(canChangeUserRole(admin, user, 'SUPER_ADMIN', 1)).toBe(false);
  });

  it('blocks the last super admin from being downgraded, suspended, or deleted', () => {
    const superAdmin = { id: 'super', role: 'SUPER_ADMIN', status: 'ACTIVE' };
    const otherSuperAdmin = { id: 'other', role: 'SUPER_ADMIN', status: 'ACTIVE' };

    expect(canChangeUserRole(superAdmin, superAdmin, 'ADMIN', 1)).toBe(false);
    expect(canSuspendUser(superAdmin, otherSuperAdmin, 1)).toBe(false);
    expect(canSoftDeleteUser(superAdmin, otherSuperAdmin, 1)).toBe(false);
  });

  it('allows admins to change plans for ordinary active users only', () => {
    const admin = { id: 'admin', role: 'ADMIN', status: 'ACTIVE' };
    const user = { id: 'user', role: 'USER', status: 'ACTIVE' };
    const superAdmin = { id: 'super', role: 'SUPER_ADMIN', status: 'ACTIVE' };

    expect(canChangePlan(admin, user)).toBe(true);
    expect(canChangePlan(admin, superAdmin)).toBe(false);
  });
});
