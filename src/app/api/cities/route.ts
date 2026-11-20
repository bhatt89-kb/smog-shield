import { NextRequest, NextResponse } from "next/server";
import { CitySchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

type GeoItem = { name?: string; state?: string; country?: string };

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const rl = rateLimit(`cities:${ip}`, Date.now(), { capacity: 20, refillPerSec: 20 / 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const parsed = CitySchema.safeParse(req.nextUrl.searchParams.get("q") ?? "");
    if (!parsed.success) return NextResponse.json({ suggestions: [] }, { status: 400 });

    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) return NextResponse.json({ suggestions: [] }, { status: 500 });

    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(parsed.data)}&limit=5&appid=${key}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error("geo_failed");
    const raw: unknown = await res.json();
    const list: GeoItem[] = Array.isArray(raw) ? raw : [];

    const seen = new Set<string>();
    const suggestions = list
      .filter((g) => typeof g.name === "string" && typeof g.country === "string")
      .map((g) => ({
        label: [g.name, g.state, g.country].filter(Boolean).join(", "),
        value: `${g.name}, ${g.country}`,
      }))
      .filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)));

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("cities_failed", e instanceof Error ? e.message : "");
    return NextResponse.json({ suggestions: [] }, { status: 502 });
  }
}