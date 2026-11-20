import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAqi } from "@/lib/aqi";

const jsonResponse = (data: unknown, ok = true) =>
  ({ ok, json: async () => data }) as Response;

const airPayload = {
  list: [{ main: { aqi: 4 }, components: { pm2_5: 95.4, pm10: 160.2 } }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAqi", () => {
  it("returns parsed air quality for a valid city", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { name: "Dehradun", state: "Uttarakhand", country: "IN", lat: 30.3, lon: 78.0 },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse(airPayload));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAqi("Dehradun, IN", "test-key");

    expect(result).toEqual({
      city: "Dehradun",
      state: "Uttarakhand",
      country: "IN",
      aqiIndex: 4,
      pm25: 95.4,
      pm10: 160.2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("lat=30.3");
  });

  it("prefers an exact name match over the first result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { name: "Dehradun Cantt", country: "IN", lat: 1, lon: 1 },
          { name: "Dehradun", country: "IN", lat: 2, lon: 2 },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse(airPayload));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAqi("Dehradun, IN", "test-key");

    expect(result.city).toBe("Dehradun");
    expect(String(fetchMock.mock.calls[1][0])).toContain("lat=2");
  });

  it("throws city_not_found when geocoding returns nothing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse([])));
    await expect(fetchAqi("Nowhereville", "test-key")).rejects.toThrow("city_not_found");
  });

  it("throws geo_failed when the geocoding request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(null, false)));
    await expect(fetchAqi("Delhi, IN", "test-key")).rejects.toThrow("geo_failed");
  });

  it("throws air_failed when the air pollution request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ name: "Delhi", country: "IN", lat: 28.6, lon: 77.2 }]))
      .mockResolvedValueOnce(jsonResponse(null, false));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchAqi("Delhi, IN", "test-key")).rejects.toThrow("air_failed");
  });

  it("rejects when the air data is missing or malformed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ name: "Delhi", country: "IN", lat: 28.6, lon: 77.2 }]))
      .mockResolvedValueOnce(jsonResponse({ list: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchAqi("Delhi, IN", "test-key")).rejects.toThrow();
  });
});