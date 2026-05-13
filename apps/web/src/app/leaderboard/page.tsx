import type { Route } from "next";
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
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { tokenImage } from "@/lib/assets";
import { formatCompactCurrency, graduationProgress } from "@/lib/game-state";
import { prisma } from "@meme-foundry/db";
import { Medal, Search, Sparkles, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type LeaderboardProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const tabs = [
  ["score", "Score"],
  ["market", "Market cap"],
  ["holders", "Holders"],
  ["graduated", "Graduated"]
] as const;

function readTab(params: Record<string, string | string[] | undefined>) {
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  return tabs.some(([id]) => id === raw) ? raw! : "score";
}

function readSearch(params: Record<string, string | string[] | undefined>) {
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  return raw?.trim().slice(0, 64) ?? "";
}

function formatValue(category: string, value: number) {
  if (category === "market") return formatCompactCurrency(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

export default async function LeaderboardPage({
  searchParams
}: LeaderboardProps) {
  const query = await searchParams;
  const category = readTab(query);
  const search = readSearch(query);
  const session = await auth();
  const season = await prisma.season.findFirst({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const snapshots = season
    ? await prisma.scoreSnapshot.findMany({
        where: { seasonId: season.id, category },
        orderBy: [{ rank: "asc" }, { score: "desc" }],
        take: 50
      })
    : [];
  const tokens = await prisma.launchToken.findMany({
    where: { id: { in: snapshots.map((snapshot) => snapshot.entityId) } },
    include: { user: true, crew: true }
  });
  const tokenById = new Map(tokens.map((token) => [token.id, token]));
  const rows = snapshots
    .map((snapshot) => {
      const token = tokenById.get(snapshot.entityId);
      return token ? { snapshot, token } : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .filter(({ token }) => {
      if (!search) return true;
      const haystack = [
        token.name,
        token.ticker,
        token.user.username,
        token.crew?.name,
        token.narrative,
        token.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  const myRow =
    session?.user?.id &&
    rows.find(({ token }) => token.userId === session.user.id);
  const nearbyRows = myRow
    ? rows.filter(
        ({ snapshot }) =>
          snapshot.rank &&
          myRow.snapshot.rank &&
          Math.abs(snapshot.rank - myRow.snapshot.rank) <= 2
      )
    : rows.slice(0, 5);
  const rewardText =
    category === "graduated"
      ? "Graduated launches earn season legacy badges."
      : category === "holders"
        ? "Holder rank rewards steady community support."
        : category === "market"
          ? "Market rank rewards controlled attention growth."
          : "Score rank rewards balanced growth, trust, community, and risk control.";

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="leaderboard-page">
        <NeonPanel tone="amber">
          <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)_18rem] lg:items-center">
            <div className="overflow-hidden rounded-lg border border-amber-300/25 bg-slate-950/70 p-3 shadow-[0_0_34px_rgba(251,191,36,0.14)]">
              <Image
                alt={`${season?.name ?? "Active season"} leaderboard art`}
                className="mx-auto aspect-[4/3] w-full object-contain"
                height={168}
                priority
                src="/assets/game/share/foundry-workshop.png"
                width={224}
              />
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Badge tone="warn">
                  {tabs.find(([id]) => id === category)?.[1]}
                </Badge>
                <Badge tone="neutral">{rows.length} ranked</Badge>
              </div>
            </div>
            <div>
              <Kicker className="text-amber-200">Season scoped</Kicker>
              <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">
                Season leaderboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Rankings come from stored launch state and refreshed score
                snapshots. Tabs let players compare total score, market cap,
                holders, and graduated launches without real trading.
              </p>
            </div>
            <MetricChip
              label="Active season"
              tone="warn"
              value={season?.name ?? "No active season"}
            />
          </div>
        </NeonPanel>

        <Panel data-testid="leaderboard-tabs">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <form
              action="/leaderboard"
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]"
              data-testid="leaderboard-search"
            >
              <input name="tab" type="hidden" value={category} />
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase text-slate-400">
                  Search token, founder, crew, or narrative
                </span>
                <input
                  className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-300"
                  defaultValue={search}
                  name="q"
                  placeholder="frog, snack, founder..."
                />
              </label>
              <button className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-200">
                <Search size={16} /> Filter
              </button>
            </form>
            <div className="rounded-md border border-white/10 bg-slate-950/55 p-3">
              <p className="text-xs font-black uppercase text-slate-400">
                Visible rows
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {rows.length}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-2 xl:grid-cols-[13rem_minmax(0,1fr)_20rem] xl:gap-4">
            <nav
              aria-label="Leaderboard categories"
              className="sticky top-3 grid gap-2"
              data-testid="leaderboard-side-menu"
            >
              {tabs.map(([id, label]) => (
                <Link
                  className={`flex min-h-10 items-center break-words rounded-md border px-2 py-2 text-xs font-black leading-4 sm:px-3 sm:text-sm ${category === id ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-amber-300/40 hover:bg-white/10"}`}
                  href={`/leaderboard?tab=${id}` as Route}
                  key={id}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div
              className="grid min-w-0 gap-3"
              data-testid="leaderboard-results"
            >
              {rows.map(({ snapshot, token }) => {
                return (
                  <Link
                    className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-3 hover:border-amber-300/50 lg:grid-cols-[4rem_minmax(0,1fr)_12rem] lg:items-center lg:p-4"
                    href={`/token/${token.id}` as Route}
                    key={snapshot.id}
                  >
                    <div className="flex items-center gap-3 md:block">
                      <span className="grid size-10 place-items-center rounded-full bg-amber-300 text-lg font-black text-slate-950">
                        {snapshot.rank}
                      </span>
                      {snapshot.rank && snapshot.rank <= 3 ? (
                        <Medal className="text-amber-300 sm:mt-2" size={20} />
                      ) : null}
                      <span className="mt-2 inline-flex rounded-full border border-lime-300/20 bg-lime-300/10 px-2 py-1 text-xs font-black text-lime-100">
                        {snapshot.rank && snapshot.rank <= 10
                          ? "Rising"
                          : "Holding"}
                      </span>
                    </div>
                    <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
                      <Image
                        alt={`${token.name} token art`}
                        className="size-16 rounded-lg border border-white/10 bg-slate-950/80 object-cover p-1"
                        height={64}
                        src={tokenImage(token)}
                        width={64}
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h2 className="min-w-0 break-words text-lg font-black text-white sm:text-xl">
                            {token.name}
                          </h2>
                          <Badge>${token.ticker}</Badge>
                          <Badge
                            tone={
                              token.status === "graduated" ? "good" : "neutral"
                            }
                          >
                            {token.status}
                          </Badge>
                        </div>
                        <p className="mt-1 break-words text-sm text-slate-400">
                          Founder {token.user.username}
                          {token.crew ? ` · Crew ${token.crew.name}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                          <span className="rounded-full bg-white/10 px-2 py-1">
                            {token.narrative}
                          </span>
                          <span className="rounded-full bg-white/10 px-2 py-1">
                            Graduation {graduationProgress(token)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 rounded-md bg-slate-900/80 p-3 text-left sm:text-right">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {tabs.find(([id]) => id === category)?.[1]}
                      </p>
                      <p className="mt-1 text-2xl font-black text-amber-200">
                        {formatValue(category, snapshot.score)}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {rows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/45 p-6 text-center">
                  <TrendingUp className="mx-auto text-slate-400" />
                  <h2 className="mt-3 text-xl font-black text-white">
                    No rankings yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Run the world refresh worker after launches exist to create
                    season-scoped score snapshots.
                  </p>
                </div>
              ) : null}
            </div>
            <aside className="col-span-2 grid content-start gap-3 xl:col-span-1">
              <Panel data-testid="leaderboard-player-rank">
                <h2 className="flex items-center gap-2 font-black text-white">
                  <Sparkles className="text-amber-300" size={18} /> Your rank
                </h2>
                {myRow ? (
                  <div className="mt-3">
                    <Badge tone="good">#{myRow.snapshot.rank}</Badge>
                    <p className="mt-2 font-black text-white">
                      {myRow.token.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatValue(category, myRow.snapshot.score)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Launch or rank a token in this category to see your position
                    here.
                  </p>
                )}
              </Panel>
              <Panel data-testid="leaderboard-rivals">
                <h2 className="font-black text-white">Nearby rivals</h2>
                <div className="mt-3 grid gap-2">
                  {nearbyRows.map(({ snapshot, token }) => (
                    <Link
                      className="rounded-md border border-white/10 bg-slate-950/55 p-3 hover:border-amber-300/40"
                      href={`/token/${token.id}` as Route}
                      key={`near-${snapshot.id}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-white">
                          #{snapshot.rank} {token.ticker}
                        </p>
                        <Badge tone="warn">
                          {snapshot.rank && snapshot.rank <= 10
                            ? "rising"
                            : "live"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatValue(category, snapshot.score)}
                      </p>
                    </Link>
                  ))}
                </div>
              </Panel>
              <Panel data-testid="leaderboard-live-changes">
                <h2 className="font-black text-white">Live movement</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Rank changes refresh when the world state worker updates score
                  snapshots. Watch for action, support, and crew boosts.
                </p>
                <ProgressMeter label="Season pressure" tone="warn" value={72} />
              </Panel>
              <Panel data-testid="leaderboard-rewards">
                <Badge tone="good">Rewards</Badge>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {rewardText}
                </p>
              </Panel>
            </aside>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
