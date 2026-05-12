import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import { closeRealtimePublisher } from "../../packages/realtime/src/index";
import {
  createCrewForUser,
  CrewActionError,
  executeCrewActionForUser,
  featureTokenForCrew,
  joinCrewForUser
} from "../../apps/web/src/lib/server/crew-actions";

async function crewFixture(label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const season =
    (await prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    })) ??
    (await prisma.season.create({
      data: {
        name: "Stage 11 Fallback Season",
        slug: `stage11-fallback-${suffix}`,
        status: "active",
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 86_400_000),
        narratives: {
          create: Array.from({ length: 8 }, (_, index) => ({
            name: `Stage 11 Narrative ${index + 1}`,
            slug: `stage11-narrative-${index + 1}`,
            heat: 50 + index
          }))
        }
      }
    }));
  const [owner, member, outsider] = await Promise.all(
    ["owner", "member", "outsider"].map((role) =>
      prisma.user.create({
        data: {
          email: `${role}-${suffix}@example.com`,
          username: `${role}_${suffix.replace(/[^a-z0-9_]/gi, "_")}`,
          status: "active"
        }
      })
    )
  );
  const token = await prisma.launchToken.create({
    data: {
      userId: owner.id,
      seasonId: season.id,
      name: `Crew Target ${suffix}`,
      ticker: `C${Date.now().toString().slice(-6)}`,
      description: "Stage 11 crew support target.",
      narrative: "Stage 11",
      narrativeSlug: "stage-11",
      status: "live",
      simulatedMarketCap: 2000,
      simulatedHolders: 12,
      hype: 20,
      trust: 50,
      communityStrength: 15,
      score: 25,
      launchedAt: new Date()
    }
  });
  return { member, outsider, owner, season, suffix, token };
}

afterEach(async () => {
  await closeRealtimePublisher();
});

describe("stage 11 crews", () => {
  it("creates crews with owner membership and lets players join", async () => {
    const { member, owner, suffix } = await crewFixture("create");
    const crew = await createCrewForUser({
      userId: owner.id,
      name: `Stage 11 Crew ${suffix}`,
      description: "Coordinates tests.",
      tagline: "Test hard, support harder."
    });
    expect(crew.members).toHaveLength(1);
    expect(crew.members[0]?.role).toBe("owner");

    const joined = await joinCrewForUser({
      userId: member.id,
      crewId: crew.id
    });
    expect(joined.role).toBe("member");

    const memberCount = await prisma.crewMember.count({
      where: { crewId: crew.id }
    });
    expect(memberCount).toBe(2);
  });

  it("enforces crew permissions for featured launches", async () => {
    const { member, outsider, owner, suffix, token } =
      await crewFixture("permissions");
    const crew = await createCrewForUser({
      userId: owner.id,
      name: `Stage 11 Permissions ${suffix}`
    });
    await expect(
      featureTokenForCrew({
        userId: outsider.id,
        crewId: crew.id,
        tokenId: token.id
      })
    ).rejects.toThrow(CrewActionError);

    await joinCrewForUser({ userId: member.id, crewId: crew.id });
    await expect(
      featureTokenForCrew({
        userId: member.id,
        crewId: crew.id,
        tokenId: token.id
      })
    ).rejects.toThrow(CrewActionError);

    const updated = await featureTokenForCrew({
      userId: owner.id,
      crewId: crew.id,
      tokenId: token.id
    });
    expect(updated.featuredTokenId).toBe(token.id);
  });

  it("applies bounded crew support effects and cooldowns", async () => {
    const { member, owner, suffix, token } = await crewFixture("effects");
    const crew = await createCrewForUser({
      userId: owner.id,
      name: `Stage 11 Effects ${suffix}`
    });
    await joinCrewForUser({ userId: member.id, crewId: crew.id });
    await featureTokenForCrew({
      userId: owner.id,
      crewId: crew.id,
      tokenId: token.id
    });

    const result = await executeCrewActionForUser({
      userId: member.id,
      crewId: crew.id,
      actionId: "SIGNAL_BOOST",
      nonce: `signal-${Date.now()}`
    });

    expect(result.crew.score).toBeGreaterThan(crew.score);
    expect(result.crew.energy).toBeLessThan(crew.energy);
    expect(result.crew.resources).toBeLessThan(crew.resources);
    expect(result.token.hype).toBeGreaterThanOrEqual(token.hype);
    expect(result.token.hype).toBeLessThanOrEqual(100);
    expect(result.crewAction.idempotencyKey).toContain("SIGNAL_BOOST");

    const event = await prisma.gameEvent.findUniqueOrThrow({
      where: { id: result.event.id }
    });
    expect(event.type).toBe("crew_action");

    await expect(
      executeCrewActionForUser({
        userId: member.id,
        crewId: crew.id,
        actionId: "SIGNAL_BOOST",
        nonce: `signal-duplicate-${Date.now()}`
      })
    ).rejects.toThrow(CrewActionError);
  });
});
