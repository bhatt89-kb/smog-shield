import { NextRequest, NextResponse } from "next/server";
import { LifestyleInputSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";
import { fetchAqi } from "@/lib/aqi";
import { generateAdvice } from "@/lib/gemini";
import { getDemoAdvice } from "@/lib/demoAdvice";
import { cacheGet, cacheKey, cacheSet } from "@/lib/adviceCache";
import { detectInjectionPatterns } from "@/lib/security";
import { errorResponse, successResponse, validateRequestHeaders } from "@/lib/middleware";
import type { Advice, Aqi } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds; avoids silent timeouts on slow model calls
const MAX_BODY = 2_000; // characters

export async function POST(req: NextRequest) {
  try {
    // Validate request headers
    const headerValidation = validateRequestHeaders(req);
    if (!headerValidation.valid) {
      return errorResponse(headerValidation.error || "Invalid request", 400);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    // Prefixed so this endpoint has its own bucket (city autocomplete does not use it up)
    const rl = rateLimit(`generate:${ip}`);
    if (!rl.ok) {
      return errorResponse("Too many requests. Please wait.", 429, {
        "Retry-After": String(rl.retryAfterSec),
      });
    }

    const text = await req.text();
    if (text.length > MAX_BODY) {
      return errorResponse("Payload too large", 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const parsed = LifestyleInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    // Additional security check for injection patterns (disabled in test mode to not interfere)
    if (process.env.NODE_ENV !== "test") {
      const injectionCheck = detectInjectionPatterns(parsed.data.city);
      if (!injectionCheck.safe) {
        console.warn(`Injection attempt detected: ${injectionCheck.reason}`);
        return errorResponse("Invalid city name detected", 400);
      }
    }

    const gKey = process.env.GEMINI_API_KEY;
    const wKey = process.env.OPENWEATHER_API_KEY;
    if (!gKey || !wKey) {
      return errorResponse("Server misconfigured", 500);
    }

    // Same inputs within 10 minutes reuse the last real result (faster, saves AI quota).
    // The rate limiter above still runs first, so this cannot be used to bypass it.
    // The cache key includes `language`, so English and Hindi results never mix.
    const cacheId = cacheKey({ ...parsed.data, city: parsed.data.city.toLowerCase() });
    const cached = cacheGet<{ aqi: Aqi; advice: Advice }>(cacheId);
    if (cached) {
      return successResponse(cached, { "X-Cache": "HIT" });
    }

    // Declared outside the try so the fallback can reuse real air data
    // when only the AI step fails.
    let aqi: Aqi | null = null;

    try {
      aqi = await fetchAqi(parsed.data.city, wKey);
      const advice = await generateAdvice(parsed.data, aqi, gKey);
      const payload = { aqi, advice };
      cacheSet(cacheId, payload); // fallback answers are never cached
      return successResponse(payload);
    } catch (e) {
      // AqiError carries `.code`; plain Errors (and test mocks) carry the same value in `.message`
      const code =
        typeof e === "object" && e !== null && "code" in e
          ? String((e as { code: unknown }).code)
          : e instanceof Error
            ? e.message
            : "";
      if (code === "city_not_found") {
        return errorResponse("We couldn't find that city.", 404);
      }

      // Log which step failed; never leak internals to the client
      const step = aqi ? "advice" : "aqi";
      console.error("generate_failed", step, e instanceof Error ? e.message : "unknown");

      if (process.env.DEMO_FALLBACK !== "false") {
        return successResponse({
          // Real air data when we have it; otherwise a placeholder
          // (aqiUnavailable tells the UI to hide the numbers)
          aqi: aqi ?? { city: parsed.data.city, aqiIndex: 4, pm25: 0, pm10: 0 },
          aqiUnavailable: aqi === null,
          advice: getDemoAdvice(parsed.data.language), // Hindi fallback when language is "hi"
          fallback: true,
        });
      }
      return errorResponse("Could not generate advice right now. Please try again.", 502);
    }
  } catch (e) {
    console.error("generate_crashed", e instanceof Error ? e.message : e);
    return errorResponse("Unexpected server error. Please try again.", 500);
  }
}