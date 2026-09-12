import "server-only";

/**
 * In-process rate limiting.
 *
 * A fixed-window counter held in memory. Good enough for a single Node process
 * and for development, and it is a real defence against a script hammering an
 * endpoint from one session.
 *
 * NOTE for production: on a multi-instance or serverless deployment each
 * instance keeps its own counters, so the effective limit multiplies by the
 * instance count. Swap `hit()` for a Redis/Upstash counter before scaling out.
 * Nothing else needs to change — this is the only call site.
 *
 * This is defence in depth, not the defence: the coin rules themselves are
 * idempotent and time-clamped, so exceeding a rate limit still cannot mint
 * coins.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function hit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const ok = existing.count <= limit;

  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

export const LIMITS = {
  heartbeat: { limit: 6, windowSeconds: 60 },
  mutation: { limit: 60, windowSeconds: 60 },
  upload: { limit: 8, windowSeconds: 300 },
  auth: { limit: 10, windowSeconds: 300 },
  search: { limit: 90, windowSeconds: 60 },
} as const;

export class RateLimited extends Error {
  readonly status = 429;
  constructor(readonly retryAfterSeconds: number) {
    super("You're doing that too fast. Give it a moment.");
    this.name = "RateLimited";
  }
}

/** Throws RateLimited when the caller is over the limit. */
export function enforce(key: string, config: { limit: number; windowSeconds: number }): void {
  const result = hit(key, config.limit, config.windowSeconds);
  if (!result.ok) throw new RateLimited(result.retryAfterSeconds);
}
