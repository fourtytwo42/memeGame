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
    <main className="grid min-h-screen grid-cols-[4.5rem_1fr] bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.16),transparent_30rem),#07090d] text-slate-100 sm:grid-cols-[14rem_1fr]">
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-[4.5rem] flex-col border-r border-white/10 bg-slate-950/92 px-2 py-3 backdrop-blur sm:w-56 sm:px-4 sm:py-4"
        data-testid="desktop-left-nav"
      >
        <Link
          aria-label="Meme Foundry home"
          className="grid place-items-center gap-1 px-1 sm:block sm:px-2"
          href="/play"
        >
          <span className="text-xl font-black italic tracking-wide text-white sm:text-3xl">
            MEME
          </span>
          <span className="-mt-1 hidden text-2xl font-black italic text-pink-400 sm:block">
            FOUNDRY
          </span>
        </Link>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-2 sm:mt-5 sm:p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
            <span className="hidden sm:inline">
              {season?.name ?? "No active season"}
            </span>
            <span className="sm:hidden">
              {season?.name ? season.name.slice(0, 2) : "--"}
            </span>
          </p>
          {activeToken ? (
            <Link
              aria-label={`Manage ${activeToken.ticker}`}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-lime-300/40 bg-lime-300/10 px-2 py-2 text-sm font-black text-lime-200 hover:bg-lime-300/20 sm:px-3"
              data-testid="manage-launch-affordance"
              href={`/launch/${activeToken.id}/manage` as Route}
            >
              <Zap aria-hidden="true" size={16} />
              <span className="hidden sm:inline">
                Manage {activeToken.ticker}
              </span>
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
              <span className="hidden sm:inline">{item.label}</span>
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
                <span className="hidden sm:inline">Sign out</span>
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

      <div className="col-start-2 min-w-0">
        <div className="mx-auto max-w-[94rem] px-3 py-3 sm:px-6 sm:py-4 lg:px-6 xl:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
