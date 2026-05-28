'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAuditEvent, makeAuditMetadata } from '@/lib/admin-audit';
import { enforceAdminRateLimit } from '@/lib/admin-rate-limit';
import {
  canChangePlan,
  canChangeUserRole,
  canManageUser,
  canRestoreUser,
  canSoftDeleteUser,
  canSuspendUser,
  hasAdminPermission,
  planValues,
  userRoles,
  type AdminPolicyUser,
  type UserRole
} from '@/lib/admin-permissions';
import { requireAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import type { Plan } from '@/lib/types';

export async function suspendUserAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('users.change_status', 'USER_SUSPENDED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'USER_SUSPENDED' });
  const userId = getRequiredFormString(formData, 'userId');
  const reason = getRequiredFormString(formData, 'reason').slice(0, 500);
  const returnTo = getReturnTo(formData, `/admin/users/${userId}`);
  const before = await getTargetUser(userId);
  const activeSuperAdminCount = await countActiveSuperAdmins();
  if (!canSuspendUser(admin, before, activeSuperAdminCount)) {
    await denyAdminAction(admin, before, 'USER_SUSPEND_DENIED', 'User', userId, {
      previousValue: publicUserState(before),
      newValue: { status: 'SUSPENDED' },
      requestMeta
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      suspendedReason: reason
    }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: userId,
      metadata: makeAuditMetadata({
        previousValue: publicUserState(before),
        newValue: { status: 'SUSPENDED' },
        extra: { reasonLength: reason.length }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  redirect(returnTo);
}

export async function unsuspendUserAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('users.change_status', 'USER_UNSUSPENDED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'USER_UNSUSPENDED' });
  const userId = getRequiredFormString(formData, 'userId');
  const returnTo = getReturnTo(formData, `/admin/users/${userId}`);
  const before = await getTargetUser(userId);
  const activeSuperAdminCount = await countActiveSuperAdmins();
  if (!canSuspendUser(admin, before, activeSuperAdminCount)) {
    await denyAdminAction(admin, before, 'USER_UNSUSPEND_DENIED', 'User', userId, {
      previousValue: publicUserState(before),
      newValue: { status: 'ACTIVE' },
      requestMeta
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      suspendedAt: null,
      suspendedReason: null
    }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'USER_UNSUSPENDED',
      entityType: 'User',
      entityId: userId,
      metadata: makeAuditMetadata({
        previousValue: publicUserState(before),
        newValue: { status: 'ACTIVE' }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  redirect(returnTo);
}

export async function changeUserPlanAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('users.change_plan', 'USER_PLAN_CHANGED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'USER_PLAN_CHANGED' });
  const userId = getRequiredFormString(formData, 'userId');
  const plan = getRequiredFormString(formData, 'plan') as Plan;
  const returnTo = getReturnTo(formData, `/admin/users/${userId}`);
  if (!planValues.includes(plan)) throw new Error('Unsupported plan.');

  const before = await getTargetUser(userId);
  if (!canChangePlan(admin, before)) {
    await denyAdminAction(admin, before, 'USER_PLAN_CHANGE_DENIED', 'User', userId, {
      previousValue: publicUserState(before),
      newValue: { plan },
      requestMeta
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: plan === 'FREE' ? null : 'manual_admin_override'
    }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'USER_PLAN_CHANGED',
      entityType: 'User',
      entityId: userId,
      metadata: makeAuditMetadata({
        previousValue: { plan: before.plan },
        newValue: { plan }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  redirect(returnTo);
}

export async function changeUserRoleAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('users.change_role', 'USER_ROLE_CHANGED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'USER_ROLE_CHANGED', limit: 10 });
  const userId = getRequiredFormString(formData, 'userId');
  const role = getRequiredFormString(formData, 'role') as UserRole;
  const returnTo = getReturnTo(formData, `/admin/users/${userId}`);
  if (!userRoles.includes(role)) throw new Error('Unsupported role.');

  const before = await getTargetUser(userId);
  const activeSuperAdminCount = await countActiveSuperAdmins();
  if (!canChangeUserRole(admin, before, role, activeSuperAdminCount)) {
    await denyAdminAction(admin, before, 'USER_ROLE_CHANGE_DENIED', 'User', userId, {
      previousValue: publicUserState(before),
      newValue: { role },
      requestMeta
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: userId,
      metadata: makeAuditMetadata({
        previousValue: { role: before.role },
        newValue: { role }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  redirect(returnTo);
}

export async function softDeleteUserAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('users.soft_delete', 'USER_SOFT_DELETED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'USER_SOFT_DELETED', limit: 10 });
  const userId = getRequiredFormString(formData, 'userId');
  const returnTo = getReturnTo(formData, '/admin/users?status=DELETED');
  const before = await getTargetUser(userId);
  const activeSuperAdminCount = await countActiveSuperAdmins();
  if (!canSoftDeleteUser(admin, before, activeSuperAdminCount)) {
    await denyAdminAction(admin, before, 'USER_SOFT_DELETE_DENIED', 'User', userId, {
      previousValue: publicUserState(before),
      newValue: { status: 'DELETED' },
      requestMeta
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'DELETED',
      deletedAt: new Date()
    }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'USER_SOFT_DELETED',
      entityType: 'User',
      entityId: userId,
      metadata: makeAuditMetadata({
        previousValue: publicUserState(before),
        newValue: { status: 'DELETED' },
        extra: { deletionMode: 'soft' }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  redirect(returnTo);
}

export async function restoreUserAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('users.restore', 'USER_RESTORED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'USER_RESTORED', limit: 10 });
  const userId = getRequiredFormString(formData, 'userId');
  const returnTo = getReturnTo(formData, `/admin/users/${userId}`);
  const before = await getTargetUser(userId);
  if (!canRestoreUser(admin, before)) {
    await denyAdminAction(admin, before, 'USER_RESTORE_DENIED', 'User', userId, {
      previousValue: publicUserState(before),
      newValue: { status: 'ACTIVE' },
      requestMeta
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      deletedAt: null,
      suspendedAt: null,
      suspendedReason: null
    }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'USER_RESTORED',
      entityType: 'User',
      entityId: userId,
      metadata: makeAuditMetadata({
        previousValue: publicUserState(before),
        newValue: { status: 'ACTIVE' }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  redirect(returnTo);
}

export async function addAdminNoteAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('notes.write', 'ADMIN_NOTE_CREATED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'ADMIN_NOTE_CREATED', limit: 40 });
  const userId = getRequiredFormString(formData, 'userId');
  const note = getRequiredFormString(formData, 'note').slice(0, 4000);
  const returnTo = getReturnTo(formData, `/admin/users/${userId}`);
  const target = await getTargetUser(userId);
  if (!canWriteAdminNote(admin, target)) {
    await denyAdminAction(admin, target, 'ADMIN_NOTE_CREATE_DENIED', 'AdminNote', null, {
      previousValue: null,
      newValue: { noteLength: note.length },
      requestMeta
    });
  }

  const created = await prisma.adminNote.create({
    data: {
      userId,
      authorId: admin.id,
      note,
      visibility: 'INTERNAL'
    }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: userId,
      action: 'ADMIN_NOTE_CREATED',
      entityType: 'AdminNote',
      entityId: created.id,
      metadata: makeAuditMetadata({
        previousValue: null,
        newValue: { noteLength: note.length, visibility: 'INTERNAL' }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(userId);
  revalidatePath('/admin/support');
  redirect(returnTo);
}

export async function updateAdminNoteAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('notes.manage', 'ADMIN_NOTE_UPDATED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'ADMIN_NOTE_UPDATED', limit: 40 });
  const noteId = getRequiredFormString(formData, 'noteId');
  const note = getRequiredFormString(formData, 'note').slice(0, 4000);
  const returnTo = getReturnTo(formData, '/admin/support');
  const before = await prisma.adminNote.findUniqueOrThrow({
    where: { id: noteId },
    select: { userId: true, note: true, user: { select: userPolicySelect } }
  });
  if (!canWriteAdminNote(admin, before.user)) {
    await denyAdminAction(admin, before.user, 'ADMIN_NOTE_UPDATE_DENIED', 'AdminNote', noteId, {
      previousValue: { noteLength: before.note.length },
      newValue: { noteLength: note.length },
      requestMeta
    });
  }

  await prisma.adminNote.update({
    where: { id: noteId },
    data: { note }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: before.userId,
      action: 'ADMIN_NOTE_UPDATED',
      entityType: 'AdminNote',
      entityId: noteId,
      metadata: makeAuditMetadata({
        previousValue: { noteLength: before.note.length },
        newValue: { noteLength: note.length }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(before.userId);
  revalidatePath('/admin/support');
  redirect(returnTo);
}

export async function deleteAdminNoteAction(formData: FormData) {
  const { admin, requestMeta } = await requireAdminAction('notes.manage', 'ADMIN_NOTE_DELETED');
  enforceAdminRateLimit({ actorUserId: admin.id, action: 'ADMIN_NOTE_DELETED', limit: 40 });
  const noteId = getRequiredFormString(formData, 'noteId');
  const returnTo = getReturnTo(formData, '/admin/support');
  const before = await prisma.adminNote.findUniqueOrThrow({
    where: { id: noteId },
    select: { userId: true, user: { select: userPolicySelect } }
  });
  if (!canWriteAdminNote(admin, before.user)) {
    await denyAdminAction(admin, before.user, 'ADMIN_NOTE_DELETE_DENIED', 'AdminNote', noteId, {
      previousValue: { deletedAt: null },
      newValue: { deletedAt: 'now' },
      requestMeta
    });
  }

  await prisma.adminNote.update({
    where: { id: noteId },
    data: { deletedAt: new Date() }
  });

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: before.userId,
      action: 'ADMIN_NOTE_DELETED',
      entityType: 'AdminNote',
      entityId: noteId,
      metadata: makeAuditMetadata({
        previousValue: { deletedAt: null },
        newValue: { deletedAt: 'soft_deleted' },
        extra: { deletionMode: 'soft' }
      }),
      ...requestMeta
    });

  revalidateAdminPaths(before.userId);
  revalidatePath('/admin/support');
  redirect(returnTo);
}

async function getTargetUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: userPolicySelect
  });
}

function getRequiredFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

function getReturnTo(formData: FormData, fallback: string) {
  const value = formData.get('returnTo');
  return typeof value === 'string' && value.startsWith('/admin') ? value : fallback;
}

function revalidateAdminPaths(userId: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/audit-logs');
  revalidatePath('/admin/plans');
}

const userPolicySelect = {
  id: true,
  role: true,
  status: true,
  plan: true,
  deletedAt: true
} as const;

async function countActiveSuperAdmins() {
  return prisma.user.count({
    where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null }
  });
}

function publicUserState(user: AdminPolicyUser & { plan?: Plan | string | null }) {
  return {
    role: user.role ?? null,
    status: user.status ?? null,
    plan: user.plan ?? null,
    deleted: Boolean(user.deletedAt)
  };
}

function canWriteAdminNote(admin: AdminPolicyUser, target: AdminPolicyUser) {
  if (!hasAdminPermission(admin.role, 'notes.write') && !hasAdminPermission(admin.role, 'notes.manage')) return false;
  if (target.status === 'DELETED' && admin.role !== 'SUPER_ADMIN') return false;
  if (target.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') return false;
  if (admin.role === 'SUPPORT' || admin.role === 'ADMIN') return target.role === 'USER' || target.role === 'SUPPORT' || target.role === 'ANALYST';
  return canManageUser(admin, target) || admin.role === 'SUPER_ADMIN';
}

async function denyAdminAction(
  admin: AdminPolicyUser,
  target: AdminPolicyUser,
  action: string,
  entityType: string,
  entityId: string | null,
  details: {
    previousValue: Parameters<typeof makeAuditMetadata>[0]['previousValue'];
    newValue: Parameters<typeof makeAuditMetadata>[0]['newValue'];
    requestMeta: { ipAddress: string | null; userAgent: string | null };
  }
) {
  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: target.id,
    action,
    entityType,
    entityId,
    metadata: makeAuditMetadata({
      previousValue: details.previousValue,
      newValue: details.newValue,
      extra: { result: 'DENIED', actorRole: admin.role ?? null, targetRole: target.role ?? null }
    }),
    ...details.requestMeta
  });
  redirect('/admin-denied');
}
