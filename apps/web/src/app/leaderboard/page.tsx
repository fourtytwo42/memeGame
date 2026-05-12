import { Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";

export default function Page() {
  return (
    <AppShell>
      <Panel data-testid="leaderboard-page">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Meme Foundry
        </p>
        <h1 className="mt-2 text-3xl font-black capitalize text-white">
          leaderboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Stage 4 app-shell route foundation. Feature-complete gameplay for this
          screen is built in its roadmap stage.
        </p>
      </Panel>
    </AppShell>
  );
}
