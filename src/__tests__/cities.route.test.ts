import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cities/route";
import { _resetForTests } from "@/lib/rateLimit";

function makeRequest(q?: string) {
  const url = `http://localhost/api/cities${q === undefined ? "" : `?q=${encodeURIComponent(q)}`}`;
  return new NextRequest(url, { headers: { "x-forwarded-for": "9.9.9.9" } });
}

const geoOk = (items: unknown[]) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(items), { status: 200 }));

beforeEach(() => {
  _resetForTests();
  process.env.OPENWEATHER_API_KEY = "test-weather-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/cities", () => {
  it("rejects queries that are too short", async () => {
    const res = await GET(makeRequest("d"));
    expect(res.status).toBe(400);
    expect((await res.json()).suggestions).toEqual([]);
  });

  it("rejects queries with forbidden characters", async () => {
    const res = await GET(makeRequest("Delhi{}"));
    expect(res.status).toBe(400);
  });

  it("returns 500 when the weather key is missing", async () => {
    delete process.env.OPENWEATHER_API_KEY;
    const res = await GET(makeRequest("Delhi"));
    expect(res.status).toBe(500);
  });

  it("maps results to label/value pairs and removes duplicates", async () => {
    vi.stubGlobal(
      "fetch",
      geoOk([
        { name: "Dehradun", state: "Uttarakhand", country: "IN" },
        { name: "Dehradun", state: "Uttarakhand", country: "IN" },
        { name: "Dehra", country: "IN" },
        { state: "No name", country: "IN" },
      ]),
    );
    const res = await GET(makeRequest("Dehradun"));
    expect(res.status).toBe(200);
    expect((await res.json()).suggestions).toEqual([
      { label: "Dehradun, Uttarakhand, IN", value: "Dehradun, IN" },
      { label: "Dehra, IN", value: "Dehra, IN" },
    ]);
  });

  it("returns 502 with an empty list when the upstream call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    const res = await GET(makeRequest("Delhi"));
    expect(res.status).toBe(502);
    expect((await res.json()).suggestions).toEqual([]);
  });

  it("rate limits after a burst of 20 requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]")));
    for (let i = 0; i < 20; i++) expect((await GET(makeRequest("Delhi"))).status).toBe(200);
    const blocked = await GET(makeRequest("Delhi"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
