import type { Advice } from "./schemas";

const mk = (
  i: number,
  category: "routine" | "indoor" | "sustainable",
  title: string,
  step: string,
  why: string,
  metric: string,
  pct: number,
) => ({
  id: `demo${i}`,
  category,
  title,
  steps: [step],
  whyItWorks: why,
  effort: "low" as const,
  impact: {
    metric,
    estimatedReductionPercent: pct,
    explanation: "Indicative estimate from published ranges; actual results vary.",
  },
});

export const demoAdvice: Advice = {
  healthAlert: "Offline guidance: on high-smog days limit outdoor activity and use an N95/FFP2 mask outdoors.",
  summary: "General guidance shown because live AI advice is temporarily unavailable.",
  actions: [
    mk(1, "routine", "Shift outdoor activity to midday", "Exercise or walk when pollution is lowest, usually in the afternoon.", "Cold morning air traps pollutants near the ground.", "outdoor PM2.5 exposure", 25),
    mk(2, "indoor", "Seal gaps and run a purifier", "Close windows in peak smog hours and use door sweeps.", "Cuts infiltration of outdoor particles.", "indoor PM2.5", 40),
    mk(3, "sustainable", "Switch to public transport or carpool", "Replace one solo car trip per day.", "Fewer vehicles means lower tailpipe emissions.", "commute emissions", 30),
  ],
};