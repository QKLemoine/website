export type RateLimitResult = { ok: boolean; retryAfterSeconds: number }

const MAX_TRACKED_KEYS = 5000

/**
 * Sliding-window limiter held in process memory. On serverless hosts each
 * instance has its own memory, so this is a best-effort brake against casual
 * abuse, not a guarantee; a shared store would be needed for a hard limit.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>()

  return function check(key: string, now = Date.now()): RateLimitResult {
    const cutoff = now - windowMs
    const recent = (hits.get(key) ?? []).filter((time) => time > cutoff)

    if (recent.length >= limit) {
      hits.set(key, recent)
      return {
        ok: false,
        retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000),
      }
    }

    recent.push(now)
    hits.set(key, recent)

    if (hits.size > MAX_TRACKED_KEYS) {
      for (const [other, times] of hits) {
        if (times[times.length - 1] <= cutoff) hits.delete(other)
      }
    }
    return { ok: true, retryAfterSeconds: 0 }
  }
}
