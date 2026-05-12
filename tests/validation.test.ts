import { describe, expect, it } from "vitest";
import {
  founderProfileSchema,
  launchTokenSchema,
  tokenTickerSchema
} from "../packages/validation/src/index";

describe("stage 6 validation", () => {
  it("accepts beginner launch input", () => {
    expect(
      launchTokenSchema.parse({
        name: "Snack Reactor",
        ticker: "SNACK",
        description: "A fictional launch about snack-powered community energy.",
        narrativeSlug: "snack-finance",
        mascotPrompt: "a cheerful snack mascot with a launch helmet",
        founderStance: "trust-first",
        strategy: "balanced",
        riskLevel: "low"
      }).ticker
    ).toBe("SNACK");
  });

  it("rejects unsafe or malformed launch input", () => {
    expect(() => tokenTickerSchema.parse("bad ticker")).toThrow();
    expect(() =>
      launchTokenSchema.parse({
        name: "Guaranteed Return Coin",
        ticker: "REAL",
        description:
          "This is not acceptable because it promises guaranteed return.",
        narrativeSlug: "ai-mascots",
        mascotPrompt: "robot mascot",
        founderStance: "trust-first",
        strategy: "balanced",
        riskLevel: "low"
      })
    ).toThrow();
  });

  it("validates founder profile copy", () => {
    expect(
      founderProfileSchema.parse({
        displayName: "Rookie Founder",
        bio: "Learning the loop."
      }).displayName
    ).toBe("Rookie Founder");
    expect(() =>
      founderProfileSchema.parse({ displayName: "A", bio: "" })
    ).toThrow();
  });
});
