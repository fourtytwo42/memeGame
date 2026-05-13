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

type WizardStep = {
  id: "basics" | "narrative" | "mascot" | "strategy" | "review";
  label: string;
  eyebrow: string;
};

const steps: WizardStep[] = [
  { id: "basics", label: "Basics", eyebrow: "Name the joke" },
  { id: "narrative", label: "Narrative", eyebrow: "Pick the trend" },
  { id: "mascot", label: "Mascot", eyebrow: "Queue the art" },
  { id: "strategy", label: "Strategy", eyebrow: "Choose posture" },
  { id: "review", label: "Review", eyebrow: "Launch safely" }
];

const strategyNotes = {
  balanced: {
    title: "Balanced",
    strength: "Steady growth without spiking risk.",
    risk: "May feel slower than a pure hype push."
  },
  growth: {
    title: "Growth",
    strength: "More attention early if the joke lands.",
    risk: "Higher chance of crowd fatigue."
  },
  community: {
    title: "Community",
    strength: "Better supporter loyalty and crew momentum.",
    risk: "Needs repeated follow-through."
  },
  trust: {
    title: "Trust",
    strength: "Defensive start that reduces blowups.",
    risk: "Can miss fast trend windows."
  }
};

function opportunityLabel(narrative: NarrativeOption) {
  if (narrative.fatigue > 70) return "Cooling off";
  if (narrative.saturation > 65) return "Hot but crowded";
  if (narrative.heat > 70) return "Good opportunity";
  if (narrative.heat < 45) return "Undiscovered";
  return "Steady trend";
}

function opportunityHelp(narrative?: NarrativeOption) {
  if (!narrative) return "Pick a trend to see the launch read.";
  if (narrative.fatigue > 70) {
    return "People have seen this joke a lot lately. It can still work, but you should lead with a fresh mascot or safer trust play.";
  }
  if (narrative.saturation > 65) {
    return "The trend has attention, but many launches are competing for the same joke space.";
  }
  if (narrative.heat > 70) {
    return "The trend is active and still has room. This is a clean first launch choice.";
  }
  if (narrative.heat < 45) {
    return "Lower crowd attention means less competition, but you may need community actions to build momentum.";
  }
  return "A readable middle lane: enough attention to play with, without obvious crowding.";
}

function stepStatus(index: number, currentIndex: number) {
  if (index < currentIndex) return "Done";
  if (index === currentIndex) return "Now";
  return "Next";
}

export function LaunchWizardForm({
  narratives
}: {
  narratives: NarrativeOption[];
}) {
  const [state, action, pending] = useActionState(createLaunch, {});
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("Snack Reactor");
  const [ticker, setTicker] = useState("SNACK");
  const [description, setDescription] = useState(
    "A fictional launch about snack-powered community energy."
  );
  const [mascotPrompt, setMascotPrompt] = useState(
    "a cheerful snack mascot with a launch helmet"
  );
  const [founderStance, setFounderStance] = useState("trust-first");
  const [strategy, setStrategy] =
    useState<keyof typeof strategyNotes>("balanced");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [narrativeSlug, setNarrativeSlug] = useState(narratives[0]?.slug ?? "");

  const selectedNarrative = useMemo(
    () =>
      narratives.find((narrative) => narrative.slug === narrativeSlug) ??
      narratives[0],
    [narrativeSlug, narratives]
  );

  const isFirstStep = activeStep === 0;
  const isReviewStep = activeStep === steps.length - 1;
  const active = steps[activeStep];
  const selectedStrategy = strategyNotes[strategy];

  return (
    <form
      action={action}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]"
      data-testid="launch-wizard-form"
      noValidate
    >
      <div className="min-w-0">
        <NeonPanel className="mb-4" tone="cyan">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Kicker>Guided launch path</Kicker>
              <h2 className="mt-2 text-2xl font-black text-white">
                {active.label}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-300">
                {active.eyebrow}
              </p>
            </div>
            <Badge tone="good">
              Step {activeStep + 1} of {steps.length}
            </Badge>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2" role="tablist">
            {steps.map((step, index) => (
              <button
                aria-current={activeStep === index ? "step" : undefined}
                className={`rounded-md border p-2 text-center transition ${
                  activeStep === index
                    ? "border-cyan-200 bg-cyan-300/15 text-cyan-50"
                    : index < activeStep
                      ? "border-lime-300/30 bg-lime-300/10 text-lime-100"
                      : "border-white/10 bg-slate-950/55 text-slate-300 hover:bg-white/10"
                }`}
                key={step.id}
                onClick={() => setActiveStep(index)}
                type="button"
              >
                <span className="mx-auto grid size-7 place-items-center rounded-full border border-current text-xs font-black">
                  {index + 1}
                </span>
                <span className="mt-1 hidden text-xs font-black sm:block">
                  {step.label}
                </span>
                <span className="sr-only">{stepStatus(index, activeStep)}</span>
              </button>
            ))}
          </div>
        </NeonPanel>

        <div className="grid gap-4">
          <Panel data-testid="wizard-basics-step" hidden={activeStep !== 0}>
            <Badge tone="good">Step 1 - Basics</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">
              Name the fake token
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Keep it short, readable, and clearly fictional. This is a game
              launch, not a real asset.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                label="Token name"
                hint="Fictional, short, and readable."
              >
                <input
                  className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
                  name="name"
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </FormField>
              <FormField
                label="Ticker"
                hint="2-12 uppercase letters or numbers."
              >
                <input
                  className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
                  maxLength={12}
                  name="ticker"
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) =>
                    setTicker(event.target.value.toUpperCase())
                  }
                  required
                  value={ticker}
                />
              </FormField>
            </div>
            <FormField
              label="Description"
              hint="Explain the joke or theme without financial claims."
            >
              <textarea
                className="min-h-28 rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-base text-white outline-none focus:border-emerald-300"
                name="description"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setDescription(event.target.value)}
                required
                value={description}
              />
            </FormField>
          </Panel>

          <Panel data-testid="wizard-narrative-step" hidden={activeStep !== 1}>
            <Badge tone="warn">Step 2 - Narrative</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">
              Pick a trend
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Choose the joke category you want to play in. Heat means
              attention, saturation means competition, and fatigue means the
              crowd may be tired of it.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {narratives.map((narrative) => (
                <label
                  className="grid cursor-pointer gap-3 overflow-hidden rounded-md border border-white/10 bg-slate-950/50 p-3 has-[:checked]:border-lime-300 has-[:checked]:bg-lime-300/10"
                  key={narrative.slug}
                >
                  <input
                    checked={narrativeSlug === narrative.slug}
                    className="sr-only"
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

          <Panel data-testid="wizard-mascot-step" hidden={activeStep !== 2}>
            <Badge>Step 3 - Mascot</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">
              Describe the mascot
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This prompt queues local image generation after launch. The game
              starts immediately with polished fallback art, then swaps in
              generated art when it is ready.
            </p>
            <FormField
              label="Mascot concept"
              hint="Use plain visual words. Avoid logos, celebrities, or real brands."
            >
              <input
                className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
                name="mascotPrompt"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setMascotPrompt(event.target.value)}
                required
                value={mascotPrompt}
              />
            </FormField>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoCard
                label="Now"
                text="Fallback token art is ready before launch."
              />
              <InfoCard
                label="Queued"
                text="Local generation can run after the token exists."
              />
              <InfoCard
                label="Safe"
                text="Image work never blocks the first play action."
              />
            </div>
          </Panel>

          <Panel data-testid="wizard-strategy-step" hidden={activeStep !== 3}>
            <Badge tone="warn">Step 4 - Strategy</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">
              Choose the starting posture
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              These choices tune the first recommendation. You can still change
              direction through actions once the launch is live.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Select
                label="Founder stance"
                name="founderStance"
                onChange={setFounderStance}
                options={[
                  "trust-first",
                  "careful-builder",
                  "community-chaos",
                  "meme-maxi"
                ]}
                value={founderStance}
              />
              <Select
                label="Initial strategy"
                name="strategy"
                onChange={(value) =>
                  setStrategy(value as keyof typeof strategyNotes)
                }
                options={["balanced", "growth", "community", "trust"]}
                value={strategy}
              />
              <Select
                label="Risk level"
                name="riskLevel"
                onChange={setRiskLevel}
                options={["low", "medium", "high"]}
                value={riskLevel}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard
                label="Expected strength"
                text={selectedStrategy.strength}
              />
              <InfoCard label="Watch out" text={selectedStrategy.risk} />
            </div>
          </Panel>

          <Panel data-testid="wizard-review-step" hidden={!isReviewStep}>
            <Badge tone="good">Step 5 - Review</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">
              Launch the simulation
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReviewLine
                label="Token"
                value={`${name || "Token"} / $${ticker || "TICKER"}`}
              />
              <ReviewLine
                label="Narrative"
                value={selectedNarrative?.name ?? "No trend selected"}
              />
              <ReviewLine label="Mascot" value={mascotPrompt} />
              <ReviewLine
                label="First play"
                value={`Start ${selectedStrategy.title.toLowerCase()} and follow the first recommended action.`}
              />
            </div>
            <div className="mt-4 rounded-md border border-lime-300/25 bg-lime-300/10 p-4">
              <p className="font-black text-lime-100">Simulated-only token</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Launch creates a game object only. There is no real trading, no
                real liquidity, no wallet, and no financial advice.
              </p>
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

          <div className="sticky bottom-3 z-20 grid gap-2 rounded-lg border border-white/10 bg-slate-950/92 p-3 shadow-2xl shadow-black/40 backdrop-blur md:static md:flex md:justify-between md:bg-transparent md:p-0 md:shadow-none">
            <Button
              disabled={isFirstStep || pending}
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
              tone="ghost"
              type="button"
            >
              Back
            </Button>
            {isReviewStep ? (
              <Button
                data-pending={pending ? "true" : "false"}
                data-testid="launch-submit-button"
                type="submit"
              >
                {pending ? "Launching" : "Review and launch"}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setActiveStep((step) => Math.min(steps.length - 1, step + 1))
                }
                type="button"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>

      <aside
        className="grid content-start gap-4 lg:sticky lg:top-24"
        data-testid="live-token-preview"
      >
        <Panel className="lg:hidden">
          <details>
            <summary className="cursor-pointer text-sm font-black text-cyan-100">
              Token preview
            </summary>
            <PreviewCard
              mascotPrompt={mascotPrompt}
              name={name}
              narrative={selectedNarrative}
              ticker={ticker}
            />
          </details>
        </Panel>
        <Panel className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Live token card preview
          </p>
          <PreviewCard
            mascotPrompt={mascotPrompt}
            name={name}
            narrative={selectedNarrative}
            ticker={ticker}
          />
        </Panel>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Opportunity read
          </p>
          <p className="mt-2 text-sm font-black text-lime-100">
            {selectedNarrative
              ? opportunityLabel(selectedNarrative)
              : "Pick a trend"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {opportunityHelp(selectedNarrative)}
          </p>
        </Panel>
      </aside>
    </form>
  );
}

function PreviewCard({
  mascotPrompt,
  name,
  narrative,
  ticker
}: {
  mascotPrompt: string;
  name: string;
  narrative?: NarrativeOption;
  ticker: string;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-cyan-300/30 bg-slate-950/60 p-4 shadow-[0_0_26px_rgba(34,211,238,0.14)]">
      <Image
        alt="Transparent default token placeholder"
        className="mx-auto size-40"
        height={160}
        priority
        src="/assets/game/tokens/default-token-mascot.png"
        width={160}
      />
      <h2 className="mt-4 break-words text-2xl font-black text-white">
        {name || "Token name"}
      </h2>
      <p className="text-sm font-bold text-emerald-200">
        ${ticker || "TICKER"}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Narrative: {narrative?.name ?? "Pick a trend"}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
        Mascot: {mascotPrompt || "Describe a mascot"}
      </p>
      <div className="mt-3 rounded-md border border-lime-300/20 bg-lime-300/10 p-3">
        <p className="text-sm font-black text-lime-100">
          Image queued after launch
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          The launch starts with polished fallback art. Final local art can
          arrive later without blocking play.
        </p>
      </div>
    </div>
  );
}

function InfoCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/55 p-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/55 p-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-white">
        {value}
      </p>
    </div>
  );
}

function Select({
  name,
  label,
  onChange,
  options,
  value
}: {
  name: string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <FormField label={label}>
      <select
        className="min-h-11 rounded-md border border-white/15 bg-slate-950 px-3 text-base text-white outline-none focus:border-emerald-300"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
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
