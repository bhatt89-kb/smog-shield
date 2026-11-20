import type { Advice, Aqi } from "./schemas";

// WHO 2021 air quality guidelines, 24-hour average (µg/m³)
export const WHO_PM25_24H = 15;
export const WHO_PM10_24H = 45;

export type LedgerRow = {
  label: string;
  value: number | string;
  unit?: string;
  caption: string;
  animate?: boolean;
};

const AQI_LABEL = ["", "Good", "Fair", "Moderate", "Poor", "Very poor"];

function whoCaption(value: number, guideline: number): string {
  const ratio = value / guideline;
  if (ratio <= 1) return `Within the WHO 24-hour guideline (${guideline} µg/m³)`;
  return `${ratio.toFixed(1)}× the WHO 24-hour guideline (${guideline} µg/m³)`;
}

export function buildLedger(aqi: Aqi, advice: Advice, fallback = false): LedgerRow[] {
  const rows: LedgerRow[] = [];

  // Fallback data has no real readings, so skip the air rows
  if (!fallback) {
    rows.push({
      label: "PM2.5",
      value: Math.round(aqi.pm25),
      unit: "µg/m³",
      animate: true,
      caption: whoCaption(aqi.pm25, WHO_PM25_24H),
    });
    rows.push({
      label: "PM10",
      value: Math.round(aqi.pm10),
      unit: "µg/m³",
      animate: true,
      caption: whoCaption(aqi.pm10, WHO_PM10_24H),
    });
    rows.push({
      label: "Air quality index",
      value: `${aqi.aqiIndex} / 5`,
      caption: AQI_LABEL[aqi.aqiIndex] ?? "Unknown",
    });
  }

  if (advice.actions.length > 0) {
    const top = advice.actions.reduce((best, a) =>
      a.impact.estimatedReductionPercent > best.impact.estimatedReductionPercent ? a : best,
    );
    const avg =
      advice.actions.reduce((sum, a) => sum + a.impact.estimatedReductionPercent, 0) /
      advice.actions.length;

    rows.push({
      label: "Biggest single action",
      value: Math.round(top.impact.estimatedReductionPercent),
      unit: "%",
      animate: true,
      caption: top.title,
    });
    rows.push({
      label: "Plan average",
      value: Math.round(avg),
      unit: "%",
      animate: true,
      caption: `Average estimated reduction across ${advice.actions.length} actions`,
    });
  }

  return rows;
}