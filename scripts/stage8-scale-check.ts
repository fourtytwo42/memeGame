import { prisma } from "../packages/db/src/index";
import { refreshNarrativesAndLeaderboards } from "../apps/web/src/lib/server/world-state";

async function main() {
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const [users, tokens, ticks, narratives] = await Promise.all([
    prisma.user.count(),
    prisma.launchToken.count({ where: { seasonId: season.id } }),
    prisma.tokenTick.count({ where: { token: { seasonId: season.id } } }),
    prisma.narrativeMeta.count({ where: { seasonId: season.id } })
  ]);
  const started = performance.now();
  await refreshNarrativesAndLeaderboards(season.id);
  const leaderboard = await prisma.scoreSnapshot.findMany({
    where: { seasonId: season.id, category: "score" },
    orderBy: { rank: "asc" },
    take: 50
  });
  const durationMs = Math.round(performance.now() - started);
  if (leaderboard.length === 0)
    throw new Error("No leaderboard rows refreshed.");
  if (durationMs > 15000) {
    throw new Error(`Stage 8 refresh too slow: ${durationMs}ms`);
  }
  console.log(
    JSON.stringify({
      users,
      tokens,
      ticks,
      narratives,
      leaderboard: leaderboard.length,
      durationMs
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
