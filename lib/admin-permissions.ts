import type { Plan } from './types';

export const userRoles = ['USER', 'SUPPORT', 'ANALYST', 'ADMIN', 'SUPER_ADMIN'] as const;
export type UserRole = (typeof userRoles)[number];

export const userStatuses = ['ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING'] as const;
export type UserStatus = (typeof userStatuses)[number];

export const adminRoles = ['SUPPORT', 'ANALYST', 'ADMIN', 'SUPER_ADMIN'] as const;
export type AdminRole = (typeof adminRoles)[number];

export const planValues = ['FREE', 'PRO', 'ELITE'] as const satisfies readonly Plan[];

export type AdminPermission =
  | 'admin.access'
  | 'dashboard.view'
  | 'users.view'
  | 'users.change_status'
  | 'users.change_plan'
  | 'users.change_role'
  | 'users.soft_delete'
  | 'users.restore'
  | 'notes.write'
  | 'notes.manage'
  | 'audit.view'
  | 'imports.view'
  | 'imports.view_errors'
  | 'plans.view'
  | 'settings.view'
  | 'settings.manage';

const rolePermissions: Record<UserRole, AdminPermission[]> = {
  USER: [],
  SUPPORT: [
    'admin.access',
    'dashboard.view',
    'users.view',
    'notes.write',
    'notes.manage',
    'imports.view',
    'imports.view_errors',
    'settings.view'
  ],
  ANALYST: [
    'admin.access',
    'dashboard.view',
    'imports.view',
    'plans.view',
    'settings.view'
  ],
  ADMIN: [
    'admin.access',
    'dashboard.view',
    'users.view',
    'users.change_status',
    'users.change_plan',
    'users.soft_delete',
    'notes.write',
    'notes.manage',
    'audit.view',
    'imports.view',
    'imports.view_errors',
    'plans.view',
    'settings.view'
  ],
  SUPER_ADMIN: [
    'admin.access',
    'dashboard.view',
    'users.view',
    'users.change_status',
    'users.change_plan',
    'users.change_role',
    'users.soft_delete',
    'users.restore',
    'notes.write',
    'notes.manage',
    'audit.view',
    'imports.view',
    'imports.view_errors',
    'plans.view',
    'settings.view',
    'settings.manage'
  ]
};

export function isUserRole(value: string | null | undefined): value is UserRole {
  return userRoles.includes(value as UserRole);
}

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return adminRoles.includes(value as AdminRole);
}

export function isUserStatus(value: string | null | undefined): value is UserStatus {
  return userStatuses.includes(value as UserStatus);
}

export function hasAdminPermission(role: UserRole | string | null | undefined, permission: AdminPermission) {
  if (!isUserRole(role)) return false;
  return rolePermissions[role].includes(permission);
}

export function canAccessAdmin(role: UserRole | string | null | undefined, status: UserStatus | string | null | undefined) {
  return status === 'ACTIVE' && hasAdminPermission(role, 'admin.access');
}

export type AdminPolicyUser = {
  id: string;
  role: UserRole | string | null | undefined;
  status: UserStatus | string | null | undefined;
  deletedAt?: Date | string | null;
};

export function canManageUser(actor: AdminPolicyUser, target: AdminPolicyUser) {
  if (!canAccessAdmin(actor.role, actor.status)) return false;
  if (!isUserRole(target.role) || !isUserStatus(target.status)) return false;
  if (target.status === 'DELETED' || target.deletedAt) return actor.role === 'SUPER_ADMIN';
  if (actor.role === 'SUPER_ADMIN') return true;
  if (actor.role === 'ADMIN') return target.role !== 'ADMIN' && target.role !== 'SUPER_ADMIN';
  return false;
}

export function canChangeUserRole(
  actor: AdminPolicyUser,
  target: AdminPolicyUser,
  nextRole: UserRole,
  activeSuperAdminCount: number
) {
  if (!hasAdminPermission(actor.role, 'users.change_role')) return false;
  if (actor.role !== 'SUPER_ADMIN') return false;
  if (!isUserRole(target.role)) return false;
  if (target.id === actor.id && target.role === 'SUPER_ADMIN' && nextRole !== 'SUPER_ADMIN') return false;
  if (target.role === 'SUPER_ADMIN' && nextRole !== 'SUPER_ADMIN' && activeSuperAdminCount <= 1) return false;
  return true;
}

export function canSuspendUser(actor: AdminPolicyUser, target: AdminPolicyUser, activeSuperAdminCount: number) {
  if (!hasAdminPermission(actor.role, 'users.change_status')) return false;
  if (!canManageUser(actor, target)) return false;
  if (actor.id === target.id) return false;
  if (target.role === 'SUPER_ADMIN' && activeSuperAdminCount <= 1) return false;
  return target.status !== 'DELETED';
}

export function canChangePlan(actor: AdminPolicyUser, target: AdminPolicyUser) {
  if (!hasAdminPermission(actor.role, 'users.change_plan')) return false;
  if (!canManageUser(actor, target)) return false;
  return target.status !== 'DELETED';
}

export function canSoftDeleteUser(actor: AdminPolicyUser, target: AdminPolicyUser, activeSuperAdminCount: number) {
  if (!hasAdminPermission(actor.role, 'users.soft_delete')) return false;
  if (!canManageUser(actor, target)) return false;
  if (actor.id === target.id) return false;
  if (target.role === 'SUPER_ADMIN' && activeSuperAdminCount <= 1) return false;
  return target.status !== 'DELETED';
}

export function canRestoreUser(actor: AdminPolicyUser, target: AdminPolicyUser) {
  return hasAdminPermission(actor.role, 'users.restore') && actor.role === 'SUPER_ADMIN' && target.status === 'DELETED';
}

export function canViewAuditLogs(role: UserRole | string | null | undefined) {
  return hasAdminPermission(role, 'audit.view');
}

export function roleLabel(role: UserRole | string | null | undefined) {
  return isUserRole(role) ? role.replace('_', ' ') : 'USER';
}
