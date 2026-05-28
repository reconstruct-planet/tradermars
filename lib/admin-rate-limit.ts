const actionAttempts = new Map<string, { count: number; resetAt: number }>();

export type AdminRateLimitOptions = {
  actorUserId: string;
  action: string;
  limit?: number;
  windowMs?: number;
};

export function enforceAdminRateLimit({
  actorUserId,
  action,
  limit = 20,
  windowMs = 60_000
}: AdminRateLimitOptions) {
  const now = Date.now();
  const key = `${actorUserId}:${action}`;
  const current = actionAttempts.get(key);

  if (!current || current.resetAt <= now) {
    actionAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error('Too many sensitive admin actions. Try again shortly.');
  }

  current.count += 1;
}

// TODO: Replace this in-memory placeholder with a shared store such as Redis or
// Vercel KV before relying on it across multiple production instances.
