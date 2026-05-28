import { headers } from 'next/headers';
import { forbidden, notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Prisma } from '@prisma/client';
import { authOptions } from './auth';
import { logAuditEvent, makeAuditMetadata } from './admin-audit';
import {
  canAccessAdmin,
  hasAdminPermission,
  isAdminRole,
  isUserRole,
  isUserStatus,
  planValues,
  type AdminPermission,
  type AdminRole,
  type UserRole,
  type UserStatus
} from './admin-permissions';
import { planDefinitions } from './plans';
import { prisma } from './prisma';
import type { Plan } from './types';

export const adminPageSize = 20;
const adminAccessLogCache = new Map<string, number>();

export type AdminContext = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

type SearchParams = Record<string, string | string[] | undefined>;

export async function requireAdmin(
  permission: AdminPermission = 'admin.access',
  path = '/admin',
  options: { logAccess?: boolean } = {}
) {
  const session = await getServerSession(authOptions).catch(() => null);
  const requestMeta = await getRequestAuditMeta(path);

  if (!session?.user?.email) {
    await logAuditEvent({
      action: 'ADMIN_ACCESS_DENIED',
      entityType: 'AdminConsole',
      metadata: makeAuditMetadata({
        previousValue: null,
        newValue: 'DENIED',
        extra: { path, reason: 'NO_SESSION', requiredPermission: permission }
      }),
      ...requestMeta
    });
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true
    }
  }).catch(() => null);

  if (!user || !canAccessAdmin(user.role, user.status) || !hasAdminPermission(user.role, permission)) {
    await logAuditEvent({
      actorUserId: user?.id ?? session.user.id ?? null,
      targetUserId: user?.id ?? null,
      action: 'ADMIN_ACCESS_DENIED',
      entityType: 'AdminConsole',
      entityId: user?.id ?? null,
      metadata: makeAuditMetadata({
        previousValue: user ? { role: user.role, status: user.status } : null,
        newValue: 'DENIED',
        extra: {
          path,
          reason: user ? 'INSUFFICIENT_PERMISSION' : 'USER_NOT_FOUND',
          requiredPermission: permission
        }
      }),
      ...requestMeta
    });
    forbidden();
  }

  const admin = {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus
  };

  if (options.logAccess) {
    await logAdminAccessGranted(admin, path, requestMeta);
  }

  return admin;
}

export async function requireAdminAction(permission: AdminPermission, action: string) {
  const admin = await requireAdmin(permission, '/admin');
  return {
    admin,
    requestMeta: await getRequestAuditMeta(action)
  };
}

export async function requireRole(roles: AdminRole[], path = '/admin') {
  const admin = await requireAdmin('admin.access', path);
  if (!isAdminRole(admin.role) || !roles.includes(admin.role)) {
    await logAuditEvent({
      actorUserId: admin.id,
      targetUserId: admin.id,
      action: 'ADMIN_ACCESS_DENIED',
      entityType: 'AdminConsole',
      entityId: admin.id,
      metadata: makeAuditMetadata({
        previousValue: { role: admin.role },
        newValue: 'DENIED',
        extra: { path, reason: 'ROLE_NOT_ALLOWED', allowedRoles: roles }
      }),
      ...(await getRequestAuditMeta(path))
    });
    forbidden();
  }
  return admin;
}

export async function requirePermission(permission: AdminPermission, path = '/admin') {
  return requireAdmin(permission, path);
}

export function assertAdminPermission(admin: AdminContext, permission: AdminPermission) {
  if (!hasAdminPermission(admin.role, permission)) forbidden();
}

export async function getAdminDashboardData(admin: AdminContext) {
  const canViewUsers = hasAdminPermission(admin.role, 'users.view');
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    todayNewUsers,
    weeklyNewUsers,
    suspendedUsers,
    totalTrades,
    totalImports,
    failedImports,
    planCounts,
    recentLogs,
    recentUsers,
    recentImportFailures
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
    prisma.user.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
    prisma.trade.count(),
    prisma.importBatch.count(),
    prisma.importBatch.count({
      where: {
        OR: [
          { rejectedRows: { gt: 0 } },
          { status: { in: ['FAILED', 'IMPORTED_WITH_ERRORS'] } }
        ]
      }
    }),
    prisma.user.groupBy({
      by: ['plan'],
      where: { deletedAt: null },
      orderBy: { plan: 'asc' },
      _count: { plan: true }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        target: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        createdAt: true
      }
    }),
    prisma.importBatch.findMany({
      where: {
        OR: [
          { rejectedRows: { gt: 0 } },
          { status: { in: ['FAILED', 'IMPORTED_WITH_ERRORS'] } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: { select: { id: true, name: true, email: true } },
        rowErrors: { orderBy: { rowNumber: 'asc' }, take: 2 }
      }
    })
  ]);

  return {
    metrics: {
      totalUsers,
      activeUsers,
      todayNewUsers,
      weeklyNewUsers,
      suspendedUsers,
      totalTrades,
      totalImports,
      failedImports
    },
    planCounts: planValues.map((plan) => ({
      plan,
      count: countGrouped(planCounts.find((item) => item.plan === plan), 'plan')
    })),
    recentLogs: recentLogs.map(serializeAuditLog),
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: canViewUsers ? user.name ?? 'Unnamed user' : 'User',
      email: maskEmail(user.email),
      role: user.role,
      status: user.status,
      plan: user.plan,
      createdAt: user.createdAt.toISOString(),
      canOpen: canViewUsers
    })),
    recentImportFailures: recentImportFailures.map((batch) => ({
      id: batch.id,
      filename: batch.filename,
      status: batch.status,
      rejectedRows: batch.rejectedRows,
      totalRows: batch.totalRows,
      createdAt: batch.createdAt.toISOString(),
      user: {
        id: batch.user.id,
        name: batch.user.name ?? 'Unnamed user',
        email: maskEmail(batch.user.email)
      },
      errors: batch.rowErrors.map((error) => ({
        id: error.id,
        rowNumber: error.rowNumber,
        reason: error.reason
      }))
    })),
    riskAlerts: [
      ...(suspendedUsers > 0 ? [{ tone: 'warning' as const, title: 'Suspended accounts need review', detail: `${suspendedUsers} users are currently suspended.` }] : []),
      ...(failedImports > 0 ? [{ tone: 'critical' as const, title: 'Import failures detected', detail: `${failedImports} batches have rejected rows or failed status.` }] : []),
      ...(process.env.NEXTAUTH_SECRET ? [] : [{ tone: 'critical' as const, title: 'Auth secret missing', detail: 'Configure NEXTAUTH_SECRET before production use.' }]),
      ...(process.env.DATABASE_URL ? [] : [{ tone: 'critical' as const, title: 'Database missing', detail: 'Admin data is unavailable without DATABASE_URL.' }])
    ],
    system: getSystemStatus()
  };
}

export async function getAdminUsersData(searchParams: SearchParams) {
  const page = getPage(searchParams.page);
  const query = getString(searchParams.q).trim();
  const role = getString(searchParams.role);
  const status = getString(searchParams.status);
  const plan = getString(searchParams.plan);
  const sort = getString(searchParams.sort) || 'createdAt_desc';
  const createdFrom = parseDateParam(searchParams.createdFrom);
  const createdTo = parseDateParam(searchParams.createdTo);
  const lastLoginFrom = parseDateParam(searchParams.lastLoginFrom);
  const lastLoginTo = parseDateParam(searchParams.lastLoginTo);

  const where: Prisma.UserWhereInput = {
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(isUserRole(role) ? { role } : {}),
    ...(isUserStatus(status) ? { status } : { deletedAt: null }),
    ...(planValues.includes(plan as Plan) ? { plan: plan as Plan } : {}),
    ...(createdFrom || createdTo
      ? { createdAt: { ...(createdFrom ? { gte: createdFrom } : {}), ...(createdTo ? { lte: createdTo } : {}) } }
      : {}),
    ...(lastLoginFrom || lastLoginTo
      ? { lastLoginAt: { ...(lastLoginFrom ? { gte: lastLoginFrom } : {}), ...(lastLoginTo ? { lte: lastLoginTo } : {}) } }
      : {})
  };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: getUserSort(sort),
      skip: (page - 1) * adminPageSize,
      take: adminPageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            trades: true,
            importBatches: true
          }
        }
      }
    })
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name ?? 'Unnamed user',
      email: maskEmail(user.email),
      role: user.role,
      status: user.status,
      plan: user.plan,
      tradeCount: user._count.trades,
      importCount: user._count.importBatches,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString()
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / adminPageSize)),
    filters: {
      q: query,
      role,
      status,
      plan,
      sort,
      createdFrom: getString(searchParams.createdFrom),
      createdTo: getString(searchParams.createdTo),
      lastLoginFrom: getString(searchParams.lastLoginFrom),
      lastLoginTo: getString(searchParams.lastLoginTo)
    }
  };
}

export async function getAdminUserDetailData(userId: string) {
  const [user, tradeSummary, recentFailedImports, targetAuditLogs, adminNotes] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        timezone: true,
        emailVerified: true,
        lastLoginAt: true,
        subscriptionStatus: true,
        suspendedAt: true,
        suspendedReason: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: true,
            trades: true,
            importBatches: true,
            goals: true,
            notes: true,
            tags: true
          }
        }
      }
    }),
    prisma.trade.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { netPnl: true, fees: true },
      _avg: { rMultiple: true }
    }),
    prisma.importBatch.findMany({
      where: {
        userId,
        OR: [
          { rejectedRows: { gt: 0 } },
          { status: { in: ['FAILED', 'IMPORTED_WITH_ERRORS'] } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        rowErrors: {
          orderBy: { rowNumber: 'asc' },
          take: 3
        }
      }
    }),
    prisma.auditLog.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        target: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.adminNote.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    })
  ]);

  if (!user) notFound();

  return {
    user: {
      id: user.id,
      name: user.name ?? 'Unnamed user',
      email: user.email,
      role: user.role,
      status: user.status,
      plan: user.plan,
      timezone: user.timezone,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      subscriptionStatus: user.subscriptionStatus,
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      suspendedReason: user.suspendedReason,
      deletedAt: user.deletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      counts: user._count
    },
    tradeSummary: {
      count: tradeSummary._count._all,
      netPnl: Number(tradeSummary._sum.netPnl ?? 0),
      fees: Number(tradeSummary._sum.fees ?? 0),
      averageR: Number(tradeSummary._avg.rMultiple ?? 0)
    },
    recentFailedImports: recentFailedImports.map((batch) => ({
      id: batch.id,
      filename: batch.filename,
      broker: batch.broker,
      status: batch.status,
      totalRows: batch.totalRows,
      importedRows: batch.importedRows,
      rejectedRows: batch.rejectedRows,
      createdAt: batch.createdAt.toISOString(),
      errors: batch.rowErrors.map((error) => ({
        id: error.id,
        rowNumber: error.rowNumber,
        reason: error.reason
      }))
    })),
    auditLogs: targetAuditLogs.map(serializeAuditLog),
    adminNotes: adminNotes.map((note) => ({
      id: note.id,
      note: note.note,
      visibility: note.visibility,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      author: note.author
        ? {
            id: note.author.id,
            name: note.author.name ?? maskEmail(note.author.email),
            email: maskEmail(note.author.email),
            role: note.author.role
          }
        : null
    }))
  };
}

export async function getAdminAuditLogsData(searchParams: SearchParams) {
  const page = getPage(searchParams.page);
  const query = getString(searchParams.q).trim();
  const action = getString(searchParams.action).trim();
  const from = parseDateParam(searchParams.from);
  const to = parseDateParam(searchParams.to);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(query
      ? {
          OR: [
            { actor: { email: { contains: query, mode: 'insensitive' } } },
            { actor: { name: { contains: query, mode: 'insensitive' } } },
            { target: { email: { contains: query, mode: 'insensitive' } } },
            { target: { name: { contains: query, mode: 'insensitive' } } },
            { entityType: { contains: query, mode: 'insensitive' } },
            { entityId: { contains: query, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * adminPageSize,
      take: adminPageSize,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        target: { select: { id: true, name: true, email: true } }
      }
    })
  ]);

  return {
    logs: logs.map(serializeAuditLog),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / adminPageSize)),
    filters: {
      q: query,
      action,
      from: getString(searchParams.from),
      to: getString(searchParams.to)
    }
  };
}

export async function getAdminImportsData(admin: AdminContext, searchParams: SearchParams) {
  const page = getPage(searchParams.page);
  const status = getString(searchParams.status).trim();
  const query = getString(searchParams.q).trim();
  const selectedBatchId = getString(searchParams.batch).trim();
  const canViewUsers = hasAdminPermission(admin.role, 'users.view');
  const canViewErrorDetails = hasAdminPermission(admin.role, 'imports.view_errors');

  const importSearch: Prisma.ImportBatchWhereInput[] = [
    { filename: { contains: query, mode: 'insensitive' } },
    { broker: { contains: query, mode: 'insensitive' } }
  ];

  if (canViewUsers) {
    importSearch.push(
      { user: { email: { contains: query, mode: 'insensitive' } } },
      { user: { name: { contains: query, mode: 'insensitive' } } }
    );
  }

  const where: Prisma.ImportBatchWhereInput = {
    ...(status ? { status: { contains: status, mode: 'insensitive' } } : {}),
    ...(query ? { OR: importSearch } : {})
  };

  const [total, imports, statusCounts, errorReasons] = await prisma.$transaction([
    prisma.importBatch.count({ where }),
    prisma.importBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * adminPageSize,
      take: adminPageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
        rowErrors: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    }),
    prisma.importBatch.groupBy({
      by: ['status'],
      orderBy: { status: 'asc' },
      _count: { status: true }
    }),
    prisma.importRowError.groupBy({
      by: ['reason'],
      _count: { reason: true },
      orderBy: { _count: { reason: 'desc' } },
      take: 8
    })
  ]);

  const selectedBatch = selectedBatchId && canViewErrorDetails
    ? await prisma.importBatch.findUnique({
        where: { id: selectedBatchId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          rowErrors: {
            orderBy: { rowNumber: 'asc' },
            take: 50
          }
        }
      })
    : null;

  if (selectedBatch) {
    await logAuditEvent({
      actorUserId: admin.id,
      targetUserId: selectedBatch.userId,
      action: 'IMPORT_ERROR_DETAILS_VIEWED',
      entityType: 'ImportBatch',
      entityId: selectedBatch.id,
      metadata: {
        rejectedRows: selectedBatch.rejectedRows,
        visibleErrors: selectedBatch.rowErrors.length
      },
      ...(await getRequestAuditMeta('/admin/imports'))
    });
  }

  return {
    imports: imports.map((batch) => ({
      id: batch.id,
      filename: batch.filename,
      broker: batch.broker,
      status: batch.status,
      totalRows: batch.totalRows,
      importedRows: batch.importedRows,
      rejectedRows: batch.rejectedRows,
      createdAt: batch.createdAt.toISOString(),
      user: canViewUsers
        ? {
            id: batch.user.id,
            name: batch.user.name ?? 'Unnamed user',
            email: maskEmail(batch.user.email)
          }
        : {
            id: batch.user.id,
            name: 'Anonymized user',
            email: maskEmail(batch.user.email)
          },
      errors: batch.rowErrors.map((error) => ({
        id: error.id,
        rowNumber: error.rowNumber,
        reason: error.reason
      }))
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / adminPageSize)),
    statusCounts: statusCounts.map((item) => ({
      status: item.status,
      count: countGrouped(item, 'status')
    })),
    errorReasons: errorReasons.map((item) => ({
      reason: item.reason,
      count: countGrouped(item, 'reason')
    })),
    filters: {
      q: query,
      status,
      batch: selectedBatchId
    },
    canViewUsers,
    canViewErrorDetails,
    selectedBatch: selectedBatch
      ? {
          id: selectedBatch.id,
          filename: selectedBatch.filename,
          status: selectedBatch.status,
          rejectedRows: selectedBatch.rejectedRows,
          createdAt: selectedBatch.createdAt.toISOString(),
          user: canViewUsers
            ? {
                id: selectedBatch.user.id,
                name: selectedBatch.user.name ?? 'Unnamed user',
                email: maskEmail(selectedBatch.user.email)
              }
            : {
                id: selectedBatch.user.id,
                name: 'Anonymized user',
                email: maskEmail(selectedBatch.user.email)
              },
          errors: selectedBatch.rowErrors.map((error) => ({
            id: error.id,
            rowNumber: error.rowNumber,
            reason: error.reason
          }))
        }
      : null
  };
}

export async function getAdminPlansData() {
  const [planCounts, planLogs] = await prisma.$transaction([
    prisma.user.groupBy({
      by: ['plan'],
      where: { deletedAt: null },
      orderBy: { plan: 'asc' },
      _count: { plan: true }
    }),
    prisma.auditLog.findMany({
      where: { action: 'USER_PLAN_CHANGED' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        target: { select: { id: true, name: true, email: true } }
      }
    })
  ]);

  return {
    plans: planValues.map((plan) => ({
      id: plan,
      definition: planDefinitions[plan],
      userCount: countGrouped(planCounts.find((item) => item.plan === plan), 'plan')
    })),
    planLogs: planLogs.map(serializeAuditLog)
  };
}

export async function getAdminSupportData(searchParams: SearchParams) {
  const page = getPage(searchParams.page);
  const query = getString(searchParams.q).trim();
  const where: Prisma.AdminNoteWhereInput = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { note: { contains: query, mode: 'insensitive' } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { author: { email: { contains: query, mode: 'insensitive' } } },
            { author: { name: { contains: query, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [total, notes] = await prisma.$transaction([
    prisma.adminNote.count({ where }),
    prisma.adminNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * adminPageSize,
      take: adminPageSize,
      include: {
        user: { select: { id: true, name: true, email: true, status: true, plan: true } },
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    })
  ]);

  return {
    notes: notes.map((note) => ({
      id: note.id,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      user: {
        id: note.user.id,
        name: note.user.name ?? 'Unnamed user',
        email: maskEmail(note.user.email),
        status: note.user.status,
        plan: note.user.plan
      },
      author: note.author
        ? {
            id: note.author.id,
            name: note.author.name ?? maskEmail(note.author.email),
            email: maskEmail(note.author.email),
            role: note.author.role
          }
        : null
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / adminPageSize)),
    filters: { q: query }
  };
}

export async function getAdminSettingsData() {
  return {
    appName: 'TradeHarbor',
    publicUrl: process.env.NEXTAUTH_URL ?? 'Not configured',
    supportedLanguages: ['en', 'ko', 'ja', 'zh-CN', 'es'],
    featureFlags: [
      { key: 'csv_import', state: true },
      { key: 'deterministic_insights', state: true },
      { key: 'maintenance_mode', state: false, placeholder: true },
      { key: 'public_signup_enabled', state: true, placeholder: true },
      { key: 'admin_2fa_required', state: process.env.ADMIN_REQUIRE_2FA === 'true', placeholder: true }
    ],
    environment: getEnvironmentName(),
    demoMode: !process.env.DATABASE_URL,
    adminInvitesEnabled: process.env.ADMIN_INVITES_ENABLED === 'true',
    auditRetentionDays: process.env.ADMIN_AUDIT_RETENTION_DAYS ?? '365'
  };
}

export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.length <= 2 ? local[0] ?? '*' : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

async function logAdminAccessGranted(
  admin: AdminContext,
  path: string,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
) {
  const cacheKey = `${admin.id}:${path}`;
  const now = Date.now();
  const nextAllowedAt = adminAccessLogCache.get(cacheKey) ?? 0;
  if (nextAllowedAt > now) return;
  adminAccessLogCache.set(cacheKey, now + 15 * 60_000);

  await logAuditEvent({
    actorUserId: admin.id,
    targetUserId: admin.id,
    action: 'ADMIN_ACCESS_GRANTED',
    entityType: 'AdminConsole',
    entityId: admin.id,
    metadata: makeAuditMetadata({
      previousValue: null,
      newValue: 'GRANTED',
      extra: { path, role: admin.role }
    }),
    ...requestMeta
  });
}

export function formatAdminDate(value: string | Date | null | undefined) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatAdminNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function serializeAuditLog(log: {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Prisma.JsonValue | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actor: { id: string; name: string | null; email: string; role: string } | null;
  target: { id: string; name: string | null; email: string } | null;
}) {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
    actor: log.actor
      ? {
          id: log.actor.id,
          name: log.actor.name ?? maskEmail(log.actor.email),
          email: maskEmail(log.actor.email),
          role: log.actor.role
        }
      : null,
    target: log.target
      ? {
          id: log.target.id,
          name: log.target.name ?? maskEmail(log.target.email),
          email: maskEmail(log.target.email)
        }
      : null
  };
}

async function getRequestAuditMeta(path: string) {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  void path;
  return {
    ipAddress: forwardedFor?.split(',')[0]?.trim() ?? headerList.get('x-real-ip') ?? null,
    userAgent: headerList.get('user-agent') ?? null
  };
}

function getSystemStatus() {
  return {
    environment: getEnvironmentName(),
    database: process.env.DATABASE_URL ? 'Configured' : 'Missing',
    authSecret: process.env.NEXTAUTH_SECRET ? 'Configured' : 'Using local fallback',
    authUrl: process.env.NEXTAUTH_URL ?? 'Not configured',
    auditRetentionDays: process.env.ADMIN_AUDIT_RETENTION_DAYS ?? '365',
    admin2fa: process.env.ADMIN_REQUIRE_2FA === 'true' ? 'Required placeholder' : 'Not required'
  };
}

function getEnvironmentName() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
}

function getString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function getPage(value: string | string[] | undefined) {
  const page = Number.parseInt(getString(value), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseDateParam(value: string | string[] | undefined) {
  const raw = getString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getUserSort(sort: string): Prisma.UserOrderByWithRelationInput {
  switch (sort) {
    case 'tradeCount_desc':
      return { trades: { _count: 'desc' } };
    case 'tradeCount_asc':
      return { trades: { _count: 'asc' } };
    case 'importCount_desc':
      return { importBatches: { _count: 'desc' } };
    case 'importCount_asc':
      return { importBatches: { _count: 'asc' } };
    case 'createdAt_asc':
      return { createdAt: 'asc' };
    case 'email_asc':
      return { email: 'asc' };
    case 'lastLoginAt_desc':
      return { lastLoginAt: { sort: 'desc', nulls: 'last' } };
    case 'lastLoginAt_asc':
      return { lastLoginAt: { sort: 'asc', nulls: 'last' } };
    default:
      return { createdAt: 'desc' };
  }
}

function countGrouped(
  item: { _count?: true | Record<string, number | undefined> } | undefined,
  key: string
) {
  return item && typeof item._count === 'object' ? item._count[key] ?? 0 : 0;
}
