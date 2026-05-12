import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import { closeRealtimePublisher } from "../../packages/realtime/src/index";
import {
  executeSupportActionForUser,
  SupportActionError
} from "../../apps/web/src/lib/server/support-actions";

async function supportPair(actionType: string) {
  const token = await prisma.launchToken.findFirstOrThrow({
    where: { status: "live" },
    orderBy: { updatedAt: "desc" }
  });
  const user = await prisma.user.findFirstOrThrow({
    where: { id: { not: token.userId }, status: "active" }
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { supportEnergy: 100 }
  });
  await prisma.supportAction.deleteMany({
    where: { userId: user.id, tokenId: token.id, actionType }
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
    const token = await prisma.launchToken.findFirstOrThrow({
      where: { status: "live" }
    });
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
