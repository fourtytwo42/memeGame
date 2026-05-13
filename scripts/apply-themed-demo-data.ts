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

const founderHandles = [
  "froggypixels",
  "memesmith",
  "loreweaver",
  "basedbot",
  "hypeknight",
  "wizardpepe",
  "agentmeow",
  "noodlehands",
  "chaosmint",
  "pondpilot",
  "glitchsage",
  "snacksmith"
];

function tokenTheme(index: number) {
  return tokenThemes[index % tokenThemes.length];
}

function themedFounder(index: number) {
  return `${founderHandles[index % founderHandles.length]}_${index + 1}`;
}

async function themeSeasonsAndNarratives() {
  await prisma.season.updateMany({
    where: { slug: "scale-season" },
    data: { name: "Season 7: Memeverse Rising", status: "active" }
  });

  const scaleNarratives = await prisma.narrativeMeta.findMany({
    where: {
      OR: [
        { name: { contains: "Scale Narrative" } },
        { name: { contains: "Crew Scale Narrative" } }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  for (const [index, narrative] of scaleNarratives.entries()) {
    await prisma.narrativeMeta.update({
      where: { id: narrative.id },
      data: {
        name: narratives[index % narratives.length],
        memePotential: Math.max(narrative.memePotential, 60)
      }
    });
  }
}

async function themeUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: "scale_user" } },
        { username: { contains: "stage11_" } },
        { username: { contains: "crew_founder_chromium" } },
        { username: { contains: "crew_founder_mobile_chrome" } },
        { username: { contains: "chromium" } },
        { username: { contains: "mobile_chrome" } }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  for (const [index, user] of users.entries()) {
    const username = themedFounder(index);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: username.replace(/_/g, " "),
        username
      }
    });
    await prisma.founderProfile.upsert({
      where: { userId: user.id },
      update: { displayName: username.replace(/_/g, " ") },
      create: {
        userId: user.id,
        displayName: username.replace(/_/g, " ")
      }
    });
  }

  return users.length;
}

async function themeTokens() {
  const tokens = await prisma.launchToken.findMany({
    where: {
      OR: [
        { name: { contains: "Scale Token" } },
        { name: { contains: "Stage 11 Featured Token" } },
        { name: { contains: "Crew E2E Target" } },
        { name: { contains: "E2E Target" } },
        { narrative: { contains: "Scale Narrative" } },
        { narrative: { contains: "Crew E2E" } },
        { narrative: { contains: "Stage 11" } },
        { narrative: "Crew Scale" }
      ]
    },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }]
  });

  for (const [index, token] of tokens.entries()) {
    const [name, ticker] = tokenTheme(index);
    await prisma.launchToken.update({
      where: { id: token.id },
      data: {
        description:
          "Fictional launch in the Meme Foundry season. Built for simulated support, rivalry, and graduation pressure.",
        name: `${name} ${index + 1}`,
        narrative: narratives[index % narratives.length],
        placeholderImageUrl: "/assets/game/tokens/default-token-mascot.png",
        ticker: `${ticker}${index + 1}`
      }
    });
  }

  return tokens.length;
}

async function themeCrews() {
  const crews = await prisma.crew.findMany({
    where: {
      OR: [
        { name: { contains: "Scale Crew" } },
        { name: { contains: "Stage 11 Scale Crew" } },
        { name: { contains: "Browser Crew" } },
        { slug: { startsWith: "stage11-scale-crew-" } },
        { slug: { startsWith: "browser-crew-" } },
        { slug: { startsWith: "scale-crew-" } }
      ]
    },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }]
  });

  for (const [index, crew] of crews.entries()) {
    const source = crew.slug.startsWith("stage11")
      ? "Prime"
      : crew.slug.startsWith("browser")
        ? "Signal"
        : "Orbit";
    const number = crew.slug.match(/(\d+)$/)?.[1] ?? String(index + 1);
    await prisma.crew.update({
      where: { id: crew.id },
      data: {
        avatarUrl: "/assets/game/crews/default-avatar.png",
        description:
          "Coordinated launch crew with active members and a featured support target.",
        name: `${crewThemes[index % crewThemes.length]} ${source} ${number}`,
        tagline: "Built for clean raids, lore drops, and support bursts."
      }
    });
  }

  return crews.length;
}

async function themeEvents() {
  const events = await prisma.gameEvent.findMany({
    where: {
      OR: [
        { title: { contains: "Stage 11" } },
        { title: { contains: "Crew Scale" } },
        { title: { contains: "E2E" } },
        { title: { contains: "chromium" } },
        { description: { contains: "Stage 11" } },
        { description: { contains: "Crew Scale" } },
        { description: { contains: "E2E" } },
        { description: { contains: "chromium" } }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  for (const [index, event] of events.entries()) {
    const narrative = narratives[index % narratives.length];
    await prisma.gameEvent.update({
      where: { id: event.id },
      data: {
        description: `A featured launch caught a wave in ${narrative}. Keep it useful before fatigue turns the moment stale.`,
        title: "Featured launch momentum"
      }
    });
  }

  return events.length;
}

async function main() {
  await themeSeasonsAndNarratives();
  const [users, tokens, crews, events] = await Promise.all([
    themeUsers(),
    themeTokens(),
    themeCrews(),
    themeEvents()
  ]);

  console.log(
    JSON.stringify(
      {
        themedCrews: crews,
        themedEvents: events,
        themedTokens: tokens,
        themedUsers: users
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
