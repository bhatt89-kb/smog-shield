/**
 * Air Quality Index (AQI) fetcher for OpenWeather API.
 * 
 * Retrieves live air pollution data for a specified city.
 * Uses geocoding to resolve city names to coordinates.
 * 
 * @module aqi
 */

import { z } from "zod";
import { AqiSchema, type Aqi } from "./schemas";

const BASE = "https://api.openweathermap.org";
const TIMEOUT_MS = 5000; // applied separately to each upstream call

export type AqiErrorCode = "city_not_found" | "geo_failed" | "air_failed";

/**
 * Typed error so callers can use `instanceof` and `.code` instead of
 * comparing message strings. `message` equals `code` for backward compatibility.
 */
export class AqiError extends Error {
  readonly code: AqiErrorCode;
  constructor(code: AqiErrorCode) {
    super(code);
    this.name = "AqiError";
    this.code = code;
  }
}

/** Shape of one OpenWeather geocoding result (only the fields we use). */
const GeoResultSchema = z.object({
  name: z.string(),
  lat: z.number().finite(),
  lon: z.number().finite(),
  state: z.string().optional(),
  country: z.string().optional(),
});

/** Fetches JSON with its own timeout; any network, HTTP or parse failure becomes `code`. */
async function fetchJson(url: string, code: AqiErrorCode): Promise<unknown> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new AqiError(code);
    return await res.json();
  } catch (e) {
    if (e instanceof AqiError) throw e;
    throw new AqiError(code);
  }
}

/**
 * Fetches current air quality data for a city.
 * 
 * Process:
 * 1. Geocode city name to coordinates using OpenWeather Geocoding API
 * 2. Fetch air pollution data for those coordinates
 * 3. Parse and validate response against AqiSchema
 * 
 * @param {string} city - City name with optional country code (e.g., "Delhi, IN")
 * @param {string} apiKey - OpenWeather API key
 * @returns {Promise<Aqi>} Air quality data including AQI, PM2.5, and PM10
 * @throws {AqiError} code "city_not_found" if geocoding returns no results
 * @throws {AqiError} code "geo_failed" if the geocoding call fails or returns bad data
 * @throws {AqiError} code "air_failed" if the air pollution call fails or returns bad data
 * 
 * @example
 * const aqi = await fetchAqi("Delhi, IN", process.env.OPENWEATHER_API_KEY);
 * console.log(`AQI: ${aqi.aqiIndex}, PM2.5: ${aqi.pm25}`);
 */
export async function fetchAqi(city: string, apiKey: string): Promise<Aqi> {
  const geoRaw = await fetchJson(
    `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`,
    "geo_failed",
  );
  if (!Array.isArray(geoRaw)) throw new AqiError("geo_failed");
  if (geoRaw.length === 0) throw new AqiError("city_not_found");

  const geoParsed = z.array(GeoResultSchema).safeParse(geoRaw);
  if (!geoParsed.success || geoParsed.data.length === 0) throw new AqiError("geo_failed");
  const geo = geoParsed.data;

  // "Dehradun, IN" -> name "dehradun", country "IN"
  const parts = city.split(",").map((p) => p.trim());
  const wanted = parts[0].toLowerCase();
  const countryHint = parts[1] && parts[1].length === 2 ? parts[1].toUpperCase() : undefined;

  // If a country code was given, prefer results from that country (fall back to all results).
  const byCountry = countryHint ? geo.filter((g) => g.country === countryHint) : [];
  const candidates = byCountry.length > 0 ? byCountry : geo;

  // Prefer an exact name match, else the top candidate
  const place = candidates.find((g) => g.name.toLowerCase() === wanted) ?? candidates[0];
  const { lat, lon, name, state, country } = place;

  const air = (await fetchJson(
    `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
    "air_failed",
  )) as { list?: { main?: { aqi?: number }; components?: { pm2_5?: number; pm10?: number } }[] };
  const item = air?.list?.[0];

  const parsed = AqiSchema.safeParse({
    city: name,
    state,
    country,
    aqiIndex: item?.main?.aqi,
    pm25: item?.components?.pm2_5,
    pm10: item?.components?.pm10,
  });
  if (!parsed.success) throw new AqiError("air_failed");
  return parsed.data;
}