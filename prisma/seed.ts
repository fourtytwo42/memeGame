import { hash } from "bcryptjs";
import { prisma, roleForEmail } from "../packages/db/src/index";

const PASSWORD = "MemeFoundry!123";
const narratives = [
  ["AI Mascots", "ai-mascots", 82, 24, 12, 8, 2, 86],
  ["Cozy Chaos", "cozy-chaos", 66, 18, 8, 1, 5, 72],
  ["Mischief Markets", "mischief-markets", 74, 35, 22, 7, -4, 80],
  ["Retro Internet", "retro-internet", 58, 12, 6, 0, 8, 68],
  ["Tiny Utilities", "tiny-utilities", 61, 15, 9, 2, 12, 62],
  ["Space Pets", "space-pets", 70, 20, 11, 3, 6, 76],
  ["Degen Fitness", "degen-fitness", 64, 28, 16, 6, -2, 71],
  ["Snack Finance", "snack-finance", 69, 31, 18, 5, 1, 78]
] as const;

async function upsertUser(input: {
  email: string;
  username: string;
  name: string;
  role?: string;
}) {
  const passwordHash = await hash(PASSWORD, 12);
  const role = input.role ?? roleForEmail(input.email);
  return prisma.user.upsert({
    where: { email: input.email },
    update: { username: input.username, name: input.name, role, passwordHash },
    create: {
      email: input.email,
      username: input.username,
      name: input.name,
      role,
      passwordHash
    }
  });
}

async function main() {
  const now = new Date();
  const season = await prisma.season.upsert({
    where: { slug: "genesis-season" },
    update: { status: "active" },
    create: {
      name: "Genesis Season",
      slug: "genesis-season",
      status: "active",
      startsAt: now,
      endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
      rulesJson: {
        graduationMarketCap: 1000000,
        singleVmRelease: true,
        noRealTrading: true
      }
    }
  });

  for (const [
    name,
    slug,
    heat,
    saturation,
    fatigue,
    whale,
    trust,
    meme
  ] of narratives) {
    await prisma.narrativeMeta.upsert({
      where: { seasonId_slug: { seasonId: season.id, slug } },
      update: {
        heat,
        saturation,
        fatigue,
        whaleInterestModifier: whale,
        trustModifier: trust,
        memePotential: meme
      },
      create: {
        seasonId: season.id,
        name,
        slug,
        heat,
        saturation,
        fatigue,
        whaleInterestModifier: whale,
        trustModifier: trust,
        memePotential: meme
      }
    });
  }

  const founder = await upsertUser({
    email: "founder@example.com",
    username: "founder",
    name: "Founding Player"
  });
  const supporter = await upsertUser({
    email: "supporter@example.com",
    username: "supporter",
    name: "Support Player"
  });
  const crewUser = await upsertUser({
    email: "crew@example.com",
    username: "crew_member",
    name: "Crew Player"
  });
  const admin = await upsertUser({
    email: "spiderman.1983@gmail.com",
    username: "fourtytwo42",
    name: "Admin Founder",
    role: "admin"
  });
  await upsertUser({
    email: "rookie@example.com",
    username: "rookie",
    name: "Rookie Player"
  });

  for (const user of [founder, supporter, crewUser, admin]) {
    await prisma.founderProfile.upsert({
      where: { userId: user.id },
      update: { displayName: user.name ?? user.username },
      create: {
        userId: user.id,
        displayName: user.name ?? user.username,
        bio: "Seeded founder profile for automated verification."
      }
    });
  }

  const crew = await prisma.crew.upsert({
    where: { slug: "seed-crew" },
    update: { seasonId: season.id },
    create: {
      name: "Seed Crew",
      slug: "seed-crew",
      seasonId: season.id,
      description: "Automated verification crew."
    }
  });

  await prisma.crewMember.upsert({
    where: { crewId_userId: { crewId: crew.id, userId: crewUser.id } },
    update: { role: "owner" },
    create: { crewId: crew.id, userId: crewUser.id, role: "owner" }
  });

  const tokenInputs = [
    ["Live Laugh Launch", "LIVE", "live", 42, 63, 38, 34, 18, 12, 15000],
    ["Graduation Energy", "GRAD", "graduated", 90, 80, 78, 72, 60, 8, 1250000],
    ["Rugged Toast", "RUG", "rugged", 4, 9, 16, 12, 3, 82, 700],
    ["Dead Cat Bounce House", "DEAD", "dead", 2, 18, 12, 10, 2, 24, 350],
    ["Mascot Waiting Room", "QUEUE", "live", 35, 58, 44, 31, 12, 15, 9000],
    ["Broken Brush Club", "FAIL", "live", 28, 52, 41, 27, 9, 18, 7500]
  ] as const;

  for (const [
    name,
    ticker,
    status,
    hype,
    trust,
    memeQuality,
    narrativeStrength,
    holders,
    botRisk,
    marketCap
  ] of tokenInputs) {
    const token = await prisma.launchToken.upsert({
      where: { userId_ticker: { userId: founder.id, ticker } },
      update: {
        status,
        hype,
        trust,
        memeQuality,
        narrativeStrength,
        simulatedHolders: holders,
        botRisk,
        simulatedMarketCap: marketCap,
        seasonId: season.id,
        crewId: crew.id
      },
      create: {
        userId: founder.id,
        seasonId: season.id,
        crewId: crew.id,
        name,
        ticker,
        status,
        narrative: "AI Mascots",
        narrativeSlug: "ai-mascots",
        description: "Seed token for Stage 3 verification.",
        mascotPrompt: "A fictional game mascot for a simulated token.",
        placeholderImageUrl:
          "/assets/game/tokens/default-token-placeholder.svg",
        hype,
        trust,
        memeQuality,
        narrativeStrength,
        simulatedHolders: holders,
        botRisk,
        simulatedMarketCap: marketCap,
        launchedAt: now,
        graduatedAt: status === "graduated" ? now : null,
        score: Math.round(Number(marketCap) / 1000)
      }
    });

    const tickCount = await prisma.tokenTick.count({
      where: { tokenId: token.id }
    });
    if (tickCount === 0) {
      await prisma.tokenTick.createMany({
        data: Array.from({ length: 6 }, (_, index) => ({
          tokenId: token.id,
          price: 0.000001 * (index + 1),
          marketCap: Number(marketCap) * (0.7 + index * 0.06),
          volume: 1000 + index * 250,
          holders: Number(holders) + index * 3,
          hype: Number(hype),
          trust: Number(trust),
          score: Math.round(Number(marketCap) / 1000) + index
        }))
      });
    }

    if (ticker === "QUEUE" || ticker === "FAIL") {
      await prisma.imageJob.upsert({
        where: { id: `seed-image-${ticker.toLowerCase()}` },
        update: { status: ticker === "QUEUE" ? "queued" : "failed" },
        create: {
          id: `seed-image-${ticker.toLowerCase()}`,
          tokenId: token.id,
          status: ticker === "QUEUE" ? "queued" : "failed",
          prompt: "fictional transparent mascot reference",
          error:
            ticker === "FAIL"
              ? "Seeded failure for degraded-state verification."
              : null
        }
      });
    }
  }

  await prisma.supportAction.createMany({
    data: [
      {
        userId: supporter.id,
        tokenId: (
          await prisma.launchToken.findFirstOrThrow({
            where: { ticker: "LIVE", userId: founder.id }
          })
        ).id,
        crewId: crew.id,
        actionType: "boost_meme",
        energyCost: 2,
        impactJson: { hype: 2 }
      }
    ],
    skipDuplicates: true
  });

  console.log(`[seed] complete. Password for seeded users: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
