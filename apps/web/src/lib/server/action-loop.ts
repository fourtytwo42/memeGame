import {
  narrativeToEngineState,
  tokenToEngineState,
  tokenUpdateFromState
} from "../game-state";
import { prisma } from "@meme-foundry/db";
import { publishRealtimeEvent } from "@meme-foundry/realtime";
import {
  ACTION_CATALOG,
  applyAction,
  simulateTokenTick,
  type ActionId
} from "@meme-foundry/game-engine";

export class ActionLoopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionLoopError";
  }
}

export function isActionId(value: string): value is ActionId {
  return value in ACTION_CATALOG;
}

export async function executeActionForUser(input: {
  userId: string;
  tokenId: string;
  actionId: ActionId;
  nonce: string;
  confirmedRisk?: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const action = ACTION_CATALOG[input.actionId];
  const token = await prisma.launchToken.findFirst({
    where: { id: input.tokenId, userId: input.userId },
    include: { season: true }
  });
  if (!token) throw new ActionLoopError("Token was not found.");
  if (token.status !== "live") throw new ActionLoopError("Token is not live.");
  if (action.riskLevel === "high" && !input.confirmedRisk) {
    throw new ActionLoopError(
      "Confirm the high-risk warning before taking that action."
    );
  }
  if (token.energy < action.energyCost) {
    throw new ActionLoopError("Not enough energy for that action.");
  }
  if (token.treasury < action.cost) {
    throw new ActionLoopError("Not enough fake budget for that action.");
  }

  const recentSameAction = await prisma.playerAction.findFirst({
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
      throw new ActionLoopError(
        `${action.label} is cooling down for ${minutes} more minute${minutes === 1 ? "" : "s"}.`
      );
    }
  }

  const idempotencyKey = `${token.id}:${input.userId}:${input.actionId}:${input.nonce}`;
  const narrative =
    token.seasonId && token.narrativeSlug
      ? await prisma.narrativeMeta.findUnique({
          where: {
            seasonId_slug: {
              seasonId: token.seasonId,
              slug: token.narrativeSlug
            }
          }
        })
      : null;
  const actionResult = applyAction({
    token: tokenToEngineState(token),
    actionId: input.actionId,
    actorId: input.userId,
    nonce: input.nonce
  });
  const tick = simulateTokenTick({
    token: actionResult.after,
    narrative: narrativeToEngineState(narrative),
    seed: idempotencyKey,
    minutesElapsed: 1
  });
  const finalState = tick.after;

  try {
    const [updatedToken, playerAction, tokenTick, event] =
      await prisma.$transaction([
        prisma.launchToken.update({
          where: { id: token.id },
          data: {
            ...tokenUpdateFromState(finalState),
            energy: { decrement: action.energyCost }
          }
        }),
        prisma.playerAction.create({
          data: {
            userId: input.userId,
            tokenId: token.id,
            actionType: input.actionId,
            cost: action.cost,
            energyCost: action.energyCost,
            idempotencyKey,
            resultJson: {
              explanation: actionResult.explanation,
              deltas: actionResult.deltas,
              tick: {
                attention: tick.attention,
                sellPressure: tick.sellPressure,
                momentum: tick.momentum,
                holderDelta: tick.holderDelta,
                priceChangePercent: tick.priceChangePercent,
                graduationType: tick.graduationType,
                failure: tick.failure
              }
            }
          }
        }),
        prisma.tokenTick.create({
          data: {
            tokenId: token.id,
            price: finalState.simulatedPrice,
            marketCap: finalState.simulatedMarketCap,
            volume: finalState.simulatedVolume,
            holders: finalState.simulatedHolders,
            hype: finalState.hype,
            trust: finalState.trust,
            score: finalState.score
          }
        }),
        prisma.gameEvent.create({
          data: {
            tokenId: token.id,
            seasonId: token.seasonId,
            type: "player_action",
            title: `${action.label} moved the market`,
            description: `${actionResult.explanation} Market reaction: ${tick.holderDelta >= 0 ? "+" : ""}${tick.holderDelta} holders and ${(tick.priceChangePercent * 100).toFixed(1)}% price movement.`,
            source: "action",
            severity: action.riskLevel === "high" ? "warning" : "info",
            impactJson: {
              actionId: input.actionId,
              riskLevel: action.riskLevel,
              deltas: actionResult.deltas,
              tick: {
                momentum: tick.momentum,
                attention: tick.attention,
                sellPressure: tick.sellPressure
              }
            }
          }
        })
      ]);
    await Promise.all([
      publishRealtimeEvent({
        type: "TOKEN_TICK",
        tokenId: token.id,
        seasonId: token.seasonId,
        price: finalState.simulatedPrice,
        marketCap: finalState.simulatedMarketCap,
        volume: finalState.simulatedVolume,
        holders: finalState.simulatedHolders,
        hype: finalState.hype,
        trust: finalState.trust,
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
      }),
      tick.graduationType
        ? publishRealtimeEvent({
            type: "GRADUATION_ALERT",
            tokenId: token.id,
            seasonId: token.seasonId,
            graduationType: tick.graduationType,
            marketCap: finalState.simulatedMarketCap
          })
        : Promise.resolve()
    ]);
    return {
      action,
      actionResult,
      event,
      playerAction,
      tick,
      tokenTick,
      updatedToken
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new ActionLoopError("That action was already applied.");
    }
    throw error;
  }
}
