import { hash } from "bcryptjs";
import { prisma } from "../packages/db/src/index";

const TARGETS = {
  users: Number(process.env.SCALE_USERS ?? 1000),
  tokens: Number(process.env.SCALE_TOKENS ?? 2500),
  crews: Number(process.env.SCALE_CREWS ?? 25),
  narratives: Number(process.env.SCALE_NARRATIVES ?? 8),
  ticks: Number(process.env.SCALE_TICKS ?? 100000)
};

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    chunks.push(items.slice(index, index + size));
  return chunks;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    `[seed:scale] target ${JSON.stringify(TARGETS)}${dryRun ? " dry-run" : ""}`
  );
  if (dryRun) return;

  const season = await prisma.season.upsert({
    where: { slug: "scale-season" },
    update: { status: "active" },
    create: {
      name: "Scale Season",
      slug: "scale-season",
      status: "active",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)
    }
  });

  await prisma.narrativeMeta.createMany({
    data: Array.from({ length: TARGETS.narratives }, (_, index) => ({
      seasonId: season.id,
      name: `Scale Narrative ${index + 1}`,
      slug: `scale-narrative-${index + 1}`,
      heat: 45 + (index % 35),
      saturation: index % 40,
      fatigue: index % 25,
      memePotential: 50 + (index % 30)
    })),
    skipDuplicates: true
  });

  const passwordHash = await hash("MemeFoundry!123", 10);
  for (const batch of chunk(
    Array.from({ length: TARGETS.users }, (_, index) => ({
      id: `scale-user-${index + 1}`,
      email: `scale-user-${index + 1}@example.com`,
      username: `scale_user_${index + 1}`,
      name: `Scale User ${index + 1}`,
      passwordHash
    })),
    500
  )) {
    await prisma.user.createMany({ data: batch, skipDuplicates: true });
  }

  await prisma.founderProfile.createMany({
    data: Array.from({ length: TARGETS.users }, (_, index) => ({
      userId: `scale-user-${index + 1}`,
      displayName: `Scale Founder ${index + 1}`
    })),
    skipDuplicates: true
  });

  await prisma.crew.createMany({
    data: Array.from({ length: TARGETS.crews }, (_, index) => ({
      id: `scale-crew-${index + 1}`,
      name: `Scale Crew ${index + 1}`,
      slug: `scale-crew-${index + 1}`,
      seasonId: season.id,
      score: index * 10
    })),
    skipDuplicates: true
  });

  for (const batch of chunk(
    Array.from({ length: TARGETS.tokens }, (_, index) => ({
      id: `scale-token-${index + 1}`,
      userId: `scale-user-${(index % TARGETS.users) + 1}`,
      seasonId: season.id,
      crewId: `scale-crew-${(index % TARGETS.crews) + 1}`,
      name: `Scale Token ${index + 1}`,
      ticker: `SC${index + 1}`,
      narrative: `Scale Narrative ${(index % TARGETS.narratives) + 1}`,
      narrativeSlug: `scale-narrative-${(index % TARGETS.narratives) + 1}`,
      status:
        index % 20 === 0 ? "graduated" : index % 13 === 0 ? "dead" : "live",
      simulatedMarketCap: 1000 + index * 17,
      simulatedHolders: index % 500,
      simulatedVolume: index * 3,
      hype: index % 100,
      trust: 30 + (index % 60),
      memeQuality: index % 100,
      narrativeStrength: index % 100,
      communityStrength: index % 100,
      score: index % 10000,
      launchedAt: new Date()
    })),
    500
  )) {
    await prisma.launchToken.createMany({ data: batch, skipDuplicates: true });
  }

  for (const batch of chunk(
    Array.from({ length: TARGETS.ticks }, (_, index) => {
      const tokenIndex = (index % TARGETS.tokens) + 1;
      return {
        id: `scale-tick-${index + 1}`,
        tokenId: `scale-token-${tokenIndex}`,
        price: 0.000001 * (1 + (index % 200)),
        marketCap: 1000 + index * 2,
        volume: 200 + (index % 1000),
        holders: index % 5000,
        hype: index % 100,
        trust: 20 + (index % 80),
        score: index % 10000,
        createdAt: new Date(Date.now() - (TARGETS.ticks - index) * 1000)
      };
    }),
    1000
  )) {
    await prisma.tokenTick.createMany({ data: batch, skipDuplicates: true });
  }

  console.log("[seed:scale] complete");
}

main().finally(async () => prisma.$disconnect());
