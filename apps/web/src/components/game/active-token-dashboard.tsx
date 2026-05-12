"use client";

import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flame,
  Info,
  ShieldAlert,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge, Button, Panel, StatBar } from "@meme-foundry/ui";
import { executeTokenAction } from "@/app/launch/[id]/manage/actions";
import { RealtimeStatus } from "@/components/realtime/realtime-status";
import type { ActionDefinition } from "@meme-foundry/game-engine";

type StatGroup = {
  label: string;
  value: number;
  detail: string;
  tone: "good" | "warn" | "bad";
};

type Cooldown = { remainingSeconds: number; readyAt: string | null };

type DashboardAction = ActionDefinition & {
  cooldown?: Cooldown;
  recommended?: boolean;
  disabledReason?: string | null;
};

type DashboardProps = {
  token: {
    id: string;
    name: string;
    ticker: string;
    status: string;
    founderName: string;
    imageUrl: string;
    marketCap: number;
    price: string;
    holders: number;
    volume: number;
    treasury: number;
    energy: number;
    score: number;
    graduationProgress: number;
    stats: Record<string, number>;
  };
  chart: Array<{
    label: string;
    marketCap: number;
    price: number;
    holders: number;
  }>;
  statGroups: StatGroup[];
  actionsByIntent: Array<{ intent: string; actions: DashboardAction[] }>;
  recommendedActionId: string;
  events: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    createdAt: string;
  }>;
  actionFeed: Array<{
    id: string;
    actionType: string;
    createdAt: string;
    explanation: string;
  }>;
  pinnedEvent?: {
    title: string;
    description: string;
    actionId?: string;
  } | null;
  message?: string | null;
  error?: string | null;
  nonceSeed: string;
  seasonId?: string | null;
  userId: string;
};

function fmtNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

function fmtMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency"
  }).format(value);
}

function cooldownLabel(cooldown?: Cooldown) {
  if (!cooldown || cooldown.remainingSeconds <= 0) return "Ready now";
  const minutes = Math.ceil(cooldown.remainingSeconds / 60);
  return `${minutes} min cooldown`;
}

function ActionCard({
  action,
  tokenId,
  nonceSeed,
  slot = "panel"
}: {
  action: DashboardAction;
  tokenId: string;
  nonceSeed: string;
  slot?: "panel" | "pinned";
}) {
  const blocked = Boolean(action.disabledReason);
  const coolingDown = Boolean(
    action.cooldown && action.cooldown.remainingSeconds > 0
  );
  const disabled = blocked || coolingDown;
  return (
    <form
      action={executeTokenAction}
      className="rounded-md border border-white/10 bg-slate-950/55 p-4"
      data-testid={`action-card-${action.id}-${slot}`}
    >
      <input name="tokenId" type="hidden" value={tokenId} />
      <input name="actionId" type="hidden" value={action.id} />
      <input name="nonce" type="hidden" value={`${nonceSeed}-${action.id}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-white">{action.label}</h3>
            {action.recommended ? <Badge tone="good">Recommended</Badge> : null}
            {action.riskLevel === "high" ? (
              <Badge tone="bad">High risk</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-300">
            {action.plainPurpose}
          </p>
        </div>
        {action.riskLevel === "high" ? (
          <ShieldAlert className="shrink-0 text-rose-300" size={22} />
        ) : (
          <Zap className="shrink-0 text-emerald-300" size={22} />
        )}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md bg-emerald-300/10 p-2 text-emerald-100">
          {action.upside}
        </div>
        <div className="rounded-md bg-amber-300/10 p-2 text-amber-100">
          {action.downside}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
        <span className="rounded-full bg-white/10 px-2 py-1">
          Energy {action.energyCost}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-1">
          Budget {fmtMoney(action.cost)}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-1">
          {cooldownLabel(action.cooldown)}
        </span>
      </div>
      {action.riskLevel === "high" ? (
        <label className="mt-3 flex items-start gap-2 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">
          <input className="mt-1" name="confirmRisk" type="checkbox" />I
          understand this can spike FUD, bot risk, fatigue, or trust loss.
        </label>
      ) : null}
      {action.disabledReason || coolingDown ? (
        <p className="mt-3 text-sm font-semibold text-amber-200">
          {action.disabledReason ?? cooldownLabel(action.cooldown)}
        </p>
      ) : null}
      <Button
        className="mt-4 w-full"
        disabled={disabled}
        tone={action.riskLevel === "high" ? "danger" : "primary"}
        type="submit"
      >
        Take action
      </Button>
    </form>
  );
}

export function ActiveTokenDashboard({
  token,
  chart,
  statGroups,
  actionsByIntent,
  recommendedActionId,
  events,
  actionFeed,
  pinnedEvent,
  message,
  error,
  nonceSeed,
  seasonId,
  userId
}: DashboardProps) {
  const flatActions = actionsByIntent.flatMap((group) => group.actions);
  const pinnedAction = pinnedEvent?.actionId
    ? flatActions.find((action) => action.id === pinnedEvent.actionId)
    : null;

  return (
    <div className="grid gap-4" data-testid="active-token-dashboard">
      {error ? (
        <Panel
          className="border-rose-300/30 bg-rose-400/10"
          data-testid="action-error"
        >
          <div className="flex gap-3 text-rose-100">
            <AlertTriangle aria-hidden="true" />
            <p className="font-bold">{error}</p>
          </div>
        </Panel>
      ) : null}
      {message ? (
        <Panel
          className="border-emerald-300/25 bg-emerald-300/10"
          data-testid="action-message"
        >
          <div className="flex gap-3 text-emerald-100">
            <CheckCircle2 aria-hidden="true" />
            <p className="font-bold">{message}</p>
          </div>
        </Panel>
      ) : null}

      <Panel
        className="bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(15,23,42,0.9))]"
        data-testid="manage-token-header"
      >
        <div className="grid gap-4 md:grid-cols-[9rem_1fr] md:items-center">
          <Image
            alt={`${token.name} placeholder art`}
            className="size-32 rounded-lg border border-white/10 bg-slate-950/50 p-3"
            height={128}
            priority
            src={token.imageUrl}
            width={128}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="good">{token.status}</Badge>
              <Badge>${token.ticker}</Badge>
              <span className="text-sm font-bold text-slate-300">
                Founder: {token.founderName}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Manage {token.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Keep attention useful, build belief, and reach graduation before
              fatigue or risk burns the run down.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-slate-950/45 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Market cap
                </p>
                <p className="font-black text-white">
                  {fmtMoney(token.marketCap)}
                </p>
              </div>
              <div className="rounded-md bg-slate-950/45 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Holders
                </p>
                <p className="font-black text-white">
                  {fmtNumber(token.holders)}
                </p>
              </div>
              <div className="rounded-md bg-slate-950/45 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Energy
                </p>
                <p className="font-black text-white">{token.energy}/100</p>
              </div>
              <div className="rounded-md bg-slate-950/45 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Budget
                </p>
                <p className="font-black text-white">
                  {fmtMoney(token.treasury)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm font-bold text-slate-200">
                <span>Graduation progress</span>
                <span>{token.graduationProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-950">
                <div
                  className="h-full rounded-full bg-emerald-300"
                  style={{ width: `${token.graduationProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <main className="grid gap-4">
          <Panel data-testid="market-chart-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Simulated market
                </p>
                <h2 className="text-xl font-black text-white">
                  Market cap movement
                </h2>
              </div>
              <Badge tone="good">Score {fmtNumber(token.score)}</Badge>
            </div>
            <div className="h-72 w-full" data-testid="token-market-chart">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={chart} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.16)" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={fmtMoney} width={72} />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff"
                    }}
                    formatter={(value) => fmtMoney(Number(value))}
                  />
                  <Area
                    dataKey="marketCap"
                    fill="rgba(52,211,153,0.22)"
                    stroke="#34d399"
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel data-testid="manage-stat-groups">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Plain-language stats
                </p>
                <h2 className="text-xl font-black text-white">
                  What changed and why
                </h2>
              </div>
              <Info
                aria-label="Growth, Belief, Community, and Risk summarize the raw token stats."
                className="text-emerald-300"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {statGroups.map((group) => (
                <div
                  className="rounded-md border border-white/10 bg-slate-950/50 p-4"
                  key={group.label}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-black text-white">{group.label}</h3>
                    <Badge tone={group.tone}>{group.value}</Badge>
                  </div>
                  <p className="mb-3 text-sm leading-5 text-slate-400">
                    {group.detail}
                  </p>
                  <StatBar
                    label={group.label}
                    tone={group.tone}
                    value={group.value}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Object.entries(token.stats).map(([label, value]) => (
                <StatBar
                  key={label}
                  label={label}
                  tone={
                    ["Bot Risk", "FUD Pressure", "Fatigue"].includes(label)
                      ? value > 65
                        ? "bad"
                        : "warn"
                      : "good"
                  }
                  value={value}
                />
              ))}
            </div>
          </Panel>

          <Panel data-testid="action-panel">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Action panel
              </p>
              <h2 className="text-xl font-black text-white">
                Choose the next move
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Actions spend energy and fake budget. The market reacts after
                each action, and risky plays require confirmation.
              </p>
            </div>
            <div className="grid gap-5">
              {actionsByIntent.map((group) => (
                <section key={group.intent}>
                  <h3 className="mb-3 flex items-center gap-2 font-black text-white">
                    <Flame className="text-emerald-300" size={18} />
                    {group.intent}
                  </h3>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {group.actions.map((action) => (
                      <ActionCard
                        action={{
                          ...action,
                          recommended: action.id === recommendedActionId
                        }}
                        key={action.id}
                        nonceSeed={nonceSeed}
                        tokenId={token.id}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Panel>
        </main>

        <aside className="grid content-start gap-4">
          <RealtimeStatus
            seasonId={seasonId}
            tokenId={token.id}
            userId={userId}
          />
          {pinnedEvent ? (
            <Panel
              className="border-amber-300/25 bg-amber-300/10"
              data-testid="active-situation-card"
            >
              <Badge tone="warn">Active situation</Badge>
              <h2 className="mt-3 text-xl font-black text-white">
                {pinnedEvent.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-amber-100">
                {pinnedEvent.description}
              </p>
              {pinnedAction ? (
                <div className="mt-4">
                  <ActionCard
                    action={{ ...pinnedAction, recommended: true }}
                    nonceSeed={`${nonceSeed}-event`}
                    slot="pinned"
                    tokenId={token.id}
                  />
                </div>
              ) : null}
            </Panel>
          ) : null}

          <Panel data-testid="recent-action-feed">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="text-emerald-300" size={18} />
              <h2 className="font-black text-white">Recent actions</h2>
            </div>
            <div className="grid gap-3">
              {actionFeed.length ? (
                actionFeed.map((item) => (
                  <div className="rounded-md bg-slate-950/55 p-3" key={item.id}>
                    <p className="font-black text-white">{item.actionType}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-300">
                      {item.explanation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-400">
                  No actions yet. Take the recommended move to see the market
                  react.
                </p>
              )}
            </div>
          </Panel>

          <Panel data-testid="manage-event-feed">
            <h2 className="font-black text-white">Event feed</h2>
            <div className="mt-3 grid gap-3">
              {events.map((event) => (
                <div className="rounded-md bg-slate-950/55 p-3" key={event.id}>
                  <Badge
                    tone={event.severity === "warning" ? "warn" : "neutral"}
                  >
                    {event.severity}
                  </Badge>
                  <p className="mt-2 font-black text-white">{event.title}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-300">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
