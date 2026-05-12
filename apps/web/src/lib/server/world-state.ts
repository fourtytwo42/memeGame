import { prisma } from "@meme-foundry/db";
import { publishRealtimeEvent } from "@meme-foundry/realtime";
import { calculateScore, updateNarrativeMeta } from "@meme-foundry/game-engine";
import { tokenToEngineState } from "../game-state";

export type LeaderboardCategory = "score" | "market" | "holders" | "graduated";

export function narrativeOpportunity(input: {
  heat: number;
  saturation: number;
  fatigue: number;
}) {
  if (input.fatigue >= 65) return "Cooling off";
  if (input.heat >= 72 && input.saturation >= 60) return "Hot but crowded";
  if (input.heat >= 72) return "Good opportunity";
  if (input.saturation >= 70) return "Crowded";
  if (input.heat <= 45 && input.saturation <= 25) return "Undiscovered";
  return "Steady trend";
}

export async function refreshNarrativesAndLeaderboards(seasonId: string) {
  const [narratives, tokens] = await Promise.all([
    prisma.narrativeMeta.findMany({ where: { seasonId } }),
    prisma.launchToken.findMany({ where: { seasonId } })
  ]);

  for (const narrative of narratives) {
    const narrativeTokens = tokens.filter(
      (token) => token.narrativeSlug === narrative.slug
    );
    const activeLaunches = narrativeTokens.filter(
      (token) => token.status === "live"
    ).length;
    const averageHype = narrativeTokens.length
      ? narrativeTokens.reduce((sum, token) => sum + token.hype, 0) /
        narrativeTokens.length
      : 0;
    const recentGraduations = narrativeTokens.filter(
      (token) => token.status === "graduated"
    ).length;
    const updated = updateNarrativeMeta({
      narrative,
      activeLaunches,
      averageHype,
      recentGraduations,
      minutesElapsed: 5
    });
    const savedNarrative = await prisma.narrativeMeta.update({
      where: { id: narrative.id },
      data: {
        activeLaunches: updated.activeLaunches,
        heat: updated.heat,
        saturation: updated.saturation,
        fatigue: updated.fatigue
      }
    });
    await publishRealtimeEvent({
      type: "NARRATIVE_UPDATE",
      seasonId,
      narrativeId: savedNarrative.id,
      slug: savedNarrative.slug,
      heat: savedNarrative.heat,
      saturation: savedNarrative.saturation,
      fatigue: savedNarrative.fatigue,
      activeLaunches: savedNarrative.activeLaunches
    });
  }

  for (const token of tokens) {
    const score = calculateScore(tokenToEngineState(token));
    if (score !== token.score) {
      await prisma.launchToken.updateMany({
        where: { id: token.id },
        data: { score }
      });
    }
  }

  await prisma.scoreSnapshot.deleteMany({ where: { seasonId } });
  const refreshed = await prisma.launchToken.findMany({ where: { seasonId } });
  const categories: Array<{
    category: LeaderboardCategory;
    scoreFor: (token: (typeof refreshed)[number]) => number;
  }> = [
    { category: "score", scoreFor: (token) => token.score },
    { category: "market", scoreFor: (token) => token.simulatedMarketCap },
    { category: "holders", scoreFor: (token) => token.simulatedHolders },
    {
      category: "graduated",
      scoreFor: (token) => (token.status === "graduated" ? token.score : 0)
    }
  ];

  for (const category of categories) {
    const ranked = [...refreshed]
      .map((token) => ({ token, score: category.scoreFor(token) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
    await prisma.scoreSnapshot.createMany({
      data: ranked.map((item, index) => ({
        seasonId,
        entityType: "token",
        entityId: item.token.id,
        category: category.category,
        score: item.score,
        rank: index + 1
      }))
    });
  }

  await Promise.all(
    categories.map((category) =>
      publishRealtimeEvent({
        type: "LEADERBOARD_UPDATE",
        seasonId,
        category: category.category,
        updatedAt: new Date().toISOString()
      })
    )
  );
  return { narratives: narratives.length, tokens: tokens.length };
}

export async function activeSeasonOrThrow() {
  return prisma.season.findFirstOrThrow({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
}
