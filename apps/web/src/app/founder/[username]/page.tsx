import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";
import { formatCompactCurrency } from "@/lib/game-state";
import { prisma } from "@meme-foundry/db";
import { Award, Flame, HeartHandshake, Rocket, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

type FounderPageProps = {
  params: Promise<{ username: string }>;
};

export default async function FounderPage({ params }: FounderPageProps) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      founderProfile: true,
      tokens: {
        where: { status: { in: ["live", "graduated"] } },
        orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
        take: 12,
        include: { season: true, _count: { select: { supportActions: true } } }
      },
      supportActions: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { token: true }
      },
      crewMemberships: {
        include: { crew: true },
        orderBy: { joinedAt: "desc" },
        take: 8
      }
    }
  });
  if (!user) notFound();

  const profile = user.founderProfile;
  const totalScore = user.tokens.reduce((sum, token) => sum + token.score, 0);
  const graduated = user.tokens.filter(
    (token) => token.status === "graduated"
  ).length;

  return (
    <AppShell>
      <div className="grid gap-4" data-testid="founder-profile-page">
        <Panel className="border-lime-300/20 bg-[linear-gradient(145deg,rgba(132,204,22,0.14),rgba(15,23,42,0.94))]">
          <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-center">
            <div>
              <Badge tone="good">Founder profile</Badge>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                {profile?.displayName ?? user.name ?? user.username}
              </h1>
              <p className="mt-2 text-sm font-bold text-slate-300">
                @{user.username}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                {profile?.bio ??
                  "This founder is competing through fictional launches, crew support, and season score. No wallet, trading, or real liquidity is involved."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-950/55 p-3">
                <Trophy className="mb-2 text-amber-300" size={18} />
                <p className="text-2xl font-black text-white">{totalScore}</p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  score
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <Rocket className="mb-2 text-lime-300" size={18} />
                <p className="text-2xl font-black text-white">
                  {user.tokens.length}
                </p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  launches
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <Award className="mb-2 text-cyan-300" size={18} />
                <p className="text-2xl font-black text-white">{graduated}</p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  graduated
                </p>
              </div>
              <div className="rounded-md bg-slate-950/55 p-3">
                <Flame className="mb-2 text-pink-300" size={18} />
                <p className="text-2xl font-black text-white">
                  {profile?.reputation ?? 50}
                </p>
                <p className="text-xs font-bold uppercase text-slate-400">
                  reputation
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Panel data-testid="founder-launches">
            <h2 className="text-xl font-black text-white">Launches</h2>
            <div className="mt-4 grid gap-3">
              {user.tokens.map((token) => (
                <Link
                  className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-4 hover:border-lime-300/40 sm:grid-cols-[1fr_9rem]"
                  href={`/token/${token.id}`}
                  key={token.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-white">
                        {token.name}
                      </h3>
                      <Badge>${token.ticker}</Badge>
                      <Badge
                        tone={token.status === "graduated" ? "good" : "neutral"}
                      >
                        {token.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {token.season?.name ?? "No season"} ·{" "}
                      {token._count.supportActions} support moves
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-900/80 p-3 text-right">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      market-style cap
                    </p>
                    <p className="mt-1 text-xl font-black text-lime-300">
                      {formatCompactCurrency(token.simulatedMarketCap)}
                    </p>
                  </div>
                </Link>
              ))}
              {user.tokens.length === 0 ? (
                <p className="rounded-md bg-slate-950/55 p-4 text-sm text-slate-300">
                  No public launches yet.
                </p>
              ) : null}
            </div>
          </Panel>

          <aside className="grid content-start gap-4">
            <Panel data-testid="founder-crews">
              <h2 className="font-black text-white">Crews</h2>
              <div className="mt-4 grid gap-3">
                {user.crewMemberships.map((membership) => (
                  <Link
                    className="rounded-md border border-white/10 bg-slate-950/55 p-3 hover:border-cyan-300/40"
                    href={`/crews/${membership.crew.slug}`}
                    key={membership.id}
                  >
                    <p className="font-black text-white">
                      {membership.crew.name}
                    </p>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {membership.role}
                    </p>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel data-testid="founder-support">
              <h2 className="flex items-center gap-2 font-black text-white">
                <HeartHandshake className="text-lime-300" size={18} />
                Recent support
              </h2>
              <div className="mt-4 grid gap-3">
                {user.supportActions.map((action) => (
                  <Link
                    className="rounded-md bg-slate-950/55 p-3 hover:bg-slate-900"
                    href={`/token/${action.tokenId}`}
                    key={action.id}
                  >
                    <p className="font-bold text-white">{action.actionType}</p>
                    <p className="text-sm text-slate-400">
                      {action.token.name}
                    </p>
                  </Link>
                ))}
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
