import type { Route } from "next";
import Link from "next/link";
import { auth } from "@/auth";
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
  Users
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34rem),#0b0d12] pb-24 text-slate-100 md:pb-0">
      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/86 backdrop-blur"
        data-testid="app-shell-topbar"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="grid min-w-0 gap-0.5" href="/play">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              {season?.name ?? "No active season"}
            </span>
            <span className="truncate text-lg font-black text-white">
              Meme Foundry
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                href={item.href}
              >
                <item.icon aria-hidden="true" size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {activeToken ? (
              <Link
                className="hidden rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-black text-emerald-100 hover:bg-emerald-300/20 sm:inline-flex"
                href="/play"
                data-testid="manage-launch-affordance"
              >
                Manage {activeToken.ticker}
              </Link>
            ) : null}
            <button
              aria-label="Notifications"
              className="inline-flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
              title="Notifications"
            >
              <Bell aria-hidden="true" size={18} />
            </button>
            {session?.user ? (
              <form action={signOutAction}>
                <button
                  aria-label="Sign out"
                  className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
                  type="submit"
                >
                  <LogOut aria-hidden="true" size={16} />
                  <span className="hidden sm:inline">Sign out</span>
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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {children}
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
