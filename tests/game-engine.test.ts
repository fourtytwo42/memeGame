import { describe, expect, it } from "vitest";
import {
  ACTION_CATALOG,
  applyAction,
  calculateAttention,
  calculateScore,
  calculateSellPressure,
  createDefaultTokenState,
  getFailureState,
  getGraduationType,
  simulateBulk,
  simulateTokenTick,
  updateNarrativeMeta
} from "../packages/game-engine/src/index";

describe("game engine actions", () => {
  it("uses server-side action catalog effects", () => {
    const token = createDefaultTokenState({ hype: 10, memeQuality: 25 });
    const result = applyAction({
      token,
      actionId: "POST_MEME",
      actorId: "user-1",
      nonce: "n1"
    });

    expect(result.after.hype).toBe(18);
    expect(result.after.memeQuality).toBe(28);
    expect(result.after.fatigue).toBe(2);
    expect(result.idempotencyKey).toBe("token-default:user-1:POST_MEME:n1");
  });

  it("clamps reckless action effects", () => {
    const token = createDefaultTokenState({
      hype: 95,
      trust: 4,
      fudPressure: 95
    });
    const result = applyAction({
      token,
      actionId: "FAKE_BIG_ANNOUNCEMENT",
      actorId: "user-1",
      nonce: "n2"
    });

    expect(result.after.hype).toBe(100);
    expect(result.after.trust).toBe(0);
    expect(result.after.fudPressure).toBe(100);
  });

  it("catalog groups actions by player intent", () => {
    const intents = new Set(
      Object.values(ACTION_CATALOG).map((action) => action.intent)
    );
    expect(intents).toEqual(
      new Set([
        "Grow Attention",
        "Build Trust",
        "Strengthen Community",
        "Fight Trouble",
        "High Risk Plays"
      ])
    );
  });
});

describe("game engine formulas", () => {
  it("calculates attention and sell pressure from PRD weights", () => {
    const token = createDefaultTokenState({
      hype: 50,
      memeQuality: 50,
      narrativeStrength: 50,
      communityStrength: 50,
      whaleInterest: 50,
      fatigue: 20,
      fudPressure: 20,
      botRisk: 20,
      trust: 40
    });

    expect(calculateAttention(token)).toBe(50);
    expect(calculateSellPressure(token)).toBe(17.5);
  });

  it("simulates deterministic ticks", () => {
    const token = createDefaultTokenState({
      hype: 70,
      trust: 60,
      communityStrength: 40
    });
    const first = simulateTokenTick({ token, seed: "same-seed" });
    const second = simulateTokenTick({ token, seed: "same-seed" });

    expect(first.after).toEqual(second.after);
    expect(first.priceChangePercent).toBeGreaterThanOrEqual(-0.35);
    expect(first.priceChangePercent).toBeLessThanOrEqual(0.45);
  });

  it("keeps stat and market bounds under hostile inputs", () => {
    const token = createDefaultTokenState({
      hype: 999,
      trust: -100,
      fatigue: 999,
      botRisk: 999,
      fudPressure: 999,
      simulatedPrice: -1,
      simulatedMarketCap: -1,
      simulatedHolders: -10
    });
    const tick = simulateTokenTick({ token, seed: "bounds" });

    for (const value of [
      tick.after.hype,
      tick.after.trust,
      tick.after.fatigue,
      tick.after.botRisk,
      tick.after.fudPressure
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(tick.after.simulatedPrice).toBeGreaterThanOrEqual(0.00000001);
    expect(tick.after.simulatedMarketCap).toBeGreaterThanOrEqual(0);
    expect(tick.after.simulatedHolders).toBeGreaterThanOrEqual(0);
  });
});

describe("graduation and failure", () => {
  it("detects clean graduation", () => {
    const token = createDefaultTokenState({
      simulatedMarketCap: 70000,
      simulatedHolders: 1100,
      trust: 85,
      communityStrength: 70,
      fatigue: 20,
      botRisk: 10
    });

    expect(getGraduationType(token)).toBe("Clean Graduation");
  });

  it("detects dead and rugged states", () => {
    expect(
      getFailureState(
        createDefaultTokenState({
          simulatedMarketCap: 100,
          hype: 2,
          communityStrength: 5,
          launchedAtMinutesAgo: 45
        })
      )
    ).toBe("dead");
    expect(
      getFailureState(createDefaultTokenState({ trust: 3, fudPressure: 90 }))
    ).toBe("rugged");
  });

  it("scores successful tokens above risky weak tokens", () => {
    const strong = createDefaultTokenState({
      peakMarketCap: 100000,
      simulatedHolders: 1500,
      trust: 80,
      communityStrength: 80
    });
    const risky = createDefaultTokenState({
      peakMarketCap: 100000,
      simulatedHolders: 1500,
      trust: 20,
      botRisk: 95,
      fudPressure: 90
    });

    expect(calculateScore(strong)).toBeGreaterThan(calculateScore(risky));
  });
});

describe("narratives and bulk simulation", () => {
  it("updates narrative heat, saturation, and fatigue", () => {
    const narrative = updateNarrativeMeta({
      narrative: {
        slug: "ai",
        heat: 50,
        saturation: 0,
        fatigue: 5,
        activeLaunches: 0
      },
      activeLaunches: 10,
      recentGraduations: 2,
      averageHype: 70,
      minutesElapsed: 5
    });

    expect(narrative.saturation).toBe(40);
    expect(narrative.heat).toBeGreaterThan(50);
    expect(narrative.fatigue).toBeGreaterThan(5);
  });

  it("bulk simulation covers thousands of token ticks", () => {
    const tokens = Array.from({ length: 250 }, (_, index) =>
      createDefaultTokenState({
        id: `token-${index}`,
        hype: index % 100,
        narrativeSlug: "ai"
      })
    );
    const result = simulateBulk({
      tokens,
      narratives: {
        ai: {
          slug: "ai",
          heat: 70,
          saturation: 20,
          fatigue: 10,
          activeLaunches: 250
        }
      },
      ticks: 12,
      seed: "bulk"
    });

    expect(result.tickResults).toHaveLength(3000);
    expect(result.tokens).toHaveLength(250);
  });
});
