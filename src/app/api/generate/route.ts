import { NextRequest, NextResponse } from "next/server";
import { LifestyleInputSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";
import { fetchAqi } from "@/lib/aqi";
import { generateAdvice } from "@/lib/gemini";
import { demoAdvice } from "@/lib/demoAdvice";

export const runtime = "nodejs";
const MAX_BODY = 2_000; // characters

export async function POST(req: NextRequest) {
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

  try {
    const aqi = await fetchAqi(parsed.data.city, wKey);
    const advice = await generateAdvice(parsed.data, aqi, gKey);
    return NextResponse.json({ aqi, advice }, { headers: { "Cache-Control": "no-store" } });
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
}