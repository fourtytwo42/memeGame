import { describe, expect, it } from "vitest";
import { clampStat } from "../packages/game-engine/src";
import { tokenTickerSchema } from "../packages/validation/src";

describe("stage 2 tooling", () => {
  it("clamps game stats", () => {
    expect(clampStat(-10)).toBe(0);
    expect(clampStat(42)).toBe(42);
    expect(clampStat(120)).toBe(100);
  });

  it("validates basic ticker shape", () => {
    expect(tokenTickerSchema.parse("MEME42")).toBe("MEME42");
  });
});
