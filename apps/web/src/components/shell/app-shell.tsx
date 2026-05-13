import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { IconHelpButton } from "@/components/shell/icon-help";
import { signOutAction } from "@/app/signin/actions";
import { formatCompactCurrency } from "@/lib/game-state";
import { prisma } from "@meme-foundry/db";
import {
  Bell,
  CircleHelp,
  ClipboardList,
  Database,
  Gauge,
  Home,
  ImageIcon,
  LogOut,
  Rocket,
  Shield,
  SlidersHorizontal,
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

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Shield },
  { href: "/admin#season-editor" as Route, label: "Seasons", icon: Gauge },
  {
    href: "/admin#narrative-editor" as Route,
    label: "Narratives",
    icon: SlidersHorizontal
  },
  { href: "/admin#reports" as Route, label: "Reports", icon: ClipboardList },
  { href: "/admin#ai-logs" as Route, label: "AI logs", icon: Database },
  { href: "/admin#image-jobs" as Route, label: "Images", icon: ImageIcon },
  { href: "/admin/assets", label: "Assets", icon: Trophy }
];

function daysLeft(endsAt?: Date) {
  if (!endsAt) return "--";
  return `${Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000))}d left`;
}

export async function AppShell({
  children,
  variant = "player"
}: {
  children: React.ReactNode;
  variant?: "player" | "admin";
}) {
  const session = await auth();
  const isAdminShell = variant === "admin";
  const [season, activeToken, profile] = await Promise.all([
    prisma.season.findFirst({
      where: { status: "active" },
      orderBy: { startsAt: "desc" }
    }),
    session?.user
      ? prisma.launchToken.findFirst({
          where: { userId: session.user.id, status: { in: ["live", "draft"] } },
          orderBy: { updatedAt: "desc" }
        })
      : null,
    session?.user
      ? prisma.founderProfile.findUnique({ where: { userId: session.user.id } })
      : null
  ]);
  const nav: NavItem[] = isAdminShell
    ? adminNav
    : session?.user.role === "admin"
      ? [...primaryNav, { href: "/admin", label: "Admin", icon: Shield }]
      : primaryNav;

  return (
    <main className="grid h-screen grid-cols-[4.5rem_minmax(0,1fr)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.18),transparent_28rem),radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_34rem),#07090d] text-slate-100 sm:grid-cols-[14rem_minmax(0,1fr)]">
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-[4.5rem] flex-col border-r border-lime-300/15 bg-slate-950/94 px-2 py-3 shadow-2xl shadow-black/50 backdrop-blur sm:w-56 sm:px-4 sm:py-4"
        data-testid="desktop-left-nav"
      >
        <Link
          aria-label="Meme Foundry home"
          className="grid place-items-center gap-1 px-1 sm:grid-cols-[2.6rem_minmax(0,1fr)] sm:px-2"
          href="/play"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="size-10 object-contain"
            height={40}
            priority
            src="/assets/brand/foundry-mark.png"
            width={40}
          />
          <span className="hidden sm:block">
            <span className="block text-3xl font-black italic leading-7 tracking-wide text-white">
              MEME
            </span>
            <span className="-mt-1 block text-2xl font-black italic leading-6 text-pink-400">
              FOUNDRY
            </span>
          </span>
        </Link>
        {isAdminShell ? (
          <div className="mt-4 rounded-lg border border-violet-300/20 bg-violet-300/10 p-2 sm:mt-5 sm:p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-200">
              <span className="hidden sm:inline">Admin console</span>
              <span className="sm:hidden">AD</span>
            </p>
            <div className="mt-3 hidden grid-cols-1 gap-2 text-xs font-black sm:grid">
              <div className="rounded-md bg-slate-950/70 p-2 text-violet-100">
                Host-native VM
              </div>
              <div className="rounded-md bg-slate-950/70 p-2 text-emerald-200">
                Live ops
              </div>
            </div>
          </div>
        ) : (
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
            <div className="mt-3 hidden grid-cols-2 gap-2 text-xs font-black sm:grid">
              <div className="rounded-md bg-slate-950/70 p-2 text-lime-200">
                {daysLeft(season?.endsAt)}
              </div>
              <div className="rounded-md bg-slate-950/70 p-2 text-pink-200">
                live
              </div>
            </div>
          </div>
        )}
        <nav aria-label="Primary" className="mt-5 grid gap-2">
          {nav.map((item) => (
            <Link
              aria-label={item.label}
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
        {session?.user ? (
          <div className="mt-4 hidden grid-cols-2 gap-2 sm:grid">
            <div className="rounded-md border border-cyan-300/15 bg-cyan-300/10 p-2">
              <p className="text-[0.65rem] font-black uppercase text-cyan-200">
                Energy
              </p>
              <p className="text-sm font-black text-white">
                {activeToken?.energy ?? "--"}
              </p>
            </div>
            <div className="rounded-md border border-amber-300/15 bg-amber-300/10 p-2">
              <p className="text-[0.65rem] font-black uppercase text-amber-200">
                Clout
              </p>
              <p className="text-sm font-black text-white">
                {profile?.clout ?? 0}
              </p>
            </div>
          </div>
        ) : null}
        <div className="mt-auto grid gap-3 pb-16 sm:pb-0">
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

      <div
        className="col-start-2 min-w-0 overflow-y-auto overscroll-contain"
        data-testid="app-scroll-content"
      >
        <div className="mx-auto max-w-[94rem] px-3 py-3 sm:px-6 sm:py-4 lg:px-6 xl:px-8">
          {session?.user && isAdminShell ? (
            <div
              className="mb-4 grid gap-2 rounded-lg border border-violet-300/15 bg-slate-950/70 p-3 shadow-xl shadow-black/20 sm:grid-cols-4"
              data-testid="admin-resource-strip"
            >
              <div>
                <p className="text-xs font-black uppercase text-violet-200">
                  Admin
                </p>
                <p className="truncate font-black text-white">
                  {session.user.username}
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Window
                </p>
                <p className="font-black text-cyan-200">Last 15 minutes</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Refresh
                </p>
                <p className="font-black text-emerald-200">Manual + live</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Runtime
                </p>
                <p className="font-black text-amber-200">Host-native VM</p>
              </div>
            </div>
          ) : session?.user ? (
            <div
              className="mb-4 grid gap-2 rounded-lg border border-white/10 bg-slate-950/55 p-3 shadow-xl shadow-black/20 sm:grid-cols-4"
              data-testid="shell-resource-strip"
            >
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Founder
                </p>
                <p className="truncate font-black text-white">
                  {session.user.username}
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Energy
                </p>
                <p className="font-black text-lime-200">
                  {activeToken?.energy ?? "--"} / 100
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Fake budget
                </p>
                <p className="font-black text-amber-200">
                  {activeToken
                    ? formatCompactCurrency(activeToken.treasury)
                    : "$0"}
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">
                  Safety
                </p>
                <p className="font-black text-cyan-200">No real trading</p>
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </main>
  );
}
