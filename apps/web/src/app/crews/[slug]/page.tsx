import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel, StatBar } from "@meme-foundry/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import {
  CREW_ACTION_CATALOG,
  type CrewActionId
} from "@/lib/server/crew-actions";
import { prisma } from "@meme-foundry/db";
import {
  ArrowRight,
  Crown,
  Radio,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import {
  featureCrewTokenAction,
  joinCrewAction,
  runCrewAction
} from "../actions";

export const dynamic = "force-dynamic";

type CrewDetailProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function canModerate(role?: string) {
  return role === "owner" || role === "mod";
}

function cooldownText(seconds: number) {
  if (seconds <= 0) return "Ready now";
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min cooldown`;
}

function noticeText(value?: string) {
  if (value === "joined") return "You joined the crew.";
  if (value === "featured") return "Featured launch updated.";
  if (value?.startsWith("action-")) {
    const actionId = value.replace("action-", "") as CrewActionId;
    const label = CREW_ACTION_CATALOG[actionId]?.label ?? "Crew action";
    return `${label} landed. Crew score and launch stats updated.`;
  }
  return null;
}

export default async function CrewDetailPage({
  params,
  searchParams
}: CrewDetailProps) {
  const [{ slug }, query, session] = await Promise.all([
    params,
    searchParams,
    auth()
  ]);
  const crew = await prisma.crew.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, actions: true } },
      actions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { creator: true, token: true }
      },
      events: { orderBy: { createdAt: "desc" }, take: 12 },
      featuredToken: { include: { user: true, crew: true } },
      members: {
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        include: { user: true }
      },
      season: true
    }
  });
  if (!crew) notFound();

  const rank =
    (await prisma.crew.count({
      where: { score: { gt: crew.score }, moderationStatus: "active" }
    })) + 1;
  const sessionUserId = session?.user.id;
  const membership = crew.members.find(
    (member) => member.userId === sessionUserId
  );
  const liveTokens = canModerate(membership?.role)
    ? await prisma.launchToken.findMany({
        where: { status: "live" },
        orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
        take: 50,
        include: { user: true }
      })
    : [];
  const notice = noticeText(firstParam(query, "notice"));
  const error = firstParam(query, "error");
  const latestByAction = new Map<string, Date>();
  for (const action of crew.actions) {
    if (!latestByAction.has(action.actionType)) {
      latestByAction.set(action.actionType, action.createdAt);
    }
  }
  const now = Date.now();

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="crew-detail-page">
        {notice ? (
          <Panel
            className="border-emerald-300/25 bg-emerald-300/10"
            data-testid="crew-notice"
          >
            <p className="font-bold text-emerald-100">{notice}</p>
          </Panel>
        ) : null}
        {error ? (
          <Panel
            className="border-amber-300/25 bg-amber-300/10"
            data-testid="crew-error"
          >
            <p className="font-bold text-amber-100">{error}</p>
          </Panel>
        ) : null}

        <Panel className="border-cyan-300/25 bg-[linear-gradient(145deg,rgba(34,211,238,0.13),rgba(15,23,42,0.94))]">
          <div className="grid gap-5 xl:grid-cols-[1fr_20rem] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={crew.moderationStatus === "active" ? "good" : "warn"}
                >
                  {crew.moderationStatus}
                </Badge>
                <Badge>Rank #{rank}</Badge>
                {membership ? (
                  <Badge tone="good">{membership.role}</Badge>
                ) : null}
                {crew.season ? <Badge>{crew.season.name}</Badge> : null}
              </div>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                {crew.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {crew.description ??
                  crew.tagline ??
                  "This crew coordinates fictional launch support through shared energy, resources, and clear action tradeoffs."}
              </p>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-cyan-200">
                <Trophy aria-hidden="true" size={18} />
                <span className="text-sm font-black uppercase">Crew score</span>
              </div>
              <p className="text-4xl font-black text-white">
                {crew.score.toLocaleString()}
              </p>
              <div className="grid gap-3">
                <StatBar label="Energy" value={crew.energy} />
                <StatBar label="Resources" tone="warn" value={crew.resources} />
              </div>
            </div>
          </div>
        </Panel>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel data-testid="featured-launch-panel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-200">
                  Featured launch
                </p>
                <h2 className="text-2xl font-black text-white">
                  Support target
                </h2>
              </div>
              <Zap className="text-lime-300" aria-hidden="true" />
            </div>
            {crew.featuredToken ? (
              <Link
                className="grid gap-3 rounded-lg border border-lime-300/25 bg-lime-300/10 p-4 hover:bg-lime-300/15 sm:grid-cols-[1fr_10rem] sm:items-center"
                href={`/token/${crew.featuredToken.id}` as Route}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-black text-white">
                      {crew.featuredToken.name}
                    </h3>
                    <Badge>${crew.featuredToken.ticker}</Badge>
                    <Badge tone="good">{crew.featuredToken.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-300">
                    Founder {crew.featuredToken.user.username}. Crew actions
                    currently affect this launch.
                  </p>
                </div>
                <div className="rounded-md bg-slate-950/65 p-3 text-right">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Score
                  </p>
                  <p className="text-2xl font-black text-lime-200">
                    {crew.featuredToken.score.toLocaleString()}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/45 p-5">
                <h3 className="font-black text-white">
                  No launch featured yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Owners and mods can pick a live launch for the crew to
                  support.
                </p>
              </div>
            )}

            {canModerate(membership?.role) ? (
              <form
                action={featureCrewTokenAction}
                className="relative z-20 mt-4 grid gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-4"
                data-testid="feature-token-form"
              >
                <input name="crewId" type="hidden" value={crew.id} />
                <input name="slug" type="hidden" value={crew.slug} />
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Feature live launch
                  <select
                    className="min-h-11 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-lime-300"
                    defaultValue={crew.featuredTokenId ?? liveTokens[0]?.id}
                    name="tokenId"
                    required
                  >
                    {liveTokens.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.name} (${token.ticker}) by {token.user.username}
                      </option>
                    ))}
                  </select>
                </label>
                <Button disabled={liveTokens.length === 0} type="submit">
                  Feature launch
                </Button>
              </form>
            ) : null}

            {!membership ? (
              session?.user ? (
                <form
                  action={joinCrewAction}
                  className="mt-4"
                  data-testid="join-crew-form"
                >
                  <input name="crewId" type="hidden" value={crew.id} />
                  <input name="slug" type="hidden" value={crew.slug} />
                  <Button type="submit">Join crew</Button>
                </form>
              ) : (
                <Link
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300"
                  href="/signin"
                >
                  Sign in to join
                </Link>
              )
            ) : null}
          </Panel>

          <Panel data-testid="crew-member-list">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-black text-white">
                <Users className="text-cyan-300" size={18} /> Members
              </h2>
              <Badge>{crew._count.members}</Badge>
            </div>
            <div className="grid gap-2">
              {crew.members.map((member) => (
                <div
                  className="grid min-w-0 gap-2 rounded-md bg-slate-950/55 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={member.id}
                >
                  <div className="min-w-0">
                    <p className="break-words font-black text-white">
                      {member.user.username}
                    </p>
                    <p className="text-xs text-slate-400">
                      Joined {member.joinedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone={member.role === "owner" ? "good" : "neutral"}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
          <Panel data-testid="crew-action-catalog">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-200">
                  Crew actions
                </p>
                <h2 className="text-2xl font-black text-white">
                  Support featured launch
                </h2>
              </div>
              <Sparkles className="text-pink-300" aria-hidden="true" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.values(CREW_ACTION_CATALOG).map((action) => {
                const latest = latestByAction.get(action.id);
                const remainingSeconds = latest
                  ? Math.max(
                      0,
                      Math.ceil(
                        (latest.getTime() +
                          action.cooldownSeconds * 1000 -
                          now) /
                          1000
                      )
                    )
                  : 0;
                const disabledReason = !membership
                  ? "Join this crew first."
                  : !crew.featuredToken
                    ? "Feature a live launch first."
                    : crew.energy < action.energyCost
                      ? "Not enough crew energy."
                      : crew.resources < action.resourceCost
                        ? "Not enough crew resources."
                        : remainingSeconds > 0
                          ? cooldownText(remainingSeconds)
                          : null;
                return (
                  <form
                    action={runCrewAction}
                    className="relative z-20 rounded-md border border-white/10 bg-slate-950/55 p-4"
                    data-testid={`crew-action-${action.id}`}
                    key={action.id}
                  >
                    <input name="crewId" type="hidden" value={crew.id} />
                    <input name="slug" type="hidden" value={crew.slug} />
                    <input name="actionId" type="hidden" value={action.id} />
                    <input
                      name="nonce"
                      type="hidden"
                      value={`${crew.id}-${action.id}-${now}`}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-white">
                          {action.label}
                        </h3>
                        <p className="mt-2 text-sm leading-5 text-slate-300">
                          {action.plainPurpose}
                        </p>
                      </div>
                      <Shield className="shrink-0 text-cyan-300" size={22} />
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
                        Resources {action.resourceCost}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        {cooldownText(remainingSeconds)}
                      </span>
                    </div>
                    {disabledReason ? (
                      <p className="mt-3 text-sm font-semibold text-amber-200">
                        {disabledReason}
                      </p>
                    ) : null}
                    <Button
                      className="mt-4 w-full"
                      disabled={Boolean(disabledReason)}
                      type="submit"
                    >
                      Crew support
                    </Button>
                  </form>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel data-testid="crew-event-feed">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Radio className="text-lime-300" size={18} /> Event feed
              </h2>
              <div className="grid gap-3">
                {crew.events.length ? (
                  crew.events.map((event) => (
                    <div
                      className="rounded-md border border-white/10 bg-slate-950/55 p-3"
                      key={event.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-white">{event.title}</p>
                        <Badge
                          tone={
                            event.severity === "warning" ? "warn" : "neutral"
                          }
                        >
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-400">
                        {event.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-950/45 p-3 text-sm text-slate-400">
                    Crew events will appear here after creation, joining,
                    featuring launches, and support actions.
                  </p>
                )}
              </div>
            </Panel>

            <Panel data-testid="crew-action-feed">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <Crown className="text-amber-300" size={18} /> Recent actions
              </h2>
              <div className="grid gap-2">
                {crew.actions.length ? (
                  crew.actions.slice(0, 8).map((action) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-slate-950/55 p-3"
                      key={action.id}
                    >
                      <div>
                        <p className="font-black text-white">
                          {CREW_ACTION_CATALOG[
                            action.actionType as CrewActionId
                          ]?.label ?? action.actionType}
                        </p>
                        <p className="text-xs text-slate-400">
                          {action.creator.username}
                          {action.token ? ` -> ${action.token.ticker}` : ""}
                        </p>
                      </div>
                      <Badge>Energy {action.energyCost}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-950/45 p-3 text-sm text-slate-400">
                    No crew support actions yet.
                  </p>
                )}
              </div>
              <Link
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-100 hover:bg-white/10"
                href="/crews"
              >
                Browse crews <ArrowRight size={16} />
              </Link>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
