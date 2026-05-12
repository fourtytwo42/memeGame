import { prisma } from "../packages/db/src/index";
import {
  activeSeasonOrThrow,
  refreshNarrativesAndLeaderboards
} from "../apps/web/src/lib/server/world-state";

async function main() {
  const seasonArg = process.argv.find((arg) => arg.startsWith("--season="));
  const season = seasonArg
    ? await prisma.season.findUniqueOrThrow({
        where: { slug: seasonArg.replace("--season=", "") }
      })
    : await activeSeasonOrThrow();
  const started = performance.now();
  const result = await refreshNarrativesAndLeaderboards(season.id);
  console.log(
    JSON.stringify({
      season: season.slug,
      ...result,
      durationMs: Math.round(performance.now() - started)
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
