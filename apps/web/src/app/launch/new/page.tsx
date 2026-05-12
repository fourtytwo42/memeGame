import { Badge, Panel } from "@meme-foundry/ui";
import { AppShell } from "@/components/shell/app-shell";

export default function LaunchNewPage() {
  const steps = ["Basics", "Narrative", "Mascot", "Strategy", "Review"];
  return (
    <AppShell>
      <div
        className="grid gap-4 lg:grid-cols-[1fr_22rem]"
        data-testid="launch-wizard-shell"
      >
        <Panel>
          <Badge tone="good">Fast guided launch</Badge>
          <h1 className="mt-3 text-3xl font-black text-white">Launch wizard</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Stage 4 shell placeholder for the production wizard. The final flow
            will ask only what makes the token feel personal and will never
            block on image generation.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-md border border-white/10 bg-slate-950/50 p-3"
              >
                <p className="text-xs font-bold text-slate-500">
                  Step {index + 1}
                </p>
                <p className="font-black text-white">{step}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel data-testid="token-preview-card">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Live preview
          </p>
          <div className="mt-4 aspect-square rounded-lg border border-dashed border-emerald-300/40 bg-emerald-300/10 p-4">
            <p className="text-lg font-black text-white">Token card preview</p>
            <p className="mt-2 text-sm text-slate-300">
              Placeholder art is allowed here; final mascot generation never
              blocks launch.
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
