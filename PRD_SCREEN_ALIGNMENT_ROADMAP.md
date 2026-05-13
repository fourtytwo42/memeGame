# PRD Screen Alignment Roadmap

Purpose: bring the live Meme Foundry web app into closer visual and UX alignment with the generated PRD reference screens in `PRD/reference_screens/`.

This roadmap is designed to be executable as one goal. Work stage-by-stage, do not skip gates, and keep the app shippable after every stage.

## Source References

Read before starting implementation:

- `AGENTS.md`
- `MEMORY.md`
- `ROADMAP.md`
- `UI_ALIGNMENT_ROADMAP.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/21_asset_production_and_iconography.md`
- `PRD/reference_screens/README.md`
- `PRD/reference_screens/01_play_home_command_hub.png`
- `PRD/reference_screens/02_launch_wizard.png`
- `PRD/reference_screens/03_active_token_dashboard.png`
- `PRD/reference_screens/04_public_token_page.png`
- `PRD/reference_screens/05_season_narratives.png`
- `PRD/reference_screens/06_leaderboard.png`
- `PRD/reference_screens/07_crew_page.png`
- `PRD/reference_screens/08_admin_dashboard.png`

## Non-Negotiables

- Work only on the remote VM at `192.168.50.209`.
- Keep host-native deployment as the active target.
- Use `browser-use:browser` for user-facing verification and visual comparison.
- Preserve existing gameplay, auth, Prisma/Postgres, realtime, workers, local AI, image generation, admin, tests, deployment, and degraded states.
- Do not replace the app with static mockups. Improve the real app.
- Do not fake gameplay state in UI. If richer screens need richer state, add real seeded/demo state or derived view models.
- Generated/project-local raster art should be used for expressive game visuals. Utility icons can use `lucide-react`.
- Commit and push after each completed stage or meaningful milestone.
- Update `MEMORY.md` with durable decisions and follow-ups that future agents need after context compression.

## Current Major Inconsistencies

### Global

- Live UI is flatter and more sparse than the PRD screens. References have denser neon panels, stronger glow treatments, textured backgrounds, and more game-HUD visual weight.
- The live resource/header strip is a wide sparse bar. References use compact resource cards integrated into each screen's composition.
- Repeated/default art is still too visible: token art often repeats the same smiley coin/key image, narratives repeat similar small icons, and crews reuse the same avatar style.
- Visible fixture/test names leak into product surfaces:
  - `Crew E2E Target chromium-...` on season/top-launch surfaces.
  - `stage15_stress_founder_*` on leaderboard rows.
  - `E2E Crew Season chromium` on admin season editor.
  - `lorekeeper_25_3`, `forgemaster_25_1`, and similar names on crew pages.
- Current demo energy is low, causing key action screens to look blocked/disabled compared with active reference screens.

### `/play` vs `01_play_home_command_hub.png`

- Reference has daily reward, global event timers, crew member avatars, crew boosts, and a map-style narrative heat surface in the first viewport.
- Live has the right sections but narrative heat is list bars, not a world/map heat surface.
- Live crew status is an empty no-crew state; reference shows active crew status with members and boosts.
- Global events need stronger timers, urgency, and mechanical impact display.

### `/launch/new` vs `02_launch_wizard.png`

- Reference emphasizes the Narrative step with visual narrative cards; live opens on Basics and is visually calmer.
- Live preview is simpler and less dramatic than the reference card.
- Live needs a stronger queued/generating/fallback image badge treatment.
- Top resource/app chrome consumes more visual space than the reference.

### `/launch/:id/manage` vs `03_active_token_dashboard.png`

- Reference has a strong active situation row with 2-3 decision cards near the top. Live has a recommended move but not the same decision moment.
- Reference chart is prominent in the first viewport. Live chart starts lower.
- Low current energy disables important actions, making the screen feel less playable.
- Right rail needs more density and stronger visual hierarchy: event feed, AI coach, top supporters, crew support, narrative context.

### `/token/:id` vs `04_public_token_page.png`

- Reference places support action cards high on the page; live support actions are below the first viewport.
- Reference right rail shows event feed, top supporters, NPC posts, and image status together. Live first viewport prioritizes realtime/health.
- Token art needs uniqueness and stronger card framing.
- Public chart needs more visual energy and clearer support/action feedback.

### `/seasons/:slug` vs `05_season_narratives.png`

- Reference has large image-forward narrative cards with distinct art. Live cards are smaller and visually repetitive.
- Reference season banner is cinematic and wide. Live hero uses a smaller image thumbnail and leaves empty space.
- Top launches currently expose fixture leakage.
- AI commentary and daily challenge are not prominent enough in the first viewport.

### `/leaderboard` vs `06_leaderboard.png`

- Reference has a stylized title treatment, season banner art, dense table columns, rank changes, and reward badges.
- Live card rows are readable but simpler and less competitive/game-like.
- Fixture names leak via `stage15_stress_founder_*`.
- Right rail needs richer rank profile, nearby rivals, live movement, and rewards treatment.

### `/crews/:slug` vs `07_crew_page.png`

- Live has the right structure, but reference has richer crew resources, larger featured launch CTA, member status styling, event feed, and badge art.
- Visible member names are fixture-like.
- Crew action cards are less visually distinct and lower impact than the reference.

### `/admin` vs `08_admin_dashboard.png`

- Live admin is functional but less dense than the reference.
- Live uses the player shell/resource strip; reference has a dedicated admin shell/sidebar and admin-specific top controls.
- Reference shows time window, auto-refresh, queue tables, reports, AI logs, image jobs, and system alerts together in the first viewport. Live requires more scrolling.
- Admin exposes test/evidence records such as `E2E Crew Season chromium`.

## Universal Stage Gate

Every stage must end with:

- Relevant PRD reference image re-opened and compared to the live route.
- Code implemented on the remote VM and deployed/restarted if needed.
- `pnpm --filter @meme-foundry/web typecheck` passing.
- `pnpm --filter @meme-foundry/web build` passing.
- Relevant tests passing for touched behavior.
- `browser-use:browser` verification on the live route.
- Desktop, tablet, and mobile checks for touched user-facing routes.
- No broken scroll, clipped text, incoherent overlap, or top-nav regression.
- No new external AI/image APIs.
- No public SVG placeholder art where PRD expects generated game art.
- Commit pushed.

## Stage 0: Fresh Baseline And Route Map

### Scope

- Capture fresh live screenshots for the eight PRD-mapped routes:
  - `/play`
  - `/launch/new`
  - `/launch/:id/manage`
  - `/token/:id`
  - `/seasons/:slug`
  - `/leaderboard`
  - `/crews/:slug`
  - `/admin`
- Save evidence under `docs/evidence/prd-screen-alignment-baseline/`.
- Record the exact dynamic token, crew, and season routes used.
- Create a baseline mismatch report that starts from this roadmap and adds screenshots.

### End Gate

- Baseline screenshots and report are tracked.
- Dynamic routes are documented so future checks compare the same surfaces or explain why they changed.

## Stage 1: Product Data And Demo State Cleanup

### Scope

- Remove visible test/stress/e2e labels from normal player-facing and admin-visible demo state.
- Replace visible fixture names with PRD-style themed names for users, founders, crews, tokens, seasons, events, and support records.
- Preserve deterministic hidden IDs/slugs only where tests need them.
- Set the default admin/founder demo state to feel active and playable:
  - enough energy for key actions;
  - at least one joined crew;
  - one active featured launch;
  - active support history;
  - current events with timers/freshness.

### End Gate

- Browser-use confirms no visible `E2E`, `chromium`, `stage15`, `stress`, or underscore-number fixture names on `/play`, `/seasons/:slug`, `/leaderboard`, `/crews/:slug`, or normal admin tables unless explicitly in an evidence-only admin view.
- Main demo account has enough energy to show at least one enabled safe action on `/launch/:id/manage`.
- Commit pushed.

## Stage 2: Global Shell And Resource HUD Alignment

### Scope

- Tighten the global shell to feel closer to the PRD HUD:
  - stronger brand mark;
  - compact active season/status card;
  - compact founder/resource cards;
  - active launch affordance;
  - notification/profile controls;
  - fewer wide empty strips.
- Keep left-side primary nav on desktop/tablet.
- Ensure mobile shell remains usable and does not crowd content.
- Create an admin-specific shell variant or admin mode that removes player-only clutter from `/admin`.

### End Gate

- Browser-use confirms player screens keep the left rail and compact HUD.
- `/admin` no longer feels like player widgets with admin content dropped underneath.
- No navigation regression on mobile/tablet/desktop.
- Commit pushed.

## Stage 3: Art Diversity And Visual Density Pass

### Scope

- Audit current asset usage by route.
- Generate or compose enough unique/project-local raster art so major visible entities do not repeat obvious placeholder art:
  - active token art variants;
  - public token art variants;
  - narrative cards;
  - crew badges/avatars;
  - event/status art;
  - reward/badge art.
- Add or update manifest entries with prompt, usage, alt text, dimensions, transparency notes, and review notes.
- Increase visual density with reusable components:
  - neon section headers;
  - map/heat panels;
  - event timer rows;
  - badge/reward chips;
  - right-rail feed rows;
  - compact metric/resource cards.

### End Gate

- `pnpm assets:verify` passes.
- Browser-use confirms no repeated default token art dominates the first viewport on `/play`, `/token/:id`, `/leaderboard`, or `/crews/:slug`.
- New/updated assets render cleanly on dark surfaces.
- Commit pushed.

## Stage 4: `/play` Command Hub Alignment

### Scope

- Rework `/play` first viewport toward `01_play_home_command_hub.png`:
  - active token card with stronger token art and sparkline;
  - recommended action with upside/downside and CTA;
  - map-style or richer narrative heat panel;
  - global events with timers and mechanical impacts;
  - leaderboard preview with ranked rows and art;
  - active crew panel with members/boosts when the demo user is in a crew;
  - daily reward/quest-style panel if supported by current systems.

### End Gate

- Browser-use first-viewport check confirms the user can identify current token, best action, narrative pressure, active events, leaderboard standing, and crew state without scrolling.
- `/play` visually reads as a command hub, not a sparse dashboard.
- Commit pushed.

## Stage 5: `/launch/new` Wizard Visual Alignment

### Scope

- Bring the wizard closer to `02_launch_wizard.png`:
  - more prominent horizontal stepper;
  - Narrative step with large visual cards and clear selected state;
  - richer preview card with framed token art;
  - visible image queued/generating/fallback badge;
  - stronger next/back controls;
  - less top chrome crowding.
- Consider whether first-time/default route should open on Basics but make the Narrative step visually match the reference once selected.

### End Gate

- Browser-use completes the launch wizard and verifies each step is understandable.
- Narrative step visually matches the reference direction with image-forward cards and opportunity labels.
- Preview updates remain functional.
- Commit pushed.

## Stage 6: `/launch/:id/manage` Game Board Alignment

### Scope

- Rework first viewport toward `03_active_token_dashboard.png`:
  - active situation row with 2-3 decision cards;
  - prominent market chart within first viewport on desktop;
  - recommended action strip plus all-actions grid;
  - richer grouped stats;
  - denser right rail with event feed, AI coach, top supporters, crew support, narrative context.
- Ensure demo state has at least one enabled safe action.
- Preserve disabled/risky action validation and confirmation behavior.

### End Gate

- Browser-use performs one safe action and verifies stat/event feedback.
- Browser-use sees active situation, chart, stats, recommended actions, and right rail in the desktop first viewport.
- Mobile keeps recommended action and action feedback near the top.
- Commit pushed.

## Stage 7: `/token/:id` Public Support Alignment

### Scope

- Move support action cards higher to match `04_public_token_page.png`.
- Build a stronger public hero with unique token art/card framing.
- Put event feed, top supporters, NPC posts, and image status into a denser right rail.
- Improve public chart styling and support feedback.
- Keep no-real-trading language visible.

### End Gate

- Browser-use support action succeeds on the live public token page.
- First viewport clearly shows token identity, graduation, support actions, event/support context, and no-real-trading status.
- Commit pushed.

## Stage 8: `/seasons/:slug` Narrative Map Alignment

### Scope

- Rework season hero toward `05_season_narratives.png`:
  - wide cinematic banner;
  - active season status;
  - countdown/time-left;
  - season score/rank if available.
- Rework narrative cards:
  - large image-forward cards;
  - distinct art per narrative;
  - heat/saturation/fatigue bars;
  - active launch count;
  - opportunity label.
- Make AI commentary and daily challenge visible in the first viewport or immediately below it.
- Remove fixture leakage from top launches.

### End Gate

- Browser-use confirms narrative opportunity scanning is understandable without crypto knowledge.
- First viewport resembles the reference season/narrative map direction.
- No fixture/test labels in visible season/top-launch content.
- Commit pushed.

## Stage 9: `/leaderboard` Competitive Screen Alignment

### Scope

- Rework toward `06_leaderboard.png`:
  - stronger stylized title treatment;
  - season banner art;
  - compact filter row;
  - dense ranked rows or table on desktop;
  - rank change indicators;
  - richer right rail with player rank, nearby rivals, live movement, rewards/badges.
- Remove visible stress/test founder names.
- Preserve search/filter route state.

### End Gate

- Browser-use checks tab/filter/search behavior.
- First viewport shows ranked competition, player rank, rivals, and rewards context.
- No visible `stage15_stress_*` or other fixture labels.
- Commit pushed.

## Stage 10: `/crews/:slug` Coordination Surface Alignment

### Scope

- Rework crew detail toward `07_crew_page.png`:
  - richer crew hero with avatar/banner treatment;
  - crew resource panel;
  - larger featured launch CTA;
  - member status/roles styling;
  - event feed in right rail;
  - richer badges/rewards art;
  - more distinctive crew action cards.
- Replace visible fixture-like member names with themed names.
- Keep join/support actions functional.

### End Gate

- Browser-use opens a crew detail page, joins or verifies membership, and performs or attempts a crew support action.
- First viewport shows crew identity, resources, featured launch, members, and action path.
- No visible fixture-like member names.
- Commit pushed.

## Stage 11: `/admin` Operations Console Alignment

### Scope

- Build/admin-enable a dedicated admin shell matching `08_admin_dashboard.png`:
  - admin sidebar rather than player nav emphasis;
  - time window control;
  - auto-refresh control;
  - refresh button;
  - service health cards in a dense row;
  - queue health table;
  - reports table;
  - AI logs table;
  - image jobs table;
  - system alerts panel.
- Keep player-only resource HUD out of the admin first viewport unless it is intentionally useful.
- Remove or isolate visible test/evidence records from default admin view.

### End Gate

- Browser-use desktop first viewport shows the core admin console sections without excessive scrolling.
- Admin remains protected and mutations still work.
- Degraded states remain accurate and visible.
- Commit pushed.

## Stage 12: Cross-Route Polish, Responsiveness, And Accessibility

### Scope

- Run full visual audit across mobile/tablet/desktop.
- Fix horizontal overflow, clipped text, overlapping panels, weak contrast, and broken scroll.
- Run accessibility checks for labels, headings, icon-only controls, keyboard focus, and contrast.
- Use browser-use for a mock user pass:
  - land on `/play`;
  - understand current situation;
  - launch or inspect a launch;
  - take/support an action;
  - inspect season/leaderboard/crew/admin surfaces where relevant.

### End Gate

- `PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit` passes.
- `PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:a11y` passes.
- Browser-use mock user notes are recorded under `docs/evidence/`.
- Commit pushed.

## Stage 13: Performance, Realtime, And Release Regression

### Scope

- Run performance/realtime/load regression after visual changes.
- Confirm generated assets remain optimized and manifest-tracked.
- Confirm realtime and degraded states remain clear.
- Confirm no severe browser console errors on major routes.
- Run full release verification.

### Required Commands

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 \
REALTIME_URL=http://192.168.50.209 \
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
pnpm test:stress && pnpm test:scale && pnpm test:realtime-load && pnpm test:support-burst && pnpm assets:verify
```

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 \
REALTIME_URL=http://192.168.50.209 \
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
AI_TEXT_BURST_JOBS=100 \
IMAGE_BURST_JOBS=25 \
pnpm test:release
```

### End Gate

- Regression and release commands pass.
- Browser-use confirms major routes have no severe console errors and still visually match the PRD direction.
- Evidence recorded under `docs/evidence/prd-screen-alignment-final/`.
- Commit pushed.

## Final Acceptance Gate

The goal is complete only when:

- Live VM app is deployed and restarted.
- All eight PRD-mapped routes are captured in desktop/tablet/mobile screenshots.
- Final comparison report exists under `docs/evidence/prd-screen-alignment-final/REPORT.md`.
- Visible fixture/test data is gone from normal player screens and default admin views.
- Generated/project-local raster art is diverse enough that obvious placeholder repetition is gone from first-view major surfaces.
- `/play`, `/launch/new`, `/launch/:id/manage`, `/token/:id`, `/seasons/:slug`, `/leaderboard`, `/crews/:slug`, and `/admin` each align materially closer to the corresponding PRD reference screen.
- Browser-use final acceptance confirms the major routes after restart.
- Visual audit passes for mobile/tablet/desktop.
- Accessibility audit passes.
- Stress, scale, realtime, support burst, asset, and release gates pass.
- All evidence is tracked.
- All changes are committed and pushed.

## Suggested Single Goal Prompt

```txt
/goal Complete PRD screen alignment using PRD_SCREEN_ALIGNMENT_ROADMAP.md.

Work only on the remote VM at 192.168.50.209. Follow AGENTS.md, MEMORY.md, ROADMAP.md, UI_ALIGNMENT_ROADMAP.md, PRD_SCREEN_ALIGNMENT_ROADMAP.md, and the PRD reference screens. Proceed stage-by-stage without skipping gates.

Use browser-use:browser as the user-facing judge for live visual comparison, mock user checks, and final acceptance. Preserve all production systems and do not replace the app with static mockups.

Final state required: the eight live PRD-mapped routes align materially closer to their reference screens, visible fixture/test data is cleaned from normal product surfaces, art is diverse and project-local, responsive/a11y/release/stress/scale/realtime gates pass, final evidence is recorded under docs/evidence/prd-screen-alignment-final/, and all changes are committed and pushed.
```
