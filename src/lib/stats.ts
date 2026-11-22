/**
 * Statistics ledger builder for air quality data.
 * 
 * Compares measured values against WHO guidelines and calculates
 * impact metrics for recommended actions.
 * 
 * @module stats
 */

import type { Advice, Aqi } from "./schemas";

/**
 * WHO 2021 air quality guidelines for 24-hour average concentration.
 * Values in micrograms per cubic meter (µg/m³).
 * 
 * @see https://www.who.int/news-room/feature-stories/detail/what-are-the-who-air-quality-guidelines
 */
export const WHO_PM25_24H = 15;
export const WHO_PM10_24H = 45;

/**
 * Represents a single row in the statistics ledger.
 * Used to display air quality metrics and action impact.
 */
export type LedgerRow = {
  /** Display label for the metric */
  label: string;
  /** Numeric or string value to display */
  value: number | string;
  /** Optional unit label (e.g., "µg/m³", "%") */
  unit?: string;
  /** Explanatory caption or context */
  caption: string;
  /** Whether to animate the value on display */
  animate?: boolean;
};

const AQI_LABEL = ["", "Good", "Fair", "Moderate", "Poor", "Very poor"];

/**
 * Generates a caption comparing measured value to WHO guideline.
 * 
 * @param {number} value - Measured pollutant concentration
 * @param {number} guideline - WHO guideline value
 * @returns {string} Human-readable comparison text
 */
function whoCaption(value: number, guideline: number): string {
  const ratio = value / guideline;
  if (ratio <= 1) return `Within the WHO 24-hour guideline (${guideline} µg/m³)`;
  return `${ratio.toFixed(1)}× the WHO 24-hour guideline (${guideline} µg/m³)`;
}

/**
 * Builds a statistics ledger from air quality data and advice.
 * 
 * Creates rows showing:
 * - Current PM2.5 and PM10 levels vs WHO guidelines
 * - Air Quality Index rating
 * - Highest impact action from the plan
 * - Average estimated impact across all actions
 * 
 * @param {Aqi} aqi - Air quality measurements
 * @param {Advice} advice - Generated action plan
 * @param {boolean} fallback - Whether this is fallback/demo data (omits real measurements)
 * @returns {LedgerRow[]} Array of ledger rows for display
 * 
 * @example
 * const rows = buildLedger(aqi, advice, false);
 * rows.forEach(row => console.log(`${row.label}: ${row.value}${row.unit || ''}`));
 */
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