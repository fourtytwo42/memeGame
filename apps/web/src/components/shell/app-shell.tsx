import type { Route } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { IconHelpButton } from "@/components/shell/icon-help";
import { signOutAction } from "@/app/signin/actions";
import { prisma } from "@meme-foundry/db";
import {
  Bell,
  CircleHelp,
  Gauge,
  Home,
  LogOut,
  Rocket,
  Shield,
  Trophy,
  Users,
  Zap
} from "lucide-react";

type NavItem = { href: Route; label: string; icon: typeof Home };

const primaryNav: NavItem[] = [
  { href: "/play", label: "Play", icon: Home },
  { href: "/launch/new", label: "Launch", icon: Rocket },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/seasons", label: "Seasons", icon: Gauge },
  { href: "/crews", label: "Crews", icon: Users },
  { href: "/profile", label: "Profile", icon: CircleHelp }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const [season, activeToken] = await Promise.all([
    prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    }),
    session?.user
      ? prisma.launchToken.findFirst({
          where: { userId: session.user.id, status: { in: ["live", "draft"] } },
          orderBy: { updatedAt: "desc" }
        })
      : null
  ]);
  const nav: NavItem[] =
    session?.user.role === "admin"
      ? [...primaryNav, { href: "/admin", label: "Admin", icon: Shield }]
      : primaryNav;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.16),transparent_30rem),#07090d] pb-24 text-slate-100 md:pb-0 md:grid md:grid-cols-[14rem_1fr]">
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-56 border-r border-white/10 bg-slate-950/92 px-4 py-4 backdrop-blur md:flex md:flex-col"
        data-testid="desktop-left-nav"
      >
        <Link className="grid gap-1 px-2" href="/play">
          <span className="text-3xl font-black italic tracking-wide text-white">
            MEME
          </span>
          <span className="-mt-2 text-2xl font-black italic text-pink-400">
            FOUNDRY
          </span>
        </Link>
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
            {season?.name ?? "No active season"}
          </p>
          {activeToken ? (
            <Link
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-lime-300/40 bg-lime-300/10 px-3 py-2 text-sm font-black text-lime-200 hover:bg-lime-300/20"
              data-testid="manage-launch-affordance"
              href={`/launch/${activeToken.id}/manage` as Route}
            >
              <Zap aria-hidden="true" size={16} />
              Manage {activeToken.ticker}
            </Link>
          ) : null}
        </div>
        <nav aria-label="Primary" className="mt-5 grid gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              className="group inline-flex min-h-12 items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-black uppercase tracking-wide text-slate-300 hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-200"
              href={item.href}
            >
              <item.icon
                aria-hidden="true"
                className="text-slate-400 group-hover:text-lime-300"
                size={19}
              />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-3">
          <IconHelpButton
            help="Notifications will show urgent launch events, crew support, and system health changes."
            label="Notifications"
          >
            <Bell aria-hidden="true" size={18} />
          </IconHelpButton>
          {session?.user ? (
            <form action={signOutAction}>
              <button
                aria-label="Sign out"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
                type="submit"
              >
                <LogOut aria-hidden="true" size={16} />
                Sign out
              </button>
            </form>
          ) : (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300"
              href="/signin"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur md:hidden"
        data-testid="app-shell-topbar"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link className="grid min-w-0 gap-0.5" href="/play">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              {season?.name ?? "No active season"}
            </span>
            <span className="truncate text-lg font-black text-white">
              Meme Foundry
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {activeToken ? (
              <Link
                aria-label={`Manage ${activeToken.ticker}`}
                className="inline-flex size-10 items-center justify-center rounded-md border border-lime-300/40 bg-lime-300/10 text-lime-200 hover:bg-lime-300/20"
                data-testid="manage-launch-affordance"
                href={`/launch/${activeToken.id}/manage` as Route}
              >
                <Zap aria-hidden="true" size={18} />
              </Link>
            ) : null}
            <IconHelpButton
              help="Notifications will show urgent launch events, crew support, and system health changes."
              label="Notifications"
            >
              <Bell aria-hidden="true" size={18} />
            </IconHelpButton>
            {session?.user ? (
              <form action={signOutAction}>
                <button
                  aria-label="Sign out"
                  className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
                  type="submit"
                >
                  <LogOut aria-hidden="true" size={16} />
                </button>
              </form>
            ) : (
              <Link
                className="inline-flex min-h-10 items-center rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300"
                href="/signin"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="min-w-0 md:col-start-2">
        <div className="mx-auto max-w-[94rem] px-4 py-4 sm:px-6 lg:px-6 xl:px-8">
          {children}
        </div>
      </div>

      <nav
        aria-label="Mobile primary"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur md:hidden"
        data-testid="mobile-bottom-nav"
      >
        {primaryNav.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            className="grid min-h-12 place-items-center gap-1 rounded-md text-[11px] font-bold text-slate-300 hover:bg-white/10 hover:text-white"
            href={item.href}
          >
            <item.icon aria-hidden="true" size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
