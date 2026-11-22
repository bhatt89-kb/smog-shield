import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheKey, cacheSet, _resetCacheForTests } from "../lib/adviceCache";

beforeEach(_resetCacheForTests);

describe("adviceCache", () => {
  it("builds the same key regardless of property order", () => {
    expect(cacheKey({ a: 1, b: 2 })).toBe(cacheKey({ b: 2, a: 1 }));
  });

  it("returns a stored value until it expires", () => {
    cacheSet("k", { ok: true }, 1_000);
    expect(cacheGet("k", 1_000 + 60_000)).toEqual({ ok: true });
    expect(cacheGet("k", 1_000 + 11 * 60_000)).toBeUndefined();
  });

  it("returns undefined for unknown keys", () => {
    expect(cacheGet("missing")).toBeUndefined();
  });

  it("evicts the oldest entries beyond the size limit", () => {
    for (let i = 0; i < 101; i++) cacheSet(`k${i}`, i, 1_000);
    expect(cacheGet("k0", 1_001)).toBeUndefined();
    expect(cacheGet("k100", 1_001)).toBe(100);
  });
});
