import { hash } from "bcryptjs";
import { prisma } from "../packages/db/src/index";

const TARGET_CREWS = Number(process.env.CREW_SCALE_CREWS ?? 25);
const MEMBERS_PER_CREW = Number(process.env.CREW_SCALE_MEMBERS ?? 4);

async function main() {
  const passwordHash = await hash("MemeFoundry!123", 10);
  const season = await prisma.season.upsert({
    where: { slug: "scale-season" },
    update: { status: "active" },
    create: {
      name: "Scale Season",
      slug: "scale-season",
      status: "active",
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)
    }
  });
  await prisma.narrativeMeta.createMany({
    data: Array.from({ length: 8 }, (_, index) => ({
      seasonId: season.id,
      name: `Crew Scale Narrative ${index + 1}`,
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
        username: `stage11_crew_owner_${index}`
      },
      create: {
        id: ownerId,
        email: `stage11-crew-owner-${index}@example.com`,
        passwordHash,
        status: "active",
        username: `stage11_crew_owner_${index}`
      }
    });
    await prisma.founderProfile.upsert({
      where: { userId: ownerId },
      update: {},
      create: {
        userId: ownerId,
        displayName: `Stage 11 Crew Owner ${index}`
      }
    });

    const tokenId = `stage11-featured-token-${index}`;
    await prisma.launchToken.upsert({
      where: { id: tokenId },
      update: {
        status: "live",
        simulatedHolders: 100 + index,
        simulatedMarketCap: 10_000 + index * 500,
        score: 250 + index
      },
      create: {
        id: tokenId,
        userId: ownerId,
        seasonId: season.id,
        name: `Stage 11 Featured Token ${index}`,
        ticker: `S11${index}`,
        description: "Production-like crew scale fixture launch.",
        narrative: "Crew Scale",
        narrativeSlug: "crew-scale",
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
    await prisma.crew.upsert({
      where: { id: crewId },
      update: {
        energy: 100,
        featuredTokenId: tokenId,
        moderationStatus: "active",
        resources: 100,
        score: 500 + index * 12,
        seasonId: season.id
      },
      create: {
        id: crewId,
        name: `Stage 11 Scale Crew ${index}`,
        slug: `stage11-scale-crew-${index}`,
        description:
          "Scale fixture crew with active members and a featured launch.",
        tagline: "Fixture crew for production-like pages.",
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
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          passwordHash,
          status: "active",
          username: `stage11_crew_${index}_member_${memberIndex}`
        },
        create: {
          id: userId,
          email: `stage11-crew-${index}-member-${memberIndex}@example.com`,
          passwordHash,
          status: "active",
          username: `stage11_crew_${index}_member_${memberIndex}`
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
