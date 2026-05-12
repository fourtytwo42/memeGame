import { describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import {
  ActionLoopError,
  executeActionForUser
} from "../../apps/web/src/lib/server/action-loop";
import {
  narrativeToEngineState,
  tokenToEngineState,
  tokenUpdateFromState
} from "../../apps/web/src/lib/game-state";
import { simulateTokenTick } from "@meme-foundry/game-engine";

async function createStage7Token(suffix: string) {
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" }
  });
  const narrative = await prisma.narrativeMeta.findFirstOrThrow({
    where: { seasonId: season.id },
    orderBy: { heat: "desc" }
  });
  const user = await prisma.user.upsert({
    where: { email: `stage7-${suffix}@example.com` },
    update: { username: `stage7_${suffix}`, name: `Stage7 ${suffix}` },
    create: {
      email: `stage7-${suffix}@example.com`,
      username: `stage7_${suffix}`,
      name: `Stage7 ${suffix}`
    }
  });
  await prisma.launchToken.deleteMany({ where: { userId: user.id } });
  const token = await prisma.launchToken.create({
    data: {
      userId: user.id,
      seasonId: season.id,
      name: `Stage7 ${suffix}`,
      ticker: `S7${suffix.toUpperCase().slice(0, 6)}`,
      narrative: narrative.name,
      narrativeSlug: narrative.slug,
      status: "live",
      launchedAt: new Date(),
      placeholderImageUrl: "/assets/game/tokens/default-token-placeholder.svg",
      energy: 100
    }
  });
  return { narrative, token, user };
}

describe("stage 7 action loop persistence", () => {
  it("executes a server-owned action and writes action, tick, event, resources", async () => {
    const { token, user } = await createStage7Token("action");
    const result = await executeActionForUser({
      userId: user.id,
      tokenId: token.id,
      actionId: "POST_MEME",
      nonce: "n1"
    });
    const updated = await prisma.launchToken.findUniqueOrThrow({
      where: { id: token.id },
      include: { actions: true, ticks: true, events: true }
    });

    expect(result.action.id).toBe("POST_MEME");
    expect(updated.energy).toBe(95);
    expect(updated.hype).toBeGreaterThan(token.hype);
    expect(updated.actions).toHaveLength(1);
    expect(updated.ticks).toHaveLength(1);
    expect(updated.events.some((event) => event.type === "player_action")).toBe(
      true
    );
  });

  it("blocks cooldown duplicates and high-risk actions without confirmation", async () => {
    const { token, user } = await createStage7Token("guards");
    await executeActionForUser({
      userId: user.id,
      tokenId: token.id,
      actionId: "POST_MEME",
      nonce: "n1"
    });
    await expect(
      executeActionForUser({
        userId: user.id,
        tokenId: token.id,
        actionId: "POST_MEME",
        nonce: "n2"
      })
    ).rejects.toThrow(ActionLoopError);
    await expect(
      executeActionForUser({
        userId: user.id,
        tokenId: token.id,
        actionId: "COORDINATE_RAID",
        nonce: "n3"
      })
    ).rejects.toThrow("Confirm the high-risk warning");
  });
});

describe("stage 7 worker tick", () => {
  it("persists a simulation tick snapshot and can change terminal status", async () => {
    const { narrative, token } = await createStage7Token("tick");
    const tick = simulateTokenTick({
      token: tokenToEngineState({
        ...token,
        simulatedMarketCap: 70000,
        simulatedHolders: 1100,
        trust: 85,
        communityStrength: 70,
        fatigue: 20,
        botRisk: 10
      }),
      narrative: narrativeToEngineState(narrative),
      seed: "stage7-worker"
    });
    await prisma.$transaction([
      prisma.launchToken.update({
        where: { id: token.id },
        data: tokenUpdateFromState(tick.after)
      }),
      prisma.tokenTick.create({
        data: {
          tokenId: token.id,
          price: tick.after.simulatedPrice,
          marketCap: tick.after.simulatedMarketCap,
          volume: tick.after.simulatedVolume,
          holders: tick.after.simulatedHolders,
          hype: tick.after.hype,
          trust: tick.after.trust,
          score: tick.after.score
        }
      })
    ]);
    const updated = await prisma.launchToken.findUniqueOrThrow({
      where: { id: token.id },
      include: { ticks: true }
    });

    expect(updated.ticks).toHaveLength(1);
    expect(["live", "graduated"]).toContain(updated.status);
  });
});
