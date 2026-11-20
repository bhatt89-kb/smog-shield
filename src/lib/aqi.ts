import { AqiSchema, type Aqi } from "./schemas";

const BASE = "https://api.openweathermap.org";

export async function fetchAqi(city: string, apiKey: string): Promise<Aqi> {
  const signal = AbortSignal.timeout(5000);

  const geoRes = await fetch(
    `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`,
    { signal, next: { revalidate: 600 } },
  );
  if (!geoRes.ok) throw new Error("geo_failed");
  const geo = await geoRes.json();
  if (!Array.isArray(geo) || geo.length === 0) throw new Error("city_not_found");
  const { lat, lon, name } = geo[0];

  const airRes = await fetch(
    `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
    { signal, next: { revalidate: 600 } },
  );
  if (!airRes.ok) throw new Error("air_failed");
  const air = await airRes.json();
  const item = air?.list?.[0];

  return AqiSchema.parse({
    city: name,
    aqiIndex: item?.main?.aqi,
    pm25: item?.components?.pm2_5,
    pm10: item?.components?.pm10,
  });
}