import { prisma } from "@meme-foundry/db";
import { publishRealtimeEvent } from "@meme-foundry/realtime";

export type CrewActionDefinition = {
  id: string;
  label: string;
  plainPurpose: string;
  upside: string;
  downside: string;
  energyCost: number;
  resourceCost: number;
  cooldownSeconds: number;
  score: number;
  effects: {
    hype?: number;
    trust?: number;
    memeQuality?: number;
    narrativeStrength?: number;
    communityStrength?: number;
    botRisk?: number;
    fudPressure?: number;
    fatigue?: number;
    simulatedHolders?: number;
    simulatedVolume?: number;
  };
};

export const CREW_ACTION_CATALOG = {
  SIGNAL_BOOST: {
    id: "SIGNAL_BOOST",
    label: "Signal Boost",
    plainPurpose: "Coordinate attention around the featured launch.",
    upside: "+ Hype, + community, + holders",
    downside: "+ small fatigue",
    energyCost: 12,
    resourceCost: 8,
    cooldownSeconds: 900,
    score: 18,
    effects: {
      hype: 8,
      communityStrength: 5,
      fatigue: 2,
      simulatedHolders: 5,
      simulatedVolume: 250
    }
  },
  MAKE_MEME_PACK: {
    id: "MAKE_MEME_PACK",
    label: "Make Meme Pack",
    plainPurpose: "Give supporters reusable material and shared identity.",
    upside: "+ Meme quality, + community",
    downside: "Costs crew resources",
    energyCost: 10,
    resourceCost: 14,
    cooldownSeconds: 1200,
    score: 20,
    effects: {
      memeQuality: 8,
      communityStrength: 6,
      hype: 3,
      simulatedHolders: 3
    }
  },
  DEFEND_AGAINST_FUD: {
    id: "DEFEND_AGAINST_FUD",
    label: "Defend Against FUD",
    plainPurpose: "Organize calm responses when the launch gets shaky.",
    upside: "+ Trust, - FUD pressure",
    downside: "Costs crew energy",
    energyCost: 16,
    resourceCost: 6,
    cooldownSeconds: 1200,
    score: 16,
    effects: {
      trust: 9,
      fudPressure: -10,
      communityStrength: 2,
      simulatedHolders: 2
    }
  },
  LORE_CAMPAIGN: {
    id: "LORE_CAMPAIGN",
    label: "Lore Campaign",
    plainPurpose: "Turn scattered posts into a story people can repeat.",
    upside: "+ Narrative, + trust",
    downside: "+ small fatigue",
    energyCost: 12,
    resourceCost: 10,
    cooldownSeconds: 1500,
    score: 17,
    effects: { narrativeStrength: 9, trust: 4, fatigue: 2, simulatedHolders: 3 }
  }
} satisfies Record<string, CrewActionDefinition>;

export type CrewActionId = keyof typeof CREW_ACTION_CATALOG;

export class CrewActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrewActionError";
  }
}

export function isCrewActionId(value: string): value is CrewActionId {
  return value in CREW_ACTION_CATALOG;
}

export function slugifyCrewName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function requireActiveCrew(crew: { moderationStatus: string }) {
  if (crew.moderationStatus !== "active") {
    throw new CrewActionError("This crew is not active.");
  }
}

async function memberOrThrow(crewId: string, userId: string) {
  const member = await prisma.crewMember.findUnique({
    where: { crewId_userId: { crewId, userId } }
  });
  if (!member) throw new CrewActionError("Join the crew before doing that.");
  return member;
}

function requireOwnerOrMod(role: string) {
  if (!["owner", "mod"].includes(role)) {
    throw new CrewActionError("Only crew owners and mods can do that.");
  }
}

function applyCrewEffects(
  token: Awaited<ReturnType<typeof prisma.launchToken.findFirstOrThrow>>,
  action: CrewActionDefinition
) {
  const effects = action.effects;
  const next = {
    hype: clamp(token.hype + (effects.hype ?? 0)),
    trust: clamp(token.trust + (effects.trust ?? 0)),
    memeQuality: clamp(token.memeQuality + (effects.memeQuality ?? 0)),
    narrativeStrength: clamp(
      token.narrativeStrength + (effects.narrativeStrength ?? 0)
    ),
    communityStrength: clamp(
      token.communityStrength + (effects.communityStrength ?? 0)
    ),
    botRisk: clamp(token.botRisk + (effects.botRisk ?? 0)),
    fudPressure: clamp(token.fudPressure + (effects.fudPressure ?? 0)),
    fatigue: clamp(token.fatigue + (effects.fatigue ?? 0)),
    simulatedHolders: Math.max(
      0,
      token.simulatedHolders + (effects.simulatedHolders ?? 0)
    ),
    simulatedVolume: Math.max(
      0,
      token.simulatedVolume + (effects.simulatedVolume ?? 0)
    ),
    simulatedMarketCap: Math.max(
      100,
      token.simulatedMarketCap +
        (effects.simulatedHolders ?? 0) * 45 +
        (effects.hype ?? 0) * 20 +
        (effects.trust ?? 0) * 15 +
        (effects.communityStrength ?? 0) * 18
    )
  };
  return {
    ...next,
    simulatedPrice: Math.max(0.000001, next.simulatedMarketCap / 1_000_000_000),
    score: Math.max(
      0,
      Math.round(token.score + action.score + next.communityStrength / 3)
    )
  };
}

export async function createCrewForUser(input: {
  userId: string;
  name: string;
  description?: string;
  tagline?: string;
}) {
  const name = input.name.trim();
  if (name.length < 3) throw new CrewActionError("Crew name is too short.");
  const slug = slugifyCrewName(name);
  if (!slug) throw new CrewActionError("Crew needs a readable name.");
  const season = await prisma.season.findFirst({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const crew = await prisma.crew.create({
    data: {
      name,
      slug,
      description: input.description?.trim() || null,
      tagline: input.tagline?.trim() || null,
      seasonId: season?.id,
      members: { create: { userId: input.userId, role: "owner" } },
      events: {
        create: {
          seasonId: season?.id,
          type: "crew_created",
          title: `${name} formed`,
          description: "A new crew is ready to coordinate launch support.",
          source: "crew",
          severity: "info"
        }
      }
    },
    include: { members: true }
  });
  return crew;
}

export async function joinCrewForUser(input: {
  userId: string;
  crewId: string;
}) {
  const crew = await prisma.crew.findUniqueOrThrow({
    where: { id: input.crewId }
  });
  requireActiveCrew(crew);
  return prisma.crewMember.upsert({
    where: { crewId_userId: { crewId: input.crewId, userId: input.userId } },
    update: {},
    create: { crewId: input.crewId, userId: input.userId, role: "member" }
  });
}

export async function featureTokenForCrew(input: {
  userId: string;
  crewId: string;
  tokenId: string;
}) {
  const [crew, token, member] = await Promise.all([
    prisma.crew.findUniqueOrThrow({ where: { id: input.crewId } }),
    prisma.launchToken.findUniqueOrThrow({ where: { id: input.tokenId } }),
    memberOrThrow(input.crewId, input.userId)
  ]);
  requireActiveCrew(crew);
  requireOwnerOrMod(member.role);
  if (token.status !== "live")
    throw new CrewActionError("Feature a live launch.");
  const updated = await prisma.crew.update({
    where: { id: crew.id },
    data: {
      featuredTokenId: token.id,
      events: {
        create: {
          tokenId: token.id,
          seasonId: token.seasonId,
          type: "crew_featured_token",
          title: `${crew.name} featured ${token.ticker}`,
          description: "Crew actions will now support this launch.",
          source: "crew",
          severity: "info"
        }
      }
    },
    include: { featuredToken: true }
  });
  return updated;
}

export async function executeCrewActionForUser(input: {
  userId: string;
  crewId: string;
  actionId: CrewActionId;
  nonce: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const action = CREW_ACTION_CATALOG[input.actionId];
  const [crew, member] = await Promise.all([
    prisma.crew.findUniqueOrThrow({ where: { id: input.crewId } }),
    memberOrThrow(input.crewId, input.userId)
  ]);
  requireActiveCrew(crew);
  if (!crew.featuredTokenId)
    throw new CrewActionError("Feature a launch first.");
  if (crew.energy < action.energyCost)
    throw new CrewActionError("Not enough crew energy.");
  if (crew.resources < action.resourceCost)
    throw new CrewActionError("Not enough crew resources.");
  const token = await prisma.launchToken.findFirst({
    where: { id: crew.featuredTokenId, status: "live" }
  });
  if (!token) {
    throw new CrewActionError(
      "The featured launch is no longer live. Feature a live launch before running crew support."
    );
  }
  const idempotencyKey = `${crew.id}:${input.userId}:${input.actionId}:${input.nonce}`;
  const next = applyCrewEffects(token, action);

  const [
    updatedCrew,
    updatedToken,
    crewAction,
    supportAction,
    tokenTick,
    event
  ] = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${crew.id}:${token.id}:${input.actionId}`}))`;
    const recent = await tx.crewAction.findFirst({
      where: { crewId: crew.id, tokenId: token.id, actionType: input.actionId },
      orderBy: { createdAt: "desc" }
    });
    if (recent) {
      const readyAt =
        recent.createdAt.getTime() + action.cooldownSeconds * 1000;
      if (readyAt > now.getTime()) {
        const minutes = Math.ceil((readyAt - now.getTime()) / 60000);
        throw new CrewActionError(
          `${action.label} is cooling down for ${minutes} more minute${minutes === 1 ? "" : "s"}.`
        );
      }
    }
    const crewUpdate = await tx.crew.updateMany({
      where: {
        id: crew.id,
        energy: { gte: action.energyCost },
        resources: { gte: action.resourceCost }
      },
      data: {
        energy: { decrement: action.energyCost },
        resources: { decrement: action.resourceCost },
        score: { increment: action.score }
      }
    });
    if (crewUpdate.count !== 1)
      throw new CrewActionError("Crew resources changed. Try again.");
    const changedCrew = await tx.crew.findUniqueOrThrow({
      where: { id: crew.id }
    });
    const changedToken = await tx.launchToken.update({
      where: { id: token.id },
      data: next
    });
    const actionRow = await tx.crewAction.create({
      data: {
        crewId: crew.id,
        tokenId: token.id,
        actionType: input.actionId,
        energyCost: action.energyCost,
        createdById: input.userId,
        idempotencyKey,
        impactJson: {
          effects: action.effects,
          resourceCost: action.resourceCost
        }
      }
    });
    const support = await tx.supportAction.create({
      data: {
        userId: input.userId,
        tokenId: token.id,
        crewId: crew.id,
        actionType: `CREW_${input.actionId}`,
        energyCost: action.energyCost,
        impactJson: { effects: action.effects, crewId: crew.id }
      }
    });
    const tick = await tx.tokenTick.create({
      data: {
        tokenId: token.id,
        price: changedToken.simulatedPrice,
        marketCap: changedToken.simulatedMarketCap,
        volume: changedToken.simulatedVolume,
        holders: changedToken.simulatedHolders,
        hype: changedToken.hype,
        trust: changedToken.trust,
        score: changedToken.score
      }
    });
    const gameEvent = await tx.gameEvent.create({
      data: {
        tokenId: token.id,
        crewId: crew.id,
        seasonId: token.seasonId,
        type: "crew_action",
        title: `${crew.name} used ${action.label}`,
        description: `${action.plainPurpose} ${action.upside}.`,
        source: "crew",
        severity: "info",
        impactJson: { actionId: input.actionId, effects: action.effects }
      }
    });
    return [
      changedCrew,
      changedToken,
      actionRow,
      support,
      tick,
      gameEvent
    ] as const;
  });

  await Promise.all([
    publishRealtimeEvent({
      type: "CREW_ACTION",
      crewId: crew.id,
      tokenId: token.id,
      actionType: action.label,
      effects: Object.fromEntries(
        Object.entries(action.effects).map(([key, value]) => [key, value ?? 0])
      )
    }),
    publishRealtimeEvent({
      type: "SUPPORT_ACTION",
      tokenId: token.id,
      user: { username: crew.name },
      actionType: action.label,
      effects: Object.fromEntries(
        Object.entries(action.effects).map(([key, value]) => [key, value ?? 0])
      )
    }),
    publishRealtimeEvent({
      type: "TOKEN_TICK",
      tokenId: token.id,
      seasonId: token.seasonId,
      price: updatedToken.simulatedPrice,
      marketCap: updatedToken.simulatedMarketCap,
      volume: updatedToken.simulatedVolume,
      holders: updatedToken.simulatedHolders,
      hype: updatedToken.hype,
      trust: updatedToken.trust,
      createdAt: tokenTick.createdAt.toISOString()
    }),
    publishRealtimeEvent({
      type: "TOKEN_EVENT",
      tokenId: token.id,
      seasonId: token.seasonId,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity
      }
    })
  ]);

  return {
    action,
    crew: updatedCrew,
    crewAction,
    event,
    member,
    supportAction,
    token: updatedToken
  };
}
