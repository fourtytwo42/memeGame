# Meme Foundry UI Alignment Roadmap

This roadmap is a focused goal contract for bringing the implemented app into
alignment with the PRD reference screens and the UI/UX requirements.

Use this document after the production foundation exists. It does not replace
`ROADMAP.md`; it is a visual/product-alignment pass that works from the current
live app toward the reference direction in `PRD/reference_screens/`.

## Goal Statement

Bring Meme Foundry's live host-native VM app into close alignment with the PRD
reference screens, while preserving the working production systems already
built.

The final app should feel like the generated reference screens: a rich,
image-forward, neon game command center with clear player flow, strong left-side
navigation on tablet/desktop, compact icon-first utility controls, and readable
mobile/tablet/desktop layouts.

## Required Inputs

Before changing code, read:

- `AGENTS.md`
- `MEMORY.md`
- `ROADMAP.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/21_asset_production_and_iconography.md`
- `PRD/reference_screens/README.md`
- All images in `PRD/reference_screens/`

Use the live host-native VM app as the implementation target:

- `http://192.168.50.209/`
- Do not use Docker for this alignment work.
- Use `browser-use:browser` for actual user-facing verification.

## Alignment Principles

- Preserve working gameplay, auth, database, workers, realtime, admin, and
  deployment systems.
- Prefer improving existing components and routes over replacing the app with a
  static mockup.
- Do not fake gameplay state in the UI. If richer UI needs richer data, add
  real seeded/themed data or derived view models.
- Keep every stage shippable. If a stage fails visual, functional, accessibility,
  or responsive checks, fix it before moving on.
- Commit and push after each completed stage or meaningful milestone.
- Update `MEMORY.md` with durable decisions, service commands, asset notes, and
  any follow-up risks that must survive context compression.

## Universal End Gate For Every Stage

Each stage must finish with:

- Relevant PRD/reference screens consulted.
- Code implemented and deployed to the host-native VM.
- `pnpm --filter @meme-foundry/web typecheck` passing.
- Relevant unit/integration tests passing, or a clear reason plus follow-up if
  a test target is not applicable.
- `pnpm --filter @meme-foundry/web build` passing.
- `browser-use:browser` verification against the live VM route(s).
- Desktop, tablet, and mobile visual checks for changed user-facing routes.
- No incoherent overlaps, clipped labels, unreadable text, or broken scroll.
- No public production SVG placeholder assets where generated raster art is
  required by the PRD.
- Git commit pushed.

## Stage 0: Baseline Audit And Evidence

### Purpose

Create a concrete before-state so the alignment work can be measured instead of
judged by memory.

### Scope

- Capture current live screenshots with `browser-use:browser` or the existing
  visual audit harness for:
  - `/play`
  - `/launch/new`
  - `/launch/:id/manage`
  - `/token/:id`
  - `/seasons` and one season detail page
  - `/leaderboard`
  - `/crews` and one crew detail page
  - `/admin`
- Compare each route against its corresponding PRD reference image:
  - `01_play_home_command_hub.png`
  - `02_launch_wizard.png`
  - `03_active_token_dashboard.png`
  - `04_public_token_page.png`
  - `05_season_narratives.png`
  - `06_leaderboard.png`
  - `07_crew_page.png`
  - `08_admin_dashboard.png`
- Record mismatches in a tracked markdown file under `docs/evidence/`.

### End Gate

- A tracked evidence file exists with route-by-route mismatches.
- Baseline screenshots are saved under `docs/evidence/`.
- The highest-impact fixes are ordered for the next stages.

## Stage 1: Production-Themed Data Cleanup

### Purpose

Remove visible test/fixture names from the product experience. The live app
currently exposes names like `Crew E2E Target chromium-*`, `Crew Scale Narrative
8`, and `Stage 11 Scale Crew 25`, which makes the app feel unfinished even when
the systems are working.

### Scope

- Review seed scripts, scale scripts, browser test data, and production fixture
  generation.
- Separate test-only fixture names from production/demo seed names.
- Create production-themed seed data for:
  - seasons;
  - narratives;
  - launch tokens;
  - founders;
  - crews;
  - crew members;
  - global events;
  - supporter actions;
  - leaderboard rows;
  - admin queues/log examples.
- Use themed names consistent with the PRD references, such as meme animals,
  AI agents, retro internet, food, wizard/fantasy, and absurdist internet
  categories.
- Add safeguards so e2e/stress-test fixture names do not leak into the default
  user-facing production seed state.
- Preserve test determinism. Tests can still create explicit test data, but the
  default demo/live experience should not be dominated by test names.

### Verification

- Reseed or migrate the VM demo data safely.
- Inspect `/play`, `/leaderboard`, `/seasons`, `/crews`, and `/admin` with
  `browser-use:browser`.
- Confirm no visible `E2E`, `chromium`, `mobile-chrome`, `Stage 11`, or similar
  test labels appear in normal player/admin screens unless the screen is
  intentionally showing test evidence.

### End Gate

- Live VM shows production-themed names across major screens.
- Tests still pass.
- Seed/test data separation is documented in `MEMORY.md`.

## Stage 2: Visual System And Asset Application

### Purpose

Raise the whole app from plain dark cards to the visual language in the
reference screens without sacrificing readability.

### Scope

- Audit the existing asset manifest and generated image set.
- Identify missing assets needed for the reference-aligned UI:
  - season banner art;
  - narrative card art for all major narrative categories;
  - crew avatars and badge art;
  - supporter/NPC avatars;
  - status art for hot, cooling, crowded, risky, revived, graduated, and dead
    states;
  - empty/degraded/loading illustrations where useful.
- Generate any missing production raster assets with `imagegen`.
- Process chroma-key assets into transparent PNG/WebP where appropriate.
- Update `assets/manifest/assets.json` with source prompt, final path, usage,
  alt text, and review notes.
- Build reusable UI primitives for:
  - neon card frame;
  - stat chip;
  - progress meter;
  - resource strip;
  - event row;
  - ranked row;
  - image-forward token card;
  - narrative heat card;
  - right-rail panel.
- Apply a consistent color/spacing/type scale across the player pages.
- Keep Tailwind CSS v4.
- Use `lucide-react` for standard utility icons and imagegen raster art for
  expressive game visuals.

### Verification

- `pnpm assets:verify` passes.
- No required production art is missing from the manifest.
- Browser-use visual checks confirm assets render cleanly on dark surfaces.
- Transparent assets show no obvious chroma-key fringe.
- Pages remain readable at desktop, tablet, and mobile sizes.

### End Gate

- Shared visual primitives exist and are used by at least `/play`,
  `/leaderboard`, and `/launch/new`.
- Asset manifest is current.
- Visual audit screenshots show a clearly richer game identity.

## Stage 3: Global Shell Alignment

### Purpose

Bring navigation and persistent context closer to the reference screens.

### Scope

- Keep tablet/desktop primary navigation in the left rail.
- Enhance the left rail with:
  - stronger Meme Foundry brand treatment;
  - active season card with countdown/status;
  - active launch affordance;
  - icon-first nav with accessible labels/tooltips;
  - notification control;
  - profile/sign-out area;
  - optional compact reward/season card if it fits without clutter.
- Add a desktop/tablet top resource strip or page header strip where useful:
  - energy;
  - fake budget/clout;
  - founder identity;
  - live/realtime status;
  - no-real-trading signal.
- Ensure phone layout follows PRD:
  - compact top bar;
  - bottom nav;
  - no desktop left rail crowding the play surface.
- Ensure the content scroll container works reliably in the in-app browser.

### Verification

- Browser-use checks desktop, tablet, and mobile shell behavior.
- Keyboard focus order is usable.
- Icon-only controls have accessible names and hover/focus help.
- Active launch affordance works from all primary routes.

### End Gate

- Shell visually matches the reference direction and PRD global app shell.
- No page uses a desktop top nav as the primary navigation.
- Mobile navigation is usable and does not overlap content.

## Stage 4: `/play` Command Hub Alignment

### Purpose

Make `/play` feel like the main command hub from
`01_play_home_command_hub.png`.

### Scope

- Rework the active token panel:
  - large token art;
  - live/status badge;
  - ticker;
  - short run summary;
  - hype/holders/market cap;
  - graduation progress;
  - compact sparkline or mini market movement;
  - strong `Manage launch` CTA.
- Rework the recommended action panel:
  - one obvious next action;
  - reason;
  - expected upside;
  - expected downside;
  - clear CTA.
- Rework narrative heat:
  - richer image-forward cards or heat-map style panel;
  - hot/cooling/crowded/risky labels;
  - quick link to full season/narrative view.
- Rework global events:
  - compact event rows;
  - timers or freshness;
  - icon/art status;
  - short mechanical impact text.
- Rework leaderboard preview:
  - compact ranked rows;
  - themed token art;
  - scores;
  - clear route to full leaderboard.
- Rework crew status:
  - if no crew, show a polished invitation/empty state;
  - if in crew, show crew art, members, support status, and active boost.

### Verification

- Browser-use confirms first-time user can identify:
  - current situation;
  - best next action;
  - expected upside;
  - expected downside;
  - progress toward graduation.
- Desktop page resembles the reference command hub in structure and visual
  density.
- Mobile page keeps the recommended action and active launch near the top.

### End Gate

- `/play` is no longer a plain dashboard; it reads as the active launch command
  hub.
- All primary panels have real data and polished empty states.

## Stage 5: `/launch/new` Wizard Alignment

### Purpose

Make the launch flow match `02_launch_wizard.png` and the PRD first-run
approachability contract.

### Scope

- Convert the long stacked form into a true guided wizard:
  - Basics;
  - Narrative;
  - Mascot;
  - Strategy;
  - Review.
- Add desktop stepper with numbered steps.
- Add sticky or persistent preview panel on desktop.
- Add mobile collapsible preview and sticky next/back controls.
- Make narrative selection visual:
  - generated art per narrative;
  - heat/saturation/fatigue bars;
  - interpreted opportunity label;
  - selected state.
- Make mascot step clear:
  - prompt field;
  - queued/generating/fallback state;
  - launch never blocked by image generation.
- Make strategy step plain-language:
  - expected strengths;
  - risks;
  - starting posture.
- Make review step explicit about:
  - simulated-only token;
  - no real trading;
  - first recommended action after launch.

### Verification

- Browser-use mock first-time user completes launch without human help.
- First launch can be completed in under 3 minutes by automation.
- User can understand narrative opportunity without crypto knowledge.
- Preview updates as values change.
- Mobile wizard does not trap or hide controls.

### End Gate

- `/launch/new` matches the reference flow and visual hierarchy.
- No all-steps-at-once desktop form remains for the primary path.

## Stage 6: Active Token Dashboard Alignment

### Purpose

Make `/launch/:id/manage` feel like the main game board from
`03_active_token_dashboard.png`.

### Scope

- Build a strong token header:
  - token art;
  - name/ticker/status;
  - launched age;
  - market cap;
  - holders;
  - rank;
  - graduation progress.
- Add active situation panel when events require response:
  - situation text;
  - 2-3 decision cards;
  - upside/downside;
  - timer when applicable.
- Upgrade market chart:
  - larger visual area;
  - clearer axes;
  - event markers;
  - explanation legend;
  - market cap/score toggle if supported.
- Keep grouped stats prominent:
  - Growth;
  - Belief;
  - Community;
  - Risk.
- Add recommended action row before the full action list.
- Rework all actions into compact, scannable game cards by intent:
  - Grow Attention;
  - Build Trust;
  - Strengthen Community;
  - Fight Trouble;
  - High Risk Plays.
- Add right rail:
  - event feed;
  - AI coach;
  - top supporters;
  - crew support;
  - narrative context.
- Preserve action validation, resource constraints, risky confirmations, and
  realtime updates.

### Verification

- Browser-use performs:
  - take a safe action;
  - attempt a disabled action;
  - confirm a risky action path;
  - observe chart/stat/event feedback;
  - verify realtime status.
- Mock first-time user can explain what changed after an action.
- Mobile keeps active event/recommended action accessible without excessive
  scrolling.

### End Gate

- Manage page is the strongest game-board screen in the app.
- All key game systems are visible without becoming confusing.

## Stage 7: Public Token Page Alignment

### Purpose

Make `/token/:id` match the public support page direction from
`04_public_token_page.png`.

### Scope

- Build a public token hero:
  - large token art/card;
  - name/ticker/status;
  - founder;
  - crew;
  - short description;
  - graduation progress.
- Add support action row:
  - Make Meme;
  - Defend Chat;
  - Write Lore;
  - Signal Boost.
- Upgrade public chart and stat summary.
- Add right-side ecosystem panels:
  - event feed;
  - top supporters;
  - AI/NPC posts;
  - image generation/status panel when relevant.
- Make support actions clearly non-financial and simulated.

### Verification

- Browser-use support action flow succeeds.
- Public viewer can tell there is no real trading/liquidity.
- Event/support feedback appears after action.
- Layout remains polished on mobile/tablet/desktop.

### End Gate

- Public token page feels like a shareable public launch page, not a plain stats
  page.

## Stage 8: Seasons And Narrative Heat Alignment

### Purpose

Make season/narrative pages match `05_season_narratives.png`.

### Scope

- Add season hero with:
  - active season status;
  - countdown;
  - score/rank if available;
  - season banner art.
- Rework narrative map into image-forward heat cards:
  - narrative art;
  - heat/saturation/fatigue bars;
  - active launch count;
  - opportunity label.
- Add side panels:
  - top launches;
  - top crews;
  - global events;
  - daily challenge or equivalent gameplay prompt.
- Add AI commentary if local AI is available, with graceful fallback.

### Verification

- Browser-use verifies narrative cards are understandable without jargon.
- Heat/crowding/risk labels match underlying data.
- Art is not cropped badly.

### End Gate

- Season/narrative screen has a strong visual identity and clear opportunity
  scanning.

## Stage 9: Leaderboard Alignment

### Purpose

Make `/leaderboard` match `06_leaderboard.png`.

### Scope

- Rework desktop layout:
  - large leaderboard title treatment;
  - season banner;
  - filter/search row;
  - category tabs;
  - dense ranked table/list;
  - right rail with player rank, nearby rivals, live rank changes, and rewards.
- Keep page-local category controls as a left-side or tabbed control, not a
  plain top menu that fights the global shell.
- Add useful columns:
  - rank;
  - token/founder/crew identity;
  - score;
  - status;
  - narrative;
  - graduation;
  - rank change.
- Add mobile card layout that preserves ranking clarity.

### Verification

- Browser-use tests tab changes, search/filter behavior, and route query state.
- Rank rows use production-themed data and art.
- Dense desktop layout remains readable.
- Mobile layout avoids horizontal overflow.

### End Gate

- Leaderboard feels like a competitive game screen with enough context to care
  about rank.

## Stage 10: Crew Experience Alignment

### Purpose

Make crew list/detail pages match `07_crew_page.png`.

### Scope

- Rework crew detail hero:
  - crew avatar/banner art;
  - name/tag/status;
  - score/rank/members/roles;
  - resources.
- Rework featured launch panel:
  - token art;
  - progress;
  - cost;
  - strong support CTA.
- Rework crew actions:
  - Raid Launch;
  - Make Meme Pack;
  - Defend FUD;
  - Start Lore Campaign.
- Add badges/rewards panel.
- Add leaderboard position panel.
- Add member roster with status/roles.
- Add event feed with recent crew actions.
- Add polished no-crew and create-crew states.

### Verification

- Browser-use joins or creates a crew when appropriate.
- Browser-use performs or attempts a crew support action.
- Member/resource changes are understandable.
- Mobile route keeps CTA and featured launch clear.

### End Gate

- Crew pages feel like multiplayer coordination surfaces, not a plain directory.

## Stage 11: Admin Console Alignment

### Purpose

Make `/admin` match the dense operations console direction from
`08_admin_dashboard.png`.

### Scope

- Consider a dedicated admin shell or admin-specific navigation inside the
  existing shell.
- Build operations cards:
  - web;
  - realtime;
  - Postgres;
  - Redis;
  - local LLM;
  - image worker.
- Add queue health table:
  - queue;
  - status;
  - waiting;
  - active;
  - completed;
  - failed;
  - delayed.
- Add reports/moderation table with filters/actions.
- Add AI logs table.
- Add image jobs table.
- Add system alerts panel.
- Add refresh/time-window controls.
- Preserve existing admin mutations for seasons/narratives/reports.

### Verification

- Browser-use checks admin page at desktop/tablet/mobile.
- Admin actions still require authorized session.
- Health/degraded states are accurate.
- Queue/job/report tables are readable and actionable.

### End Gate

- Admin screen reads as a production operations console.
- Player shell does not make admin feel like a player page with admin widgets
  dropped into it.

## Stage 12: Responsive, Accessibility, And Approachability Pass

### Purpose

Make sure the aligned visuals still work for real users across devices and do
not hide the game loop.

### Scope

- Run responsive checks for all major routes:
  - desktop;
  - tablet;
  - mobile.
- Run accessibility checks:
  - labels;
  - headings;
  - focus order;
  - color contrast;
  - keyboard usability;
  - icon-only controls.
- Run approachability mock user flows with `browser-use:browser`:
  - new user signs in;
  - launches token;
  - takes first action;
  - understands stat change;
  - visits leaderboard;
  - supports another launch;
  - joins or creates crew if available.
- Verify no screen assumes crypto knowledge for primary decisions.
- Verify every major player screen answers:
  - What is happening?
  - Why did it happen?
  - What can I do now?
  - What is risky?
  - What am I working toward?

### End Gate

- Browser-use mock user playthroughs complete without human interpretation.
- Accessibility and responsive audits pass.
- Approachability notes are recorded in `docs/evidence/`.

## Stage 13: Performance, Realtime, And Load Regression

### Purpose

Ensure the richer UI and added imagery do not regress production readiness.

### Scope

- Run existing stress/scale tests.
- Confirm image assets are optimized and not excessively large.
- Confirm app remains responsive during:
  - realtime connections;
  - simulation jobs;
  - image jobs;
  - leaderboard traffic;
  - support/action traffic.
- Confirm admin health reflects load accurately.
- Confirm degraded states remain clear if local AI or image worker is degraded.

### Verification

- Existing release/stress/scale commands pass.
- Browser-use inspects key pages while load is active.
- No severe console errors on major routes.
- No hydration/layout errors.

### End Gate

- Visual alignment did not break production performance, realtime behavior,
  worker behavior, or degraded-mode clarity.

## Stage 14: Final Reference-Screen Acceptance

### Purpose

Produce the final evidence that the live app is aligned closely enough with the
PRD reference direction.

### Scope

- Capture final desktop/tablet/mobile screenshots for all major routes.
- Place final screenshots under `docs/evidence/ui-alignment-final/`.
- Create a final comparison report:
  - reference screen;
  - live route;
  - matched elements;
  - intentional differences;
  - remaining acceptable gaps;
  - verification commands.
- Run full release verification.
- Commit and push.

### Final End Gate

The goal is complete only when:

- The live VM app is deployed and restarted.
- Major routes visually align with the PRD reference direction.
- Production-themed data is visible instead of test fixture names.
- Generated/project-local raster art is used where the PRD expects game art.
- All major player flows pass browser-use mock user testing.
- Mobile/tablet/desktop visual audits pass.
- Accessibility checks pass.
- Stress/scale/regression checks pass.
- Final evidence is tracked in `docs/evidence/ui-alignment-final/`.
- All changes are committed and pushed.

## Suggested Goal Prompt

Use this prompt when starting the alignment goal:

```txt
/goal Bring Meme Foundry's live host-native VM app into close alignment with the
PRD reference screens.

Work only on the remote VM at 192.168.50.209. Follow AGENTS.md, MEMORY.md,
ROADMAP.md, UI_ALIGNMENT_ROADMAP.md, and the PRD set. Build stage-by-stage in
UI_ALIGNMENT_ROADMAP.md order without skipping gates.

Preserve the existing production systems. Do not rebuild the app as static
mockups. Keep all gameplay, auth, Prisma/Postgres, realtime, workers, local AI,
image generation, admin, tests, deployment, and degraded states working.

Use browser-use:browser as the user-facing judge for all major visual,
responsive, approachability, and playtesting acceptance. No human testing is an
acceptance gate.

Final state required:
- Production-themed data replaces visible test/fixture data on normal screens.
- The global shell, /play, /launch/new, /launch/:id/manage, /token/:id,
  /seasons, /leaderboard, /crews, and /admin align closely with the PRD
  reference screens and UI/UX specs.
- Generated/project-local raster assets are used where the PRD expects game art.
- Mobile, tablet, and desktop layouts are polished and understandable.
- Full automated, browser-use, visual, accessibility, stress, scale, realtime,
  degraded-mode, and release verification passes.
- Final comparison evidence is recorded under docs/evidence/ui-alignment-final/.
- Commit and push after every meaningful stage.
```
