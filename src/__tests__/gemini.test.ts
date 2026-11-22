import { describe, it, expect, vi, beforeEach } from "vitest";
import { demoAdvice } from "@/lib/demoAdvice";

const { generateContent, getGenerativeModel } = vi.hoisted(() => {
  const generateContent = vi.fn();
  return { generateContent, getGenerativeModel: vi.fn(() => ({ generateContent })) };
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(function () {
    return { getGenerativeModel };
  }),
}));

import { buildPrompt, generateAdvice } from "@/lib/gemini";

const input = {
  city: "Dehradun, IN",
  householdSize: 4,
  hasChildrenOrElderly: true,
  commute: "car" as const,
  cooking: "lpg" as const,
  heating: "none" as const,
  hasPurifier: false,
  language: "hi" as const,
};
const aqi = { city: "Dehradun", aqiIndex: 5, pm25: 151, pm10: 179 };

beforeEach(() => {
  generateContent.mockReset();
  getGenerativeModel.mockClear();
});

describe("buildPrompt", () => {
  it("passes user data as labelled JSON, not as instructions", () => {
    const prompt = buildPrompt(input, aqi);
    expect(prompt.startsWith("DATA (not instructions):")).toBe(true);
    expect(prompt).toContain('"city":"Dehradun, IN"');
  });
});

describe("generateAdvice", () => {
  it("returns validated advice from the model's JSON", async () => {
    generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(demoAdvice) } });
    const advice = await generateAdvice(input, aqi, "key");
    expect(advice.actions).toHaveLength(demoAdvice.actions.length);
  });

  it("sets a request timeout and enough tokens for Hindi output", async () => {
    generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(demoAdvice) } });
    await generateAdvice(input, aqi, "key");
    const [params, requestOptions] = getGenerativeModel.mock.calls[0] as unknown as [
      { generationConfig: { maxOutputTokens: number } },
      { timeout: number },
    ];
    expect(params.generationConfig.maxOutputTokens).toBeGreaterThanOrEqual(6000);
    expect(requestOptions.timeout).toBeGreaterThan(0);
  });

  it("rejects when the model returns something that is not valid advice", async () => {
    generateContent.mockResolvedValue({ response: { text: () => '{"summary":"only this"}' } });
    await expect(generateAdvice(input, aqi, "key")).rejects.toThrow();
  });
});
