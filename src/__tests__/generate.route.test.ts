import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/aqi", () => ({ fetchAqi: vi.fn() }));
vi.mock("@/lib/gemini", () => ({ generateAdvice: vi.fn() }));

import { POST } from "@/app/api/generate/route";
import { fetchAqi } from "@/lib/aqi";
import { generateAdvice } from "@/lib/gemini";
import { demoAdvice } from "@/lib/demoAdvice";
import { _resetForTests } from "@/lib/rateLimit";
import { _resetCacheForTests } from "@/lib/adviceCache";

const validBody = {
  city: "Delhi, IN",
  householdSize: 4,
  hasChildrenOrElderly: false,
  commute: "car",
  cooking: "lpg",
  heating: "none",
  hasPurifier: false,
  language: "en",
};

function makeRequest(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: { 
      "x-forwarded-for": "1.2.3.4",
      "content-type": "application/json",
    },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  _resetForTests();
  _resetCacheForTests();
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.OPENWEATHER_API_KEY = "test-weather-key";
  delete process.env.DEMO_FALLBACK;
  vi.mocked(fetchAqi).mockResolvedValue({
    city: "Delhi",
    aqiIndex: 4,
    pm25: 120,
    pm10: 200,
  });
  vi.mocked(generateAdvice).mockResolvedValue(demoAdvice);
});

describe("POST /api/generate", () => {
  it("returns 200 with aqi and advice for valid input", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.aqi.city).toBe("Delhi");
    expect(json.advice.actions.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(makeRequest("{not json", true));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid input", async () => {
    const res = await POST(makeRequest({ ...validBody, householdSize: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 413 for an oversized payload", async () => {
    const res = await POST(makeRequest({ ...validBody, city: "a".repeat(3000) }));
    expect(res.status).toBe(413);
  });

  it("returns 500 when API keys are missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });

  it("returns 404 when the city is not found", async () => {
    vi.mocked(fetchAqi).mockRejectedValue(new Error("city_not_found"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it("falls back to demo advice when the AI call fails", async () => {
    vi.mocked(generateAdvice).mockRejectedValue(new Error("model_down"));
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.fallback).toBe(true);
  });

  it("returns 502 instead of fallback when DEMO_FALLBACK is false", async () => {
    process.env.DEMO_FALLBACK = "false";
    vi.mocked(generateAdvice).mockRejectedValue(new Error("model_down"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(502);
  });

  it("returns 429 after the rate limit burst", async () => {
    for (let i = 0; i < 5; i++) await POST(makeRequest(validBody));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });
});
describe("POST /api/generate caching", () => {
  it("serves repeated identical requests from the cache without calling the AI again", async () => {
    vi.mocked(generateAdvice).mockClear(); // earlier tests in this file also call it
    const first = await POST(makeRequest(validBody));
    const second = await POST(makeRequest({ ...validBody, city: "DELHI, in" }));
    expect(first.status).toBe(200);
    expect(second.headers.get("X-Cache")).toBe("HIT");
    expect(vi.mocked(generateAdvice)).toHaveBeenCalledTimes(1);
  });

  it("does not cache fallback answers", async () => {
    vi.mocked(generateAdvice).mockRejectedValueOnce(new Error("model_down"));
    const fallback = await POST(makeRequest(validBody));
    expect((await fallback.json()).fallback).toBe(true);
    const retry = await POST(makeRequest(validBody));
    expect((await retry.json()).fallback).toBeUndefined();
  });
});
