/**
 * Rate limiting module using token bucket algorithm.
 * Prevents API abuse by limiting requests per IP address.
 * 
 * @module rateLimit
 */

type Bucket = { tokens: number; last: number };
type Options = { capacity?: number; refillPerSec?: number };

/**
 * In-memory token bucket storage.
 * Note: For production multi-instance deployments (e.g. Vercel serverless),
 * each instance has its own map. Use Redis (e.g. Upstash) for a shared limit.
 */
const buckets = new Map<string, Bucket>();

const CAPACITY = 5;            // burst
const REFILL_PER_SEC = 5 / 60; // 5 requests per minute sustained
const MAX_KEYS = 5000;         // hard memory cap
const STALE_MS = 10 * 60_000;  // entries idle this long are safe to drop

/**
 * Token bucket rate limiter implementation.
 * 
 * Allows burst traffic up to capacity while enforcing sustained rate limits.
 * Automatically refills tokens over time and cleans up stale entries.
 * The map never grows beyond MAX_KEYS entries.
 * 
 * Tip: prefix the key per endpoint (e.g. "generate:" + ip) so different
 * endpoints do not share one bucket.
 * 
 * @param {string} key - Unique identifier (typically IP address)
 * @param {number} now - Current timestamp in milliseconds
 * @param {Options} opts - Optional capacity and refill rate overrides
 * @returns {{ ok: boolean; retryAfterSec: number }} Rate limit decision
 * 
 * @example
 * const result = rateLimit("generate:192.168.1.1");
 * if (!result.ok) {
 *   return Response.json({ error: "Too many requests" }, { 
 *     status: 429, 
 *     headers: { "Retry-After": String(result.retryAfterSec) }
 *   });
 * }
 */
export function rateLimit(
  key: string,
  now = Date.now(),
  opts: Options = {},
): { ok: boolean; retryAfterSec: number } {
  const capacity = opts.capacity ?? CAPACITY;
  const refill = opts.refillPerSec ?? REFILL_PER_SEC;

  if (buckets.size >= MAX_KEYS) {
    // 1) drop idle entries
    for (const [k, b] of buckets) if (now - b.last > STALE_MS) buckets.delete(k);
    // 2) still full? evict the least recently used (Map iterates in insertion order)
    while (buckets.size >= MAX_KEYS) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }

  const b = buckets.get(key) ?? { tokens: capacity, last: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.last) / 1000) * refill);
  b.last = now;

  // delete + set moves this key to the end, so the Map stays ordered by recency
  buckets.delete(key);

  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfterSec: Math.ceil((1 - b.tokens) / refill) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Test utility to reset rate limiter state.
 * @internal
 */
export function _resetForTests() {
  buckets.clear();
}