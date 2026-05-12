import { describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import {
  narrativeOpportunity,
  refreshNarrativesAndLeaderboards
} from "../../apps/web/src/lib/server/world-state";

describe("stage 8 world state", () => {
  it("labels narrative opportunity in plain language", () => {
    expect(
      narrativeOpportunity({ heat: 82, saturation: 20, fatigue: 10 })
    ).toBe("Good opportunity");
    expect(
      narrativeOpportunity({ heat: 82, saturation: 72, fatigue: 10 })
    ).toBe("Hot but crowded");
    expect(
      narrativeOpportunity({ heat: 55, saturation: 20, fatigue: 70 })
    ).toBe("Cooling off");
    expect(
      narrativeOpportunity({ heat: 35, saturation: 10, fatigue: 10 })
    ).toBe("Undiscovered");
  });

  it("refreshes narratives and season-scoped leaderboard snapshots", async () => {
    const season = await prisma.season.findFirstOrThrow({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    });
    const result = await refreshNarrativesAndLeaderboards(season.id);
    const [narratives, scoreRows, marketRows] = await Promise.all([
      prisma.narrativeMeta.findMany({ where: { seasonId: season.id } }),
      prisma.scoreSnapshot.findMany({
        where: { seasonId: season.id, category: "score" },
        orderBy: { rank: "asc" },
        take: 5
      }),
      prisma.scoreSnapshot.findMany({
        where: { seasonId: season.id, category: "market" },
        orderBy: { rank: "asc" },
        take: 5
      })
    ]);

    expect(result.narratives).toBeGreaterThanOrEqual(8);
    expect(narratives.some((narrative) => narrative.activeLaunches > 0)).toBe(
      true
    );
    expect(scoreRows.length).toBeGreaterThan(0);
    expect(marketRows.length).toBeGreaterThan(0);
    expect(scoreRows[0]?.rank).toBe(1);
  });
});
