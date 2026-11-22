import { NextRequest, NextResponse } from "next/server";
import { LifestyleInputSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";
import { fetchAqi } from "@/lib/aqi";
import { generateAdvice } from "@/lib/gemini";
import { demoAdvice } from "@/lib/demoAdvice";
import { cacheGet, cacheKey, cacheSet } from "@/lib/adviceCache";
import type { Advice, Aqi } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds; avoids silent timeouts on slow model calls
const MAX_BODY = 2_000; // characters

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const rl = rateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = LifestyleInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 },
      );
    }

    const gKey = process.env.GEMINI_API_KEY;
    const wKey = process.env.OPENWEATHER_API_KEY;
    if (!gKey || !wKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Same inputs within 10 minutes reuse the last real result (faster, saves AI quota).
    // The rate limiter above still runs first, so this cannot be used to bypass it.
    const cacheId = cacheKey({ ...parsed.data, city: parsed.data.city.toLowerCase() });
    const cached = cacheGet<{ aqi: Aqi; advice: Advice }>(cacheId);
    if (cached) {
      return NextResponse.json(cached, { headers: { "Cache-Control": "no-store", "X-Cache": "HIT" } });
    }

    try {
      const aqi = await fetchAqi(parsed.data.city, wKey);
      const advice = await generateAdvice(parsed.data, aqi, gKey);
      const payload = { aqi, advice };
      cacheSet(cacheId, payload); // fallback answers are never cached
      return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "city_not_found") {
        return NextResponse.json({ error: "We couldn't find that city." }, { status: 404 });
      }
      console.error("generate_failed", msg); // never leak internals to the client
      if (process.env.DEMO_FALLBACK !== "false") {
        return NextResponse.json({
          aqi: { city: parsed.data.city, aqiIndex: 4, pm25: 0, pm10: 0 },
          advice: demoAdvice,
          fallback: true,
        });
      }
      return NextResponse.json(
        { error: "Could not generate advice right now. Please try again." },
        { status: 502 },
      );
    }
  } catch (e) {
    console.error("generate_crashed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Unexpected server error. Please try again." }, { status: 500 });
  }
}