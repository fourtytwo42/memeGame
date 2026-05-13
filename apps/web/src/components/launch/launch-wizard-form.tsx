"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { createLaunch } from "@/app/launch/new/actions";
import { narrativeImage } from "@/lib/assets";
import {
  Badge,
  Button,
  FormField,
  Kicker,
  NeonPanel,
  Panel,
  ProgressMeter
} from "@meme-foundry/ui";

type NarrativeOption = {
  slug: string;
  name: string;
  heat: number;
  saturation: number;
  fatigue: number;
};

function opportunityLabel(narrative: NarrativeOption) {
  if (narrative.fatigue > 70) return "Cooling off";
  if (narrative.saturation > 65) return "Hot but crowded";
  if (narrative.heat > 70) return "Good opportunity";
  if (narrative.heat < 45) return "Undiscovered";
  return "Steady trend";
}

export function LaunchWizardForm({
  narratives
}: {
  narratives: NarrativeOption[];
}) {
  const [state, action, pending] = useActionState(createLaunch, {});
  const [name, setName] = useState("Snack Reactor");
  const [ticker, setTicker] = useState("SNACK");
  const [narrativeSlug, setNarrativeSlug] = useState(narratives[0]?.slug ?? "");
  const selectedNarrative = useMemo(
    () =>
      narratives.find((narrative) => narrative.slug === narrativeSlug) ??
      narratives[0],
    [narrativeSlug, narratives]
  );

  return (
    <form
      action={action}
      className="grid gap-4 lg:grid-cols-[1fr_22rem]"
      data-testid="launch-wizard-form"
    >
      <div className="grid gap-4">
        <NeonPanel tone="cyan">
          <Kicker>Guided launch path</Kicker>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {["Basics", "Narrative", "Mascot", "Strategy", "Review"].map(
              (step, index) => (
                <div
                  className="rounded-md border border-white/10 bg-slate-950/55 p-2 text-center"
                  key={step}
                >
                  <span className="mx-auto grid size-7 place-items-center rounded-full border border-cyan-300/40 text-xs font-black text-cyan-100">
                    {index + 1}
                  </span>
                  <p className="mt-1 hidden text-xs font-black text-slate-300 sm:block">
                    {step}
                  </p>
                </div>
              )
            )}
          </div>
        </NeonPanel>

        <Panel data-testid="wizard-basics-step">
          <Badge tone="good">Step 1 · Basics</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">
            Name the fake token
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Token name"
              hint="Fictional, short, and readable."
            >
              <input
                className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
                defaultValue={name}
                name="name"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setName(event.target.value)}
                onInput={(event) => setName(event.currentTarget.value)}
                required
              />
            </FormField>
            <FormField label="Ticker" hint="2-12 uppercase letters or numbers.">
              <input
                className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
                defaultValue={ticker}
                maxLength={12}
                name="ticker"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) =>
                  setTicker(event.target.value.toUpperCase())
                }
                onInput={(event) =>
                  setTicker(event.currentTarget.value.toUpperCase())
                }
                required
              />
            </FormField>
          </div>
          <FormField
            label="Description"
            hint="Explain the joke or theme without financial claims."
          >
            <textarea
              className="min-h-24 rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-base text-white outline-none focus:border-emerald-300"
              defaultValue="A fictional launch about snack-powered community energy."
              name="description"
              onFocus={(event) => event.currentTarget.select()}
              required
            />
          </FormField>
        </Panel>

        <Panel data-testid="wizard-narrative-step">
          <Badge tone="warn">Step 2 · Narrative</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">Pick a trend</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {narratives.map((narrative) => (
              <label
                className="grid cursor-pointer gap-3 overflow-hidden rounded-md border border-white/10 bg-slate-950/50 p-3 has-[:checked]:border-lime-300 has-[:checked]:bg-lime-300/10"
                key={narrative.slug}
              >
                <input
                  className="sr-only"
                  checked={narrativeSlug === narrative.slug}
                  name="narrativeSlug"
                  onChange={() => setNarrativeSlug(narrative.slug)}
                  type="radio"
                  value={narrative.slug}
                />
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                  <Image
                    alt={`${narrative.name} narrative art`}
                    className="size-18 rounded-md border border-white/10 bg-slate-950/70 object-contain p-1"
                    height={72}
                    src={narrativeImage(narrative.slug)}
                    width={72}
                  />
                  <div className="min-w-0">
                    <span className="break-words font-black text-white">
                      {narrative.name}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-lime-200">
                      {opportunityLabel(narrative)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <ProgressMeter
                    label="Heat"
                    tone="hot"
                    value={narrative.heat}
                  />
                  <ProgressMeter
                    label="Saturation"
                    tone="warn"
                    value={narrative.saturation}
                  />
                  <ProgressMeter
                    label="Fatigue"
                    tone="bad"
                    value={narrative.fatigue}
                  />
                </div>
              </label>
            ))}
          </div>
        </Panel>

        <Panel data-testid="wizard-mascot-step">
          <Badge>Step 3 · Mascot</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">
            Describe the mascot
          </h2>
          <FormField
            label="Mascot concept"
            hint="Image generation is queued later and never blocks launch."
          >
            <input
              className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
              defaultValue="a cheerful snack mascot with a launch helmet"
              name="mascotPrompt"
              onFocus={(event) => event.currentTarget.select()}
              required
            />
          </FormField>
        </Panel>

        <Panel data-testid="wizard-strategy-step">
          <Badge tone="warn">Step 4 · Strategy</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">
            Choose the starting posture
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Select
              name="founderStance"
              label="Founder stance"
              options={[
                "trust-first",
                "careful-builder",
                "community-chaos",
                "meme-maxi"
              ]}
            />
            <Select
              name="strategy"
              label="Initial strategy"
              options={["balanced", "growth", "community", "trust"]}
            />
            <Select
              name="riskLevel"
              label="Risk level"
              options={["low", "medium", "high"]}
            />
          </div>
        </Panel>

        {state.error ? (
          <p
            className="rounded-md border border-rose-300/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <Button disabled={pending} type="submit">
          {pending ? "Launching" : "Review and launch"}
        </Button>
      </div>

      <aside
        className="grid content-start gap-4 lg:sticky lg:top-24"
        data-testid="live-token-preview"
      >
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Live token card preview
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-cyan-300/30 bg-slate-950/60 p-4 shadow-[0_0_26px_rgba(34,211,238,0.14)]">
            <Image
              alt="Transparent default token placeholder"
              className="mx-auto size-40"
              height={160}
              priority
              src="/assets/game/tokens/default-token-mascot.png"
              width={160}
            />
            <h2 className="mt-4 text-2xl font-black text-white">
              {name || "Token name"}
            </h2>
            <p className="text-sm font-bold text-emerald-200">
              ${ticker || "TICKER"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Narrative: {selectedNarrative?.name ?? "Pick a trend"}
            </p>
            <div className="mt-3 rounded-md border border-lime-300/20 bg-lime-300/10 p-3">
              <p className="text-sm font-black text-lime-100">
                Image queued after launch
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Launch uses this polished placeholder immediately. Final local
                art can arrive later without blocking play.
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Placeholder art is ready now. Final generated art can arrive
              later.
            </p>
          </div>
        </Panel>
        <Panel data-testid="wizard-review-step">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Review
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Launch creates a simulated token only. No real trading, no real
            liquidity, and no financial advice.
          </p>
        </Panel>
      </aside>
    </form>
  );
}

function Select({
  name,
  label,
  options
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <FormField label={label}>
      <select
        className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
        name={name}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FormField>
  );
}
