import { afterEach, describe, expect, it } from "vitest";
import { generateAiPayload } from "../../apps/ai-service/src/server";
import { processAiTextJob } from "../../apps/worker-ai-text/src/worker";
import { prisma } from "../../packages/db/src/index";
import { closeRealtimePublisher } from "../../packages/realtime/src/index";

afterEach(async () => {
  delete process.env.AI_TEXT_DISABLED;
  await closeRealtimePublisher();
});

describe("stage 12 local text AI", () => {
  it("validates mocked local model responses and logs output", async () => {
    const result = await generateAiPayload(
      "generate-event",
      { ticker: "MOCK", narrative: "AI Mascots" },
      {
        modelCaller: async () =>
          JSON.stringify({
            type: "ai_token_event",
            title: "Mascot remix lands",
            description:
              "Players remix the mascot into a readable rally point.",
            severity: "medium",
            effects: { hype: 6, fatigue: 1 },
            choices: []
          })
      }
    );
    expect(result.status).toBe("mocked_model");
    expect(result.logId).toBeTruthy();
  });

  it("falls back safely when model output is invalid", async () => {
    const result = await generateAiPayload(
      "generate-event",
      { ticker: "BAD", narrative: "AI Mascots" },
      { modelCaller: async () => "not-json" }
    );
    expect(result.status).toBe("invalid_fallback");
    expect(result.error).toContain("valid JSON");
  });

  it("creates AI events without mutating token-owned game state", async () => {
    process.env.AI_TEXT_DISABLED = "true";
    const suffix = `stage12-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const season = await prisma.season.findFirstOrThrow({
      where: { status: "active" }
    });
    const user = await prisma.user.create({
      data: {
        email: `${suffix}@example.com`,
        username: suffix.replace(/[^a-z0-9_]/gi, "_"),
        status: "active"
      }
    });
    const token = await prisma.launchToken.create({
      data: {
        userId: user.id,
        seasonId: season.id,
        name: `Stage 12 ${suffix}`,
        ticker: `A${Date.now().toString().slice(-5)}`,
        narrative: "AI Mascots",
        narrativeSlug: "ai-mascots",
        status: "draft",
        hype: 20,
        trust: 50,
        simulatedMarketCap: 2500,
        simulatedHolders: 10,
        score: 3
      }
    });
    const before = await prisma.launchToken.findUniqueOrThrow({
      where: { id: token.id }
    });

    const result = await processAiTextJob({
      type: "generate-token-event",
      tokenId: token.id,
      idempotencyKey: `stage12-test-${Date.now()}`
    });

    const after = await prisma.launchToken.findUniqueOrThrow({
      where: { id: token.id }
    });
    expect(result.kind).toBe("token-event");
    expect(after.hype).toBe(before.hype);
    expect(after.trust).toBe(before.trust);
    expect(after.simulatedMarketCap).toBe(before.simulatedMarketCap);
    await expect(
      prisma.gameEvent.findFirstOrThrow({
        where: { tokenId: token.id, source: "ai" },
        orderBy: { createdAt: "desc" }
      })
    ).resolves.toMatchObject({ source: "ai" });
  });

  it("stores season commentary and NPC posts through safe fallback mode", async () => {
    process.env.AI_TEXT_DISABLED = "true";
    const season = await prisma.season.findFirstOrThrow({
      where: { status: "active" }
    });
    const token = await prisma.launchToken.findFirstOrThrow({
      where: { status: "live" }
    });
    const commentary = await processAiTextJob({
      type: "generate-season-commentary",
      seasonId: season.id
    });
    const npc = await processAiTextJob({
      type: "generate-npc-posts",
      tokenId: token.id
    });
    expect(commentary.kind).toBe("season-commentary");
    expect(npc.kind).toBe("npc-posts");
  });
});
