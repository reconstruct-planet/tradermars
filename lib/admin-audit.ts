import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

const sensitiveMetadataKeys = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'session',
  'cookie',
  'authorization',
  'apiKey',
  'raw'
];

export type AuditLogInput = {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAuditEvent(input: AuditLogInput) {
  if (!process.env.DATABASE_URL) return;

  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? sanitizeAuditMetadata(input.metadata) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });
  } catch {
    // Audit logging should never expose sensitive implementation details to users.
  }
}

export function makeAuditMetadata({
  previousValue,
  newValue,
  extra
}: {
  previousValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  extra?: Record<string, Prisma.InputJsonValue | null | undefined>;
}) {
  return sanitizeAuditMetadata({
    previousValue: previousValue ?? null,
    newValue: newValue ?? null,
    ...(extra ?? {})
  });
}

export function sanitizeAuditMetadata(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => item === null ? null : sanitizeAuditMetadata(item));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveMetadataKey(key)
          ? '[redacted]'
          : item === null || item === undefined
            ? null
            : sanitizeAuditMetadata(item as Prisma.InputJsonValue)
      ])
    ) as Prisma.InputJsonObject;
  }

  return value;
}

function isSensitiveMetadataKey(key: string) {
  const normalized = key.toLowerCase();
  return sensitiveMetadataKeys.some((sensitiveKey) => normalized.includes(sensitiveKey.toLowerCase()));
}
