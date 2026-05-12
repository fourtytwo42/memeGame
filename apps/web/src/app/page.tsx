import {
  Flame,
  Info,
  LogOut,
  Rocket,
  ShieldAlert,
  Trophy,
  Users
} from "lucide-react";
import { auth } from "@/auth";
import { signOutAction } from "@/app/signin/actions";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

const statGroups = [
  {
    label: "Growth",
    value: "Needs attention",
    detail: "Get eyes on the launch without burning trust."
  },
  {
    label: "Belief",
    value: "Stable",
    detail: "Trust keeps holders around when chaos hits."
  },
  {
    label: "Community",
    value: "Forming",
    detail: "Community helps the token recover from bad events."
  },
  {
    label: "Risk",
    value: "Low",
    detail: "Bot risk, FUD, and fatigue are still manageable."
  }
];

const navItems = ["Play", "Launch", "Board", "Seasons", "Crews", "Profile"];

export default async function HomePage() {
  const session = await auth();
  const [activeSeason, tokenCount, narrativeCount] = await Promise.all([
    prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    }),
    prisma.launchToken.count(),
    prisma.narrativeMeta.count()
  ]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1f2937,transparent_32rem),#0b0d12] px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 shadow-2xl shadow-black/20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Active season
            </p>
            <p className="text-xs font-semibold text-slate-400">
              {activeSeason?.name ?? "Not seeded yet"} · {tokenCount} tokens ·{" "}
              {narrativeCount} narratives
            </p>
            <h1 className="text-xl font-black tracking-normal text-white sm:text-2xl">
              Meme Foundry
            </h1>
          </div>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {navItems.map((item) => (
              <a
                key={item}
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                href="#play"
              >
                {item}
              </a>
            ))}
          </nav>
          {session?.user ? (
            <form action={signOutAction}>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
                type="submit"
              >
                <LogOut aria-hidden="true" size={18} />
                Sign out
              </button>
            </form>
          ) : (
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300"
              href="/signin"
            >
              <Rocket aria-hidden="true" size={18} />
              Sign in
            </a>
          )}
        </header>

        <section
          className="grid flex-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]"
          id="play"
        >
          <div className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(20,184,166,0.18),rgba(15,23,42,0.92))] p-5 shadow-2xl shadow-black/30 sm:p-8">
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-200">
                New player command hub
              </p>
              <h2 className="mb-4 text-4xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">
                Launch a fake token. Keep it alive. Graduate before it burns
                out.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Start with one clear move: create a token, pick a trend, and
                take a recommended action. The game explains what improved, what
                got risky, and what to do next.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ActionCard
                icon={<Rocket size={20} />}
                title="Start launch"
                text="Create a token in under three minutes."
                strong
              />
              <ActionCard
                icon={<Flame size={20} />}
                title="Read the room"
                text="See which trends are hot or crowded."
              />
              <ActionCard
                icon={<Users size={20} />}
                title="Get support"
                text="Other founders and crews can help."
              />
            </div>
          </div>

          <aside className="grid gap-4">
            <section
              className="rounded-lg border border-white/10 bg-white/[0.05] p-5"
              data-testid="recommended-action-card"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Recommended next action
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    Post your first meme
                  </h3>
                </div>
                <Info
                  aria-label="This action boosts attention but can add fatigue."
                  className="text-emerald-300"
                />
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-300">
                Your launch needs attention. This helps Growth, adds a little
                Risk, and teaches the core tradeoff.
              </p>
              <a
                className="block w-full rounded-md bg-white px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-200"
                href={session?.user ? "/play" : "/signin"}
              >
                Take recommended action
              </a>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Launch readout
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {statGroups.map((group) => (
                  <div
                    key={group.label}
                    className="rounded-md border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h4 className="font-black text-white">{group.label}</h4>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                        {group.value}
                      </span>
                    </div>
                    <p className="text-sm leading-5 text-slate-400">
                      {group.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <MiniPanel
                icon={<Trophy size={18} />}
                label="Goal"
                value="Graduate"
              />
              <MiniPanel
                icon={<ShieldAlert size={18} />}
                label="Danger"
                value="Fatigue"
              />
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ActionCard({
  icon,
  title,
  text,
  strong = false
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  strong?: boolean;
}) {
  return (
    <article
      className={
        strong
          ? "rounded-lg bg-emerald-300 p-4 text-slate-950"
          : "rounded-lg border border-white/10 bg-slate-950/45 p-4 text-white"
      }
    >
      <div className="mb-3 inline-flex rounded-md bg-black/10 p-2">{icon}</div>
      <h3 className="mb-1 text-lg font-black">{title}</h3>
      <p
        className={
          strong
            ? "text-sm leading-6 text-slate-800"
            : "text-sm leading-6 text-slate-300"
        }
      >
        {text}
      </p>
    </article>
  );
}

function MiniPanel({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 text-emerald-300">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
