import { hash } from "bcryptjs";
import { prisma } from "../packages/db/src/index";

const TARGET_CREWS = Number(process.env.CREW_SCALE_CREWS ?? 25);
const MEMBERS_PER_CREW = Number(process.env.CREW_SCALE_MEMBERS ?? 4);

const narrativeThemes = [
  "Frog Meta",
  "Dog Season",
  "AI Agents",
  "Wizard Cartel",
  "Snack Finance",
  "Retro Internet",
  "Cozy Chaos",
  "Space Pets"
];

const crewThemes = [
  "Frog Foundry",
  "Purple Forge",
  "Meme Lordz",
  "Pixel Pioneers",
  "Chaos Crew",
  "Degen Signal",
  "Lore Keepers",
  "Raid Garden",
  "Snack Syndicate",
  "Retro Guild"
];

const tokenThemes = [
  ["Punkinu", "PUNK"],
  ["Moon Pup", "PUP"],
  ["MemeFrog", "MFROG"],
  ["Agent Meow", "MEOW"],
  ["Wizard Pepe", "WIZ"],
  ["Noodle Nation", "NOODLE"],
  ["Retro Goblin", "GOBLIN"],
  ["Based Bot", "BASED"]
] as const;

const memberHandles = [
  "ForgeMaster",
  "MemeSmith",
  "LoreKeeper",
  "RaidRider",
  "SignalMage",
  "PixelScout"
];

async function main() {
  const passwordHash = await hash("MemeFoundry!123", 10);
  const season = await prisma.season.upsert({
    where: { slug: "scale-season" },
    update: { name: "Season 7: Memeverse Rising", status: "active" },
    create: {
      name: "Season 7: Memeverse Rising",
      slug: "scale-season",
      status: "active",
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)
    }
  });
  await prisma.narrativeMeta.createMany({
    data: Array.from({ length: 8 }, (_, index) => ({
      seasonId: season.id,
      name: narrativeThemes[index % narrativeThemes.length],
      slug: `crew-scale-narrative-${index + 1}`,
      heat: 50 + index,
      saturation: index * 3,
      fatigue: index
    })),
    skipDuplicates: true
  });

  for (let index = 1; index <= TARGET_CREWS; index += 1) {
    const ownerId = `stage11-crew-owner-${index}`;
    await prisma.user.upsert({
      where: { id: ownerId },
      update: {
        passwordHash,
        status: "active",
        username: `crew_captain_${index}`
      },
      create: {
        id: ownerId,
        email: `stage11-crew-owner-${index}@example.com`,
        passwordHash,
        status: "active",
        username: `crew_captain_${index}`
      }
    });
    await prisma.founderProfile.upsert({
      where: { userId: ownerId },
      update: {
        displayName: `${memberHandles[0]} ${index}`
      },
      create: {
        userId: ownerId,
        displayName: `${memberHandles[0]} ${index}`
      }
    });

    const tokenId = `stage11-featured-token-${index}`;
    const tokenTheme = tokenThemes[(index - 1) % tokenThemes.length];
    await prisma.launchToken.upsert({
      where: { id: tokenId },
      update: {
        name: `${tokenTheme[0]} ${index}`,
        ticker: `${tokenTheme[1]}${index}`,
        description: "Featured fictional launch for coordinated crew support.",
        narrative: narrativeThemes[(index - 1) % narrativeThemes.length],
        narrativeSlug: `crew-scale-narrative-${((index - 1) % 8) + 1}`,
        status: "live",
        simulatedHolders: 100 + index,
        simulatedMarketCap: 10_000 + index * 500,
        score: 250 + index
      },
      create: {
        id: tokenId,
        userId: ownerId,
        seasonId: season.id,
        name: `${tokenTheme[0]} ${index}`,
        ticker: `${tokenTheme[1]}${index}`,
        description: "Featured fictional launch for coordinated crew support.",
        narrative: narrativeThemes[(index - 1) % narrativeThemes.length],
        narrativeSlug: `crew-scale-narrative-${((index - 1) % 8) + 1}`,
        status: "live",
        simulatedHolders: 100 + index,
        simulatedMarketCap: 10_000 + index * 500,
        simulatedVolume: 250 + index * 10,
        hype: 40 + (index % 40),
        trust: 45 + (index % 35),
        communityStrength: 35 + (index % 40),
        score: 250 + index,
        launchedAt: new Date()
      }
    });

    const crewId = `stage11-scale-crew-${index}`;
    const crewName = `${crewThemes[(index - 1) % crewThemes.length]} Prime ${index}`;
    await prisma.crew.upsert({
      where: { id: crewId },
      update: {
        energy: 100,
        featuredTokenId: tokenId,
        moderationStatus: "active",
        name: crewName,
        description:
          "Coordinated launch crew with active members and a featured support target.",
        tagline: "Built for clean raids, lore drops, and support bursts.",
        resources: 100,
        score: 500 + index * 12,
        seasonId: season.id
      },
      create: {
        id: crewId,
        name: crewName,
        slug: `stage11-scale-crew-${index}`,
        description:
          "Coordinated launch crew with active members and a featured support target.",
        tagline: "Built for clean raids, lore drops, and support bursts.",
        energy: 100,
        resources: 100,
        featuredTokenId: tokenId,
        moderationStatus: "active",
        score: 500 + index * 12,
        seasonId: season.id
      }
    });

    for (
      let memberIndex = 1;
      memberIndex <= MEMBERS_PER_CREW;
      memberIndex += 1
    ) {
      const userId = `stage11-crew-${index}-member-${memberIndex}`;
      const username = `${memberHandles[(memberIndex - 1) % memberHandles.length].toLowerCase()}_${index}_${memberIndex}`;
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          passwordHash,
          status: "active",
          username
        },
        create: {
          id: userId,
          email: `stage11-crew-${index}-member-${memberIndex}@example.com`,
          passwordHash,
          status: "active",
          username
        }
      });
      await prisma.crewMember.upsert({
        where: { crewId_userId: { crewId, userId } },
        update: {},
        create: {
          crewId,
          userId,
          role:
            memberIndex === 1 ? "owner" : memberIndex === 2 ? "mod" : "member"
        }
      });
    }
  }

  const crews = await prisma.crew.findMany({
    where: {
      moderationStatus: "active",
      slug: { startsWith: "stage11-scale-crew-" },
      featuredTokenId: { not: null }
    },
    include: { _count: { select: { members: true } } }
  });
  const readyCrews = crews.filter(
    (crew) => crew._count.members >= MEMBERS_PER_CREW
  );
  if (readyCrews.length < TARGET_CREWS) {
    throw new Error(
      `Crew scale fixture incomplete: ${readyCrews.length}/${TARGET_CREWS} ready crews.`
    );
  }

  console.log(
    JSON.stringify({
      crews: readyCrews.length,
      featuredLaunches: readyCrews.filter((crew) => crew.featuredTokenId)
        .length,
      membersPerCrew: MEMBERS_PER_CREW,
      targetCrews: TARGET_CREWS
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
