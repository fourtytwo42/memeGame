import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import { closeRealtimePublisher } from "../../packages/realtime/src/index";
import {
  executeSupportActionForUser,
  SupportActionError
} from "../../apps/web/src/lib/server/support-actions";

async function supportPair(actionType: string) {
  const suffix = `${actionType.toLowerCase()}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" }
  });
  const [founder, user] = await Promise.all([
    prisma.user.create({
      data: {
        email: `support-founder-${suffix}@example.com`,
        username: `support_founder_${suffix.replace(/[^a-z0-9_]/gi, "_")}`,
        status: "active"
      }
    }),
    prisma.user.create({
      data: {
        email: `support-user-${suffix}@example.com`,
        username: `support_user_${suffix.replace(/[^a-z0-9_]/gi, "_")}`,
        status: "active",
        supportEnergy: 100
      }
    })
  ]);
  const token = await prisma.launchToken.create({
    data: {
      userId: founder.id,
      seasonId: season.id,
      name: `Support Target ${suffix}`,
      ticker: `S${Date.now().toString().slice(-5)}`,
      narrative: "AI Mascots",
      narrativeSlug: "ai-mascots",
      status: "live"
    }
  });
  return { token, user };
}

afterEach(async () => {
  await closeRealtimePublisher();
});

describe("stage 10 support actions", () => {
  it("lets a player support another live token with bounded visible effects", async () => {
    const { token, user } = await supportPair("SHARE_LAUNCH");
    const result = await executeSupportActionForUser({
      userId: user.id,
      tokenId: token.id,
      actionId: "SHARE_LAUNCH",
      nonce: `test-${Date.now()}`
    });

    expect(result.supportAction.actionType).toBe("SHARE_LAUNCH");
    expect(result.user.supportEnergy).toBeLessThan(100);
    expect(result.token.simulatedHolders).toBeGreaterThanOrEqual(
      token.simulatedHolders
    );
    expect(result.token.hype).toBeLessThanOrEqual(100);
    expect(result.token.botRisk).toBeLessThanOrEqual(100);

    const event = await prisma.gameEvent.findUniqueOrThrow({
      where: { id: result.event.id }
    });
    expect(event.type).toBe("support_action");
  });

  it("blocks self-support", async () => {
    const { token } = await supportPair("MAKE_MEME");
    await expect(
      executeSupportActionForUser({
        userId: token.userId,
        tokenId: token.id,
        actionId: "MAKE_MEME",
        nonce: `self-${Date.now()}`
      })
    ).rejects.toThrow(SupportActionError);
  });

  it("rate-limits concurrent duplicate support actions", async () => {
    const { token, user } = await supportPair("BOOST_TRUST");
    const attempts = await Promise.allSettled([
      executeSupportActionForUser({
        userId: user.id,
        tokenId: token.id,
        actionId: "BOOST_TRUST",
        nonce: `race-a-${Date.now()}`
      }),
      executeSupportActionForUser({
        userId: user.id,
        tokenId: token.id,
        actionId: "BOOST_TRUST",
        nonce: `race-b-${Date.now()}`
      })
    ]);

    expect(
      attempts.filter((attempt) => attempt.status === "fulfilled")
    ).toHaveLength(1);
    expect(
      attempts.filter((attempt) => attempt.status === "rejected")
    ).toHaveLength(1);
  });
});
