import { prisma } from "@meme-foundry/db";
import { publishRealtimeEvent } from "@meme-foundry/realtime";

export type SupportActionDefinition = {
  id: string;
  label: string;
  plainPurpose: string;
  upside: string;
  downside: string;
  energyCost: number;
  cooldownSeconds: number;
  effects: {
    hype?: number;
    trust?: number;
    memeQuality?: number;
    narrativeStrength?: number;
    communityStrength?: number;
    whaleInterest?: number;
    botRisk?: number;
    fudPressure?: number;
    fatigue?: number;
    simulatedHolders?: number;
    simulatedVolume?: number;
    simulatedMarketCap?: number;
  };
};

export const SUPPORT_ACTION_CATALOG = {
  MAKE_MEME: {
    id: "MAKE_MEME",
    label: "Make Meme",
    plainPurpose: "Add something easy for people to share.",
    upside: "+ Hype, + meme quality, + holders",
    downside: "+ small fatigue",
    energyCost: 8,
    cooldownSeconds: 600,
    effects: {
      hype: 5,
      memeQuality: 4,
      fatigue: 1,
      simulatedHolders: 3,
      simulatedVolume: 120
    }
  },
  SHARE_LAUNCH: {
    id: "SHARE_LAUNCH",
    label: "Share Launch",
    plainPurpose: "Send a clean attention bump without pretending to trade.",
    upside: "+ Hype, + community, + holders",
    downside: "+ tiny fatigue",
    energyCost: 5,
    cooldownSeconds: 300,
    effects: {
      hype: 4,
      communityStrength: 2,
      fatigue: 1,
      simulatedHolders: 2,
      simulatedVolume: 90
    }
  },
  DEFEND_CHAT: {
    id: "DEFEND_CHAT",
    label: "Defend Chat",
    plainPurpose: "Help calm panic and reduce simulated FUD pressure.",
    upside: "+ Trust, - FUD pressure",
    downside: "Costs more support energy",
    energyCost: 12,
    cooldownSeconds: 1200,
    effects: {
      trust: 7,
      fudPressure: -7,
      communityStrength: 2,
      simulatedHolders: 1
    }
  },
  WRITE_LORE: {
    id: "WRITE_LORE",
    label: "Write Lore",
    plainPurpose: "Make the launch easier to understand and rally around.",
    upside: "+ Narrative, + community",
    downside: "+ small fatigue",
    energyCost: 10,
    cooldownSeconds: 1200,
    effects: {
      narrativeStrength: 7,
      communityStrength: 3,
      fatigue: 1,
      simulatedHolders: 2
    }
  },
  BOOST_TRUST: {
    id: "BOOST_TRUST",
    label: "Boost Trust",
    plainPurpose: "Signal belief in the launch without adding fake liquidity.",
    upside: "+ Trust, + whale interest",
    downside: "Longer cooldown",
    energyCost: 14,
    cooldownSeconds: 1800,
    effects: {
      trust: 8,
      whaleInterest: 1,
      simulatedHolders: 2,
      simulatedVolume: 75
    }
  },
  JOIN_RAID: {
    id: "JOIN_RAID",
    label: "Join Raid",
    plainPurpose: "Join a loud community push with visible risk.",
    upside: "+ Hype, + community",
    downside: "+ bot risk, + fatigue",
    energyCost: 10,
    cooldownSeconds: 900,
    effects: {
      hype: 8,
      communityStrength: 3,
      botRisk: 2,
      fatigue: 2,
      simulatedHolders: 4,
      simulatedVolume: 180
    }
  }
} satisfies Record<string, SupportActionDefinition>;

export type SupportActionId = keyof typeof SUPPORT_ACTION_CATALOG;

export class SupportActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupportActionError";
  }
}

export function isSupportActionId(value: string): value is SupportActionId {
  return value in SUPPORT_ACTION_CATALOG;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreFor(token: {
  hype: number;
  trust: number;
  memeQuality: number;
  narrativeStrength: number;
  communityStrength: number;
  whaleInterest: number;
  botRisk: number;
  fudPressure: number;
  fatigue: number;
  simulatedMarketCap: number;
  simulatedHolders: number;
}) {
  return Math.max(
    0,
    Math.round(
      token.hype * 2 +
        token.trust * 2 +
        token.memeQuality * 1.5 +
        token.narrativeStrength * 1.5 +
        token.communityStrength * 3 +
        token.whaleInterest +
        token.simulatedHolders * 0.2 +
        token.simulatedMarketCap / 1000 -
        token.botRisk * 1.5 -
        token.fudPressure * 1.5 -
        token.fatigue
    )
  );
}

type SupportToken = NonNullable<
  Awaited<ReturnType<typeof prisma.launchToken.findFirst>>
>;

function applySupportEffects(
  token: SupportToken,
  action: SupportActionDefinition
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
    whaleInterest: clamp(token.whaleInterest + (effects.whaleInterest ?? 0)),
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
        (effects.simulatedMarketCap ??
          (effects.simulatedHolders ?? 0) * 35 +
            (effects.hype ?? 0) * 18 +
            (effects.trust ?? 0) * 12)
    )
  };
  return {
    ...next,
    simulatedPrice: Math.max(0.000001, next.simulatedMarketCap / 1_000_000_000),
    score: scoreFor(next)
  };
}

export async function executeSupportActionForUser(input: {
  userId: string;
  tokenId: string;
  actionId: SupportActionId;
  nonce: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const action = SUPPORT_ACTION_CATALOG[input.actionId];
  const token = await prisma.launchToken.findFirstOrThrow({
    where: { id: input.tokenId },
    include: { user: true }
  });
  if (token.userId === input.userId) {
    throw new SupportActionError("Support is for other players' launches.");
  }
  if (token.status !== "live") {
    throw new SupportActionError("Only live launches can receive support.");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: input.userId }
  });
  if (user.status !== "active") {
    throw new SupportActionError("User is not active.");
  }
  if (user.supportEnergy < action.energyCost) {
    throw new SupportActionError("Not enough support energy.");
  }

  const recentSameAction = await prisma.supportAction.findFirst({
    where: {
      tokenId: token.id,
      userId: input.userId,
      actionType: input.actionId
    },
    orderBy: { createdAt: "desc" }
  });
  if (recentSameAction) {
    const readyAt =
      recentSameAction.createdAt.getTime() + action.cooldownSeconds * 1000;
    if (readyAt > now.getTime()) {
      const minutes = Math.ceil((readyAt - now.getTime()) / 60000);
      throw new SupportActionError(
        `${action.label} is cooling down for ${minutes} more minute${minutes === 1 ? "" : "s"}.`
      );
    }
  }

  const idempotencyKey = `${token.id}:${input.userId}:support:${input.actionId}:${input.nonce}`;
  const next = applySupportEffects(token, action);

  try {
    const [updatedUser, updatedToken, supportAction, tokenTick, event] =
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${token.id}:${input.userId}:${input.actionId}`}))`;
        const lockedRecentAction = await tx.supportAction.findFirst({
          where: {
            tokenId: token.id,
            userId: input.userId,
            actionType: input.actionId
          },
          orderBy: { createdAt: "desc" }
        });
        if (lockedRecentAction) {
          const readyAt =
            lockedRecentAction.createdAt.getTime() +
            action.cooldownSeconds * 1000;
          if (readyAt > now.getTime()) {
            const minutes = Math.ceil((readyAt - now.getTime()) / 60000);
            throw new SupportActionError(
              `${action.label} is cooling down for ${minutes} more minute${minutes === 1 ? "" : "s"}.`
            );
          }
        }
        const userUpdate = await tx.user.updateMany({
          where: {
            id: input.userId,
            supportEnergy: { gte: action.energyCost }
          },
          data: { supportEnergy: { decrement: action.energyCost } }
        });
        if (userUpdate.count !== 1) {
          throw new SupportActionError("Not enough support energy.");
        }
        const changedToken = await tx.launchToken.update({
          where: { id: token.id },
          data: next
        });
        const support = await tx.supportAction.create({
          data: {
            userId: input.userId,
            tokenId: token.id,
            actionType: input.actionId,
            energyCost: action.energyCost,
            idempotencyKey,
            impactJson: { effects: action.effects }
          },
          include: { user: true }
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
            seasonId: token.seasonId,
            type: "support_action",
            title: `${support.user.username} used ${action.label}`,
            description: `${action.plainPurpose} ${action.upside}.`,
            source: "support",
            severity: "info",
            impactJson: { actionId: input.actionId, effects: action.effects }
          }
        });
        const freshUser = await tx.user.findUniqueOrThrow({
          where: { id: input.userId }
        });
        return [freshUser, changedToken, support, tick, gameEvent] as const;
      });

    await Promise.all([
      publishRealtimeEvent({
        type: "SUPPORT_ACTION",
        tokenId: token.id,
        user: { username: supportAction.user.username },
        actionType: action.label,
        effects: Object.fromEntries(
          Object.entries(action.effects).map(([key, value]) => [
            key,
            value ?? 0
          ])
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
      event,
      supportAction,
      token: updatedToken,
      user: updatedUser
    };
  } catch (error) {
    if (error instanceof SupportActionError) throw error;
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new SupportActionError("That support action was already applied.");
    }
    throw error;
  }
}
