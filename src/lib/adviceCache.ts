type Entry = { value: unknown; expires: number };

const TTL_MS = 10 * 60_000; // keep results for 10 minutes
const MAX_ENTRIES = 100; // memory guard
const store = new Map<string, Entry>();

// Stable key: same inputs always give the same string, whatever the property order
export function cacheKey(parts: Record<string, unknown>): string {
  return JSON.stringify(Object.entries(parts).sort(([a], [b]) => (a < b ? -1 : 1)));
}

export function cacheGet<T>(key: string, now = Date.now()): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires <= now) {
    store.delete(key);
    return undefined;
  }
  store.delete(key); // re-insert so the most recently used entry stays newest
  store.set(key, hit);
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, now = Date.now()): void {
  store.delete(key);
  store.set(key, { value, expires: now + TTL_MS });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function _resetCacheForTests(): void {
  store.clear();
}
