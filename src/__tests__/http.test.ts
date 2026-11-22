import { describe, it, expect } from "vitest";
import { readJson } from "@/lib/http";

describe("readJson", () => {
  it("parses a valid JSON body", async () => {
    expect(await readJson<{ a: number }>(new Response('{"a":1}'))).toEqual({ a: 1 });
  });
  it("returns null for an empty body instead of throwing", async () => {
    expect(await readJson(new Response(""))).toBeNull();
  });
  it("returns null for a body that is not JSON", async () => {
    expect(await readJson(new Response("<html>oops</html>"))).toBeNull();
  });
});
