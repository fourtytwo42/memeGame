import { prisma } from "../packages/db/src/index";

const narratives = [
  "Frog Meta",
  "Dog Season",
  "AI Agents",
  "Wizard Cartel",
  "Snack Finance",
  "Retro Internet",
  "Cozy Chaos",
  "Space Pets",
  "Cat Domination",
  "Cult Community",
  "Robot Revival",
  "Absurdist Internet"
];

const userHandles = [
  "FroggyPixels",
  "MemeSmith",
  "LoreWeaver",
  "BasedBot",
  "HypeKnight",
  "WizardPepe",
  "AgentMeow",
  "NoodleHands",
  "ChaosMint",
  "PondPilot",
  "GlitchSage",
  "SnackSmith",
  "ForgeMaster",
  "RaidRider",
  "LoreKeeper",
  "SignalCrafter"
];

const tokenThemes = [
  ["Pond Lord", "POND"],
  ["DogWifHat Lab", "WIF"],
  ["Agent Meow", "MEOW"],
  ["Wizard Pepe", "WIZ"],
  ["Noodle Nation", "NOODLE"],
  ["Retro Goblin", "GOBLIN"],
  ["Snack Reactor", "SNACK"],
  ["Moon Pup", "PUP"],
  ["Based Bot", "BASED"],
  ["Pixel Frog", "PIXEL"],
  ["Banana Signal", "BANANA"],
  ["Meme Smith", "SMITH"],
  ["Punkinu", "PUNK"],
  ["MemeFrog", "MFROG"],
  ["Glitch Protocol", "GLITCH"],
  ["Oink Nation", "OINK"]
] as const;

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
  "Retro Guild",
  "Moon Meme Union",
  "Signal Cartel"
];

const suffixes = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Echo",
  "Flux",
  "Nova",
  "Orbit",
  "Pulse",
  "Quasar",
  "Rift",
  "Spark",
  "Vector",
  "Wave",
  "Zenith"
];

const badVisiblePattern =
  /(e2e|chromium|mobile[-_]?chrome|stage\s*11|stage11|stage15|stress|scale\s*(token|crew|narrative|user)|crew\s*scale|crew[_-]?founder|crew[_-]?captain|forgemaster_\d|memesmith_\d|lorekeeper_\d|raidrider_\d|_[0-9]+$)/i;

function cleanHandle(index: number) {
  return `${userHandles[index % userHandles.length]}${String(index + 1).padStart(2, "0")}`;
}

function displayName(handle: string) {
  return handle.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function themedToken(index: number) {
  const [name, ticker] = tokenThemes[index % tokenThemes.length];
  const suffix = suffixes[index % suffixes.length];
  return {
    name: `${name} ${suffix}`,
    ticker: `${ticker}${suffix.toUpperCase().slice(0, 2)}`
  };
}

async function cleanUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { founderProfile: true }
  });
  let changed = 0;

  for (const [index, user] of users.entries()) {
    const visible = [user.username, user.name, user.founderProfile?.displayName]
      .filter(Boolean)
      .join(" ");
    if (!badVisiblePattern.test(visible)) continue;

    const username = cleanHandle(index);
    const name = displayName(username);
    await prisma.user.update({
      where: { id: user.id },
      data: { username, name }
    });
    await prisma.founderProfile.upsert({
      where: { userId: user.id },
      update: { displayName: name },
      create: { userId: user.id, displayName: name }
    });
    changed++;
  }

  return changed;
}

async function cleanSeasonsAndNarratives() {
  const badSeasons = await prisma.season.findMany({
    where: {
      OR: [
        { name: { contains: "E2E" } },
        { name: { contains: "chromium" } },
        { name: { contains: "mobile-chrome" } },
        { name: { contains: "Stage" } }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  for (const [index, season] of badSeasons.entries()) {
    await prisma.season.update({
      where: { id: season.id },
      data: {
        name: `Crew Trials Archive ${suffixes[index % suffixes.length]}`,
        status: season.status === "active" ? "upcoming" : season.status
      }
    });
  }

  const badNarratives = await prisma.narrativeMeta.findMany({
    orderBy: { createdAt: "asc" }
  });
  let narrativesChanged = 0;
  for (const [index, narrative] of badNarratives.entries()) {
    if (!badVisiblePattern.test(narrative.name)) continue;
    await prisma.narrativeMeta.update({
      where: { id: narrative.id },
      data: {
        name: narratives[index % narratives.length],
        memePotential: Math.max(60, narrative.memePotential)
      }
    });
    narrativesChanged++;
  }

  await prisma.season.updateMany({
    where: { slug: "scale-season" },
    data: { name: "Season 7: Memeverse Rising", status: "active" }
  });

  return { seasons: badSeasons.length, narratives: narrativesChanged };
}

async function cleanTokens() {
  const tokens = await prisma.launchToken.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    include: { user: true }
  });
  let changed = 0;

  for (const [index, token] of tokens.entries()) {
    const visible = [
      token.name,
      token.ticker,
      token.narrative,
      token.user.username,
      token.user.name
    ]
      .filter(Boolean)
      .join(" ");
    if (!badVisiblePattern.test(visible)) continue;

    const themed = themedToken(index);
    await prisma.launchToken.update({
      where: { id: token.id },
      data: {
        name: themed.name,
        ticker: themed.ticker,
        description:
          "Fictional launch in the Meme Foundry season. Built for simulated support, rivalry, and graduation pressure.",
        narrative: narratives[index % narratives.length],
        placeholderImageUrl:
          token.placeholderImageUrl ??
          "/assets/game/tokens/default-token-mascot.png"
      }
    });
    changed++;
  }

  return changed;
}

async function cleanCrews() {
  const crews = await prisma.crew.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }]
  });
  let changed = 0;

  for (const [index, crew] of crews.entries()) {
    const visible = [crew.name, crew.description, crew.tagline]
      .filter(Boolean)
      .join(" ");
    if (!badVisiblePattern.test(visible) && !crew.slug.startsWith("stage11-"))
      continue;

    await prisma.crew.update({
      where: { id: crew.id },
      data: {
        name: `${crewThemes[index % crewThemes.length]} ${suffixes[index % suffixes.length]}`,
        description:
          "Coordinated launch crew with active members and a featured support target.",
        tagline: "Built for clean raids, lore drops, and support bursts.",
        avatarUrl: crew.avatarUrl ?? "/assets/game/crews/default-avatar.png",
        energy: Math.max(crew.energy, 100),
        resources: Math.max(crew.resources, 100)
      }
    });
    changed++;
  }

  return changed;
}

async function cleanEvents() {
  const events = await prisma.gameEvent.findMany({
    orderBy: { createdAt: "desc" }
  });
  let changed = 0;

  for (const [index, event] of events.entries()) {
    const visible = [event.title, event.description].join(" ");
    if (!badVisiblePattern.test(visible)) continue;
    const narrative = narratives[index % narratives.length];
    await prisma.gameEvent.update({
      where: { id: event.id },
      data: {
        title: "Featured launch momentum",
        description: `A featured launch caught a wave in ${narrative}. Keep it useful before fatigue turns the moment stale.`
      }
    });
    changed++;
  }

  return changed;
}

async function prepareAdminDemoState() {
  const [admin, crew] = await Promise.all([
    prisma.user.findUnique({ where: { username: "fourtytwo42" } }),
    prisma.crew.findFirst({
      where: { moderationStatus: "active" },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }]
    })
  ]);

  if (!admin || !crew) {
    return { adminReady: false };
  }

  const token = await prisma.launchToken.findFirst({
    where: { userId: admin.id, status: { in: ["live", "draft"] } },
    orderBy: { updatedAt: "desc" }
  });

  await prisma.user.update({
    where: { id: admin.id },
    data: { supportEnergy: 100 }
  });
  await prisma.founderProfile.upsert({
    where: { userId: admin.id },
    update: { clout: 8920, reputation: 72 },
    create: {
      userId: admin.id,
      displayName: "Degen Dreamer",
      clout: 8920,
      reputation: 72
    }
  });

  if (token) {
    await prisma.launchToken.update({
      where: { id: token.id },
      data: {
        energy: 100,
        treasury: Math.max(token.treasury, 42350),
        crewId: crew.id,
        hype: Math.max(token.hype, 72),
        trust: Math.max(token.trust, 62),
        communityStrength: Math.max(token.communityStrength, 70),
        memeQuality: Math.max(token.memeQuality, 72),
        narrativeStrength: Math.max(token.narrativeStrength, 68),
        simulatedHolders: Math.max(token.simulatedHolders, 5428),
        simulatedMarketCap: Math.max(token.simulatedMarketCap, 2_140_000),
        score: Math.max(token.score, 98_720)
      }
    });
    await prisma.crew.update({
      where: { id: crew.id },
      data: {
        featuredTokenId: token.id,
        energy: 100,
        resources: 100,
        score: Math.max(crew.score, 98_450)
      }
    });
  }

  await prisma.crewMember.upsert({
    where: { crewId_userId: { crewId: crew.id, userId: admin.id } },
    update: { role: "owner" },
    create: { crewId: crew.id, userId: admin.id, role: "owner" }
  });

  return { adminReady: true, crew: crew.slug, token: token?.id ?? null };
}

async function main() {
  const result = {
    users: await cleanUsers(),
    seasonsAndNarratives: await cleanSeasonsAndNarratives(),
    tokens: await cleanTokens(),
    crews: await cleanCrews(),
    events: await cleanEvents(),
    adminDemo: await prepareAdminDemoState()
  };

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
