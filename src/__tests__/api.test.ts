import { describe, it, expect, beforeEach } from "vitest";
import { parseAdvice } from "@/lib/gemini";
import { rateLimit, _resetForTests } from "@/lib/rateLimit";

const action = (i: number) => ({
  id: `a${i}`,
  category: "indoor",
  title: "Seal gaps",
  steps: ["Use door sweeps"],
  whyItWorks: "Less infiltration",
  effort: "low",
  impact: { metric: "indoor PM2.5", estimatedReductionPercent: 20, explanation: "Fewer leaks" },
});
const good = { healthAlert: "Limit outdoor time", summary: "ok", actions: [action(1), action(2), action(3)] };

describe("parseAdvice", () => {
  it("parses clean JSON", () => {
    expect(parseAdvice(JSON.stringify(good)).actions).toHaveLength(3);
  });
  it("strips markdown fences", () => {
    expect(parseAdvice("```json\n" + JSON.stringify(good) + "\n```").summary).toBe("ok");
  });
  it("throws on malformed JSON", () => {
    expect(() => parseAdvice("not json")).toThrow();
  });
  it("throws when impact is out of range", () => {
    const bad = {
      ...good,
      actions: [
        { ...action(1), impact: { ...action(1).impact, estimatedReductionPercent: 400 } },
        action(2),
        action(3),
      ],
    };
    expect(() => parseAdvice(JSON.stringify(bad))).toThrow();
  });
});

describe("rateLimit", () => {
  beforeEach(_resetForTests);
  it("blocks after burst and recovers over time", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit("ip", t).ok).toBe(true);
    expect(rateLimit("ip", t).ok).toBe(false);
    expect(rateLimit("ip", t + 13_000).ok).toBe(true);
  });
  it("isolates clients", () => {
    for (let i = 0; i < 5; i++) rateLimit("a", 1);
    expect(rateLimit("b", 1).ok).toBe(true);
  });
});