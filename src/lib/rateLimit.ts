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
 * Note: For production multi-instance deployments, use Redis or similar.
 */
const buckets = new Map<string, Bucket>();

const CAPACITY = 5;            // burst
const REFILL_PER_SEC = 5 / 60; // 5 requests per minute sustained
const MAX_KEYS = 5000;         // memory guard

/**
 * Token bucket rate limiter implementation.
 * 
 * Allows burst traffic up to capacity while enforcing sustained rate limits.
 * Automatically refills tokens over time and cleans up stale entries.
 * 
 * @param {string} key - Unique identifier (typically IP address)
 * @param {number} now - Current timestamp in milliseconds
 * @param {Options} opts - Optional capacity and refill rate overrides
 * @returns {{ ok: boolean; retryAfterSec: number }} Rate limit decision
 * 
 * @example
 * const result = rateLimit("192.168.1.1");
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

  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (now - b.last > 10 * 60_000) buckets.delete(k);
  }
  const b = buckets.get(key) ?? { tokens: capacity, last: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.last) / 1000) * refill);
  b.last = now;
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