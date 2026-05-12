import { describe, expect, it } from "vitest";
import {
  fallbackAiEvent,
  fallbackFounderCoach,
  normalizeEffects,
  validateAiEventProposal,
  validateFounderCoach
} from "../packages/prompts/src/index";

describe("AI prompt schemas and fallbacks", () => {
  it("clamps effects and drops fields the game does not own", () => {
    expect(
      normalizeEffects({
        hype: 50,
        trust: "-20",
        treasury: 1000,
        execute_sql: 10
      })
    ).toEqual({ hype: 15, trust: -15 });
  });

  it("accepts valid event JSON and rejects unsafe financial claims", () => {
    const valid = validateAiEventProposal(
      JSON.stringify({
        type: "ai_token_event",
        title: "Meme remix wave",
        description: "The community turns one joke into a useful rally point.",
        severity: "medium",
        effects: { hype: 3, fatigue: 1 },
        choices: [{ label: "Share the clean version", effects: { trust: 1 } }]
      })
    );
    expect(valid.ok).toBe(true);

    const invalid = validateAiEventProposal(
      JSON.stringify({
        title: "Buy now",
        description: "Guaranteed profit is coming.",
        severity: "high",
        effects: { hype: 99 }
      })
    );
    expect(invalid.ok).toBe(false);
  });

  it("provides deterministic safe templates for disabled AI", () => {
    const event = fallbackAiEvent({
      ticker: "SAFE",
      narrative: "AI Mascots",
      stats: { fudPressure: 80 }
    });
    expect(event.effects.fudPressure).toBeLessThanOrEqual(0);
    expect(event.description).toContain("$SAFE");

    const coach = fallbackFounderCoach({
      stats: { botRisk: 70, fudPressure: 65, fatigue: 60 }
    });
    expect(validateFounderCoach(coach).ok).toBe(true);
    expect(coach.recommendedActionId).toBe("FIGHT_FUD");
  });
});
