/**
 * Air Quality Index (AQI) fetcher for OpenWeather API.
 * 
 * Retrieves live air pollution data for a specified city.
 * Uses geocoding to resolve city names to coordinates.
 * 
 * @module aqi
 */

import { AqiSchema, type Aqi } from "./schemas";

const BASE = "https://api.openweathermap.org";

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
 * @throws {Error} "city_not_found" if geocoding returns no results
 * @throws {Error} "geo_failed" if geocoding API call fails
 * @throws {Error} "air_failed" if air pollution API call fails
 * 
 * @example
 * const aqi = await fetchAqi("Delhi, IN", process.env.OPENWEATHER_API_KEY);
 * console.log(`AQI: ${aqi.aqiIndex}, PM2.5: ${aqi.pm25}`);
 */
export async function fetchAqi(city: string, apiKey: string): Promise<Aqi> {
  const signal = AbortSignal.timeout(5000);

  const geoRes = await fetch(
    `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`,
    { signal, next: { revalidate: 600 } },
  );
  if (!geoRes.ok) throw new Error("geo_failed");
  const geo = await geoRes.json();
  if (!Array.isArray(geo) || geo.length === 0) throw new Error("city_not_found");

  // Prefer an exact name match ("Dehradun" from "Dehradun, IN"), else the top result
  const wanted = city.split(",")[0].trim().toLowerCase();
  const place =
    geo.find((g) => typeof g.name === "string" && g.name.toLowerCase() === wanted) ?? geo[0];
  const { lat, lon, name, state, country } = place;

  const airRes = await fetch(
    `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
    { signal, next: { revalidate: 600 } },
  );
  if (!airRes.ok) throw new Error("air_failed");
  const air = await airRes.json();
  const item = air?.list?.[0];

  return AqiSchema.parse({
    city: name,
    state,
    country,
    aqiIndex: item?.main?.aqi,
    pm25: item?.components?.pm2_5,
    pm10: item?.components?.pm10,
  });
}