type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

const CAPACITY = 5;            // burst
const REFILL_PER_SEC = 5 / 60; // 5 requests per minute sustained
const MAX_KEYS = 5000;         // memory guard

export function rateLimit(key: string, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (now - b.last > 10 * 60_000) buckets.delete(k);
  }
  const b = buckets.get(key) ?? { tokens: CAPACITY, last: now };
  b.tokens = Math.min(CAPACITY, b.tokens + ((now - b.last) / 1000) * REFILL_PER_SEC);
  b.last = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfterSec: Math.ceil((1 - b.tokens) / REFILL_PER_SEC) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfterSec: 0 };
}

export function _resetForTests() {
  buckets.clear();
}