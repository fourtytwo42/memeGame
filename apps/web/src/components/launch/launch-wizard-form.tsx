"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { createLaunch } from "@/app/launch/new/actions";
import { Badge, Button, FormField, Panel } from "@meme-foundry/ui";

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
                className="cursor-pointer rounded-md border border-white/10 bg-slate-950/50 p-3 has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-300/10"
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
                <span className="font-black text-white">{narrative.name}</span>
                <span className="mt-1 block text-sm text-emerald-200">
                  {opportunityLabel(narrative)}
                </span>
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
          <div className="mt-4 rounded-lg border border-emerald-300/20 bg-slate-950/60 p-4">
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
