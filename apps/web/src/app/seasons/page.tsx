import Link from "next/link";
import { Badge, Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import { formatCompactCurrency } from "@/lib/game-state";
import { narrativeOpportunity } from "@/lib/server/world-state";
import { prisma } from "@meme-foundry/db";
import { Activity, Flame, RadioTower, Timer, TrendingUp } from "lucide-react";

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
  const [narratives, activeLaunches, eventFeed, topTokens] = season
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
        })
      ])
    : ([[], 0, [], []] as const);

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="seasons-page">
        <Panel className="border-pink-300/20 bg-[linear-gradient(145deg,rgba(236,72,153,0.14),rgba(15,23,42,0.92))]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
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
              <div className="grid min-w-64 gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-slate-950/55 p-3">
                  <Timer className="mb-2 text-emerald-300" size={18} />
                  <p className="text-2xl font-black text-white">
                    {daysLeft(season.endsAt)}d
                  </p>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    left
                  </p>
                </div>
                <div className="rounded-md bg-slate-950/55 p-3">
                  <RadioTower className="mb-2 text-pink-300" size={18} />
                  <p className="text-2xl font-black text-white">
                    {activeLaunches}
                  </p>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    live
                  </p>
                </div>
                <div className="rounded-md bg-slate-950/55 p-3">
                  <Flame className="mb-2 text-amber-300" size={18} />
                  <p className="text-2xl font-black text-white">
                    {narratives.length}
                  </p>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    metas
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white">
                          {narrative.name}
                        </h3>
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
                      <Badge tone={toneFor(label)}>{label}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {[
                        ["Heat", narrative.heat, "bg-pink-400"],
                        ["Saturation", narrative.saturation, "bg-violet-400"],
                        ["Fatigue", narrative.fatigue, "bg-amber-300"]
                      ].map(([name, value, color]) => (
                        <div key={name}>
                          <div className="mb-1 flex justify-between text-sm font-bold text-slate-300">
                            <span>{name}</span>
                            <span>{value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full ${color}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
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
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
