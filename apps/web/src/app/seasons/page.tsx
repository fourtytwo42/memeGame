import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  Kicker,
  MetricChip,
  NeonPanel,
  Panel,
  ProgressMeter
} from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import { narrativeImage } from "@/lib/assets";
import { formatCompactCurrency } from "@/lib/game-state";
import { narrativeOpportunity } from "@/lib/server/world-state";
import { prisma } from "@meme-foundry/db";
import { Activity, RadioTower, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function daysLeft(endsAt: Date) {
  return Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000));
}

function toneFor(label: string) {
  if (label === "Good opportunity" || label === "Undiscovered") return "good";
  if (label === "Cooling off" || label === "Crowded") return "warn";
  return "neutral";
}

export default async function SeasonsPage() {
  const season = await prisma.season.findFirst({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const [narratives, activeLaunches, eventFeed, topTokens, topCrews] = season
    ? await Promise.all([
        prisma.narrativeMeta.findMany({
          where: { seasonId: season.id },
          orderBy: [{ heat: "desc" }, { saturation: "asc" }]
        }),
        prisma.launchToken.count({
          where: { seasonId: season.id, status: "live" }
        }),
        prisma.gameEvent.findMany({
          where: { seasonId: season.id },
          orderBy: { createdAt: "desc" },
          take: 10
        }),
        prisma.launchToken.findMany({
          where: { seasonId: season.id },
          orderBy: [{ simulatedMarketCap: "desc" }, { score: "desc" }],
          take: 6,
          include: { user: true }
        }),
        prisma.crew.findMany({
          where: { seasonId: season.id, moderationStatus: "active" },
          orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
          take: 5
        })
      ])
    : ([[], 0, [], [], []] as const);

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="seasons-page">
        <NeonPanel tone="pink">
          <div className="grid gap-5 lg:grid-cols-[10rem_minmax(0,1fr)_22rem] lg:items-center">
            <Image
              alt="Meme Foundry season banner mark"
              className="mx-auto size-36 object-contain"
              height={144}
              priority
              src="/assets/game/share/foundry-workshop.png"
              width={144}
            />
            <div>
              <Kicker>Season command map</Kicker>
              <Badge tone="good">Active season</Badge>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                {season?.name ?? "No active season"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Shared season state turns every launch into part of the same
                attention economy. Hot narratives help growth, crowded ones add
                saturation, and tired ones push fatigue.
              </p>
            </div>
            {season ? (
              <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MetricChip
                  label="Time left"
                  tone="good"
                  value={`${daysLeft(season.endsAt)}d`}
                />
                <MetricChip
                  label="Live launches"
                  tone="hot"
                  value={activeLaunches}
                />
                <MetricChip
                  label="Narratives"
                  tone="warn"
                  value={narratives.length}
                />
              </div>
            ) : null}
          </div>
        </NeonPanel>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <Panel data-testid="narrative-heat-map">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-200">
                  Narrative heat map
                </p>
                <h2 className="text-xl font-black text-white">
                  Hot, crowded, or cooling
                </h2>
              </div>
              <Activity className="text-pink-300" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {narratives.map((narrative) => {
                const label = narrativeOpportunity(narrative);
                return (
                  <article
                    className="rounded-lg border border-white/10 bg-slate-950/55 p-4"
                    data-testid={`narrative-${narrative.slug}`}
                    key={narrative.id}
                  >
                    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                      <Image
                        alt={`${narrative.name} narrative art`}
                        className="size-18 rounded-md border border-white/10 bg-slate-950/70 object-contain p-1"
                        height={72}
                        src={narrativeImage(narrative.name ?? narrative.slug)}
                        width={72}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-white">
                            {narrative.name}
                          </h3>
                          <Badge tone={toneFor(label)}>{label}</Badge>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-400">
                          {label === "Good opportunity"
                            ? "Hot enough to help growth without being exhausted."
                            : label === "Hot but crowded"
                              ? "Attention is high, but many launches are chasing it."
                              : label === "Cooling off"
                                ? "Fatigue is high. Use trust or community before loud moves."
                                : label === "Undiscovered"
                                  ? "Low crowding means room for a strong identity."
                                  : "Stable meta with predictable tradeoffs."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <ProgressMeter
                        label="Heat"
                        tone="hot"
                        value={narrative.heat}
                      />
                      <ProgressMeter
                        label="Saturation"
                        tone="warn"
                        value={narrative.saturation}
                      />
                      <ProgressMeter
                        label="Fatigue"
                        tone="bad"
                        value={narrative.fatigue}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        Active launches {narrative.activeLaunches}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        Meme potential {narrative.memePotential}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <aside className="grid content-start gap-4">
            <Panel data-testid="season-top-launches">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <TrendingUp className="text-lime-300" size={18} /> Top launches
              </h2>
              <div className="grid gap-3">
                {topTokens.map((token, index) => (
                  <Link
                    className="rounded-md border border-white/10 bg-slate-950/55 p-3 hover:border-emerald-300/40"
                    href={`/launch/${token.id}/manage`}
                    key={token.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-white">
                          {index + 1}. {token.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          ${token.ticker} · {token.user.username}
                        </p>
                      </div>
                      <Badge
                        tone={token.status === "graduated" ? "good" : "neutral"}
                      >
                        {token.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-black text-lime-300">
                      {formatCompactCurrency(token.simulatedMarketCap)}
                    </p>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel data-testid="season-event-feed">
              <h2 className="font-black text-white">Public season feed</h2>
              <div className="mt-4 grid gap-3">
                {eventFeed.map((event) => (
                  <div
                    className="rounded-md bg-slate-950/55 p-3"
                    key={event.id}
                  >
                    <Badge
                      tone={event.severity === "warning" ? "warn" : "neutral"}
                    >
                      {event.severity}
                    </Badge>
                    <p className="mt-2 font-black text-white">{event.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel data-testid="season-top-crews">
              <h2 className="mb-4 flex items-center gap-2 font-black text-white">
                <RadioTower className="text-cyan-300" size={18} /> Top crews
              </h2>
              <div className="grid gap-3">
                {topCrews.map((crew, index) => (
                  <Link
                    className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-md border border-white/10 bg-slate-950/55 p-3 hover:border-cyan-300/40"
                    href={`/crews/${crew.slug}`}
                    key={crew.id}
                  >
                    <Image
                      alt={`${crew.name} crew avatar`}
                      className="size-12 rounded-md border border-white/10 object-contain p-1"
                      height={48}
                      src={
                        crew.avatarUrl ??
                        "/assets/game/crews/default-avatar.png"
                      }
                      width={48}
                    />
                    <div>
                      <p className="font-black text-white">
                        {index + 1}. {crew.name}
                      </p>
                      <p className="text-sm font-bold text-cyan-200">
                        Score {crew.score.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
            <Panel data-testid="season-daily-challenge">
              <Badge tone="good">Daily challenge</Badge>
              <h2 className="mt-3 font-black text-white">
                Launch into an uncrowded trend
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pick a narrative with low saturation, then use a community or
                trust action before chasing raw hype.
              </p>
            </Panel>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
