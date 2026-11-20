import { describe, it, expect } from "vitest";
import { buildLedger } from "@/lib/stats";
import type { Advice, Aqi } from "@/lib/schemas";

const action = (id: string, pct: number, title = `Action ${id}`) => ({
  id,
  category: "indoor" as const,
  title,
  steps: ["Do it"],
  whyItWorks: "Because",
  effort: "low" as const,
  impact: { metric: "indoor PM2.5", estimatedReductionPercent: pct, explanation: "Estimate" },
});

const advice: Advice = {
  healthAlert: "Stay in",
  summary: "ok",
  actions: [action("a", 20), action("b", 40, "Run a purifier"), action("c", 30)],
};

const aqi: Aqi = { city: "Dehradun", aqiIndex: 5, pm25: 151, pm10: 179 };

describe("buildLedger", () => {
  it("compares PM readings to the WHO guideline", () => {
    const rows = buildLedger(aqi, advice);
    expect(rows[0].caption).toContain("10.1×");
    expect(rows[1].caption).toContain("4.0×");
  });

  it("says 'within' when below the guideline", () => {
    const rows = buildLedger({ ...aqi, pm25: 10, pm10: 30 }, advice);
    expect(rows[0].caption).toContain("Within");
  });

  it("picks the biggest action and averages the plan", () => {
    const rows = buildLedger(aqi, advice);
    const top = rows.find((r) => r.label === "Biggest single action");
    const avg = rows.find((r) => r.label === "Plan average");
    expect(top?.value).toBe(40);
    expect(top?.caption).toBe("Run a purifier");
    expect(avg?.value).toBe(30);
  });

  it("skips air rows for fallback data", () => {
    const rows = buildLedger(aqi, advice, true);
    expect(rows.map((r) => r.label)).toEqual(["Biggest single action", "Plan average"]);
  });
});