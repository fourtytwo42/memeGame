# Meme Foundry Build Roadmap

This roadmap is the build control document for Meme Foundry. It translates the
PRD set into ordered implementation stages with clear entry requirements, build
scope, verification work, and end gates.

Do not skip stages. Do not start feature work from a later stage until the prior
stage gate is complete, verified, committed, and pushed.

By the end of this roadmap, the app must be production-release ready. The final
Docker stage packages an already working host-native production app; Docker is
not the path for building or validating the product during the main build.

## Roadmap Rules

- Build in vertical slices, but finish each slice to production quality.
- Keep the app host-native on the VM until Docker packaging is explicitly reached.
- Treat the PRD as the product contract. If implementation reality changes, update the PRD before continuing.
- Every stage must leave the repo in a working state.
- Every stage must have tests appropriate to its risk and blast radius.
- Every user-facing stage must be checked with `browser-use:browser` against the actual running app.
- No human acceptance testing is assumed. Agents must run the automated, browser-use, stress, scaling, accessibility, and security checks required by each gate.
- Browser-use is the user-facing judge for live UX, layout, responsive behavior, and playability. Scripted tools may generate load, but browser-use must verify that the app remains understandable and usable while that load is present.
- Update `MEMORY.md` with durable setup notes, decisions, commands, ports, credentials locations, blockers, and verification evidence that needs to survive context compression.
- Commit and push after every meaningful stage or working milestone.
- If a gate fails, fix the stage instead of building around the failure.

## Universal Stage Gate

Every stage must finish with evidence for:

- PRD sections consulted and any PRD updates made.
- Commands run and test results.
- Browser-use audit notes or screenshots for user-facing work.
- Stress/scaling result when the stage affects data volume, realtime, workers, AI, image generation, or public traffic.
- Updated `MEMORY.md` when setup, operations, or durable decisions changed.
- Clean VM Git status except intentionally ignored local files.
- Pushed commit for tracked code/docs.

## Scaling And Stress Contract

Scaling is part of production readiness, not an optional polish task. Early
stages should add the hooks and seed/load commands needed for later stress
testing. Later stages must prove the live app can stay responsive under load on
the single target VM.

Baseline release targets for the host-native single-VM build:

- Production-like seed data: at least 1,000 users, 2,500 launch tokens, 25 crews, 8 narratives, and 100,000 ticks/events.
- Concurrent synthetic traffic: at least 50 logged-in user sessions performing read/action/support flows.
- Realtime pressure: at least 100 concurrent Socket.IO clients across token, season, crew, leaderboard, narrative, and user rooms.
- Worker burst: at least 500 simulation jobs, 100 text-AI jobs with fallback coverage, and 25 image jobs queued with image concurrency capped.
- Soak test: at least 30 minutes with web, realtime, queues, workers, local AI degraded/available checks, and image queue activity.
- Browser-use confirmation during load: key pages remain readable, responsive, and actionable; no incoherent overlap; degraded states are clear.
- Admin health page shows accurate queue depth, failed jobs, service status, and last tick while load is active.

These targets may be adjusted only with implementation evidence recorded in the
PRD and `MEMORY.md`. Lowering a target requires a clear technical reason and a
follow-up scaling path.

## Stage 0: Operating Baseline

### Goal

Make sure agents, the VM, GitHub, and the PRD all agree on how the project is
built and verified.

### PRD References

- `PRD/00_README.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Remote VM access works.
- GitHub auth works from the VM.
- `AGENTS.md`, `MEMORY.md`, and this `ROADMAP.md` exist.
- `PRD/` exists locally and on the VM.

### Build

- Confirm the VM is the only build environment.
- Confirm `PRD/` remains ignored by Git.
- Confirm `ROADMAP.md` is tracked by Git.
- Confirm `AGENTS.md` points to `MEMORY.md` and `ROADMAP.md`.
- Confirm Git identity and GitHub remote.
- Record the browser-use testing requirement in roadmap/PRD language.

### Verification

- VM shell access works.
- GitHub CLI or Git push auth works.
- `git status` is understood.
- Agents can find and read `ROADMAP.md`, `PRD/`, and `MEMORY.md`.

### End Gate

- `git push` works from the VM.
- `PRD/`, `AGENTS.md`, and `MEMORY.md` are ignored as intended.
- `ROADMAP.md` is tracked and pushed.
- `MEMORY.md` records durable VM setup facts.

## Stage 1: Host-Native Platform Foundation

### Goal

Prepare the VM runtime foundation for a production-grade host-native build.

### PRD References

- `PRD/04_ai_design_local_only.md`
- `PRD/05_image_generation_local_cpu.md`
- `PRD/13_deployment_and_ops.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 0 complete.
- VM disk has enough free space for app, database, Redis, local model, images, logs, and test artifacts.

### Build

- Install and configure host-native Postgres.
- Create databases:
  - `meme_foundry`
  - `meme_foundry_test`
- Create least-privilege database user for the app.
- Install and configure host-native Redis.
- Set Redis key prefix conventions:
  - `meme:dev`
  - `meme:test`
  - `meme:prod`
- Verify Node, pnpm, Python, build tools, Nginx, and systemd availability.
- Confirm local LLM runtime path for `google/gemma-4-e2b`.
- Run a short image backend spike:
  - try FastSD first;
  - fall back to Python Diffusers if FastSD is unstable or hard to operate.
- Document runtime commands, service names, ports, and restart commands.

### Verification

- `psql` can connect to both databases.
- Redis responds to `PING`.
- Local LLM server responds locally and is not externally exposed.
- Image backend can run a tiny smoke generation or documented install smoke test.
- Nginx is installed but does not interfere with dev servers.
- Service restart smoke checks pass.

### End Gate

- Postgres and Redis run as host-native services.
- Test database reset strategy is documented.
- LLM runtime decision is documented.
- Image backend decision is documented.
- VM services restart cleanly after reboot or service restart.
- `MEMORY.md` records final service names, ports, commands, and decisions.

## Stage 2: Monorepo And Tooling Foundation

### Goal

Create the repo structure and quality commands every later stage depends on.

### PRD References

- `PRD/06_technical_architecture.md`
- `PRD/13_deployment_and_ops.md`
- `PRD/16_implementation_checklist.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 1 complete.
- Postgres and Redis are reachable from the VM.

### Build

- Create pnpm monorepo.
- Create `apps/web`.
- Create package folders:
  - `packages/db`
  - `packages/game-engine`
  - `packages/shared-types`
  - `packages/ui`
  - `packages/validation`
  - `packages/prompts`
  - `packages/image-pipeline`
- Add TypeScript configs.
- Add Tailwind CSS v4.
- Add ESLint and formatting.
- Add Vitest.
- Add Playwright.
- Add browser-use audit harness documentation/scripts.
- Add environment validation.
- Add pino logging.
- Add base scripts:
  - `typecheck`
  - `lint`
  - `format:check`
  - `test`
  - `test:integration`
  - `test:e2e`
  - `test:workers`
  - `test:browser-audit`
  - `test:a11y`
  - `test:stress`
  - `test:scale`
  - `test:release`
  - `prisma:validate`
  - `audit`
  - `build`
  - `verify`

### Verification

- Empty app builds.
- Typecheck passes.
- Lint passes.
- Unit test command passes.
- Playwright can open the local app.
- `browser-use:browser` can open the local app.
- Stress/scale scripts exist as no-op or smoke commands and are wired into release verification plans.

### End Gate

- `pnpm install` works from a clean checkout.
- `pnpm verify` passes.
- Health page renders in the browser.
- Browser-use screenshot confirms the app shell is nonblank and readable.
- Test command map is documented.
- Commit and push.

## Stage 3: Data, Prisma, Auth, And Seed Foundation

### Goal

Establish the authoritative data model, migrations, auth, roles, and deterministic seed data.

### PRD References

- `PRD/06_technical_architecture.md`
- `PRD/07_data_model.md`
- `PRD/12_security_safety_and_abuse.md`
- `PRD/15_production_acceptance_criteria.md`
- `PRD/18_production_scope.md`

### Entry Requirements

- Stage 2 complete.
- `meme_foundry` and `meme_foundry_test` exist.

### Build

- Add Prisma schema.
- Add NextAuth/Auth.js adapter models.
- Add credentials auth:
  - username/email;
  - password;
  - strong password hashing.
- Add user roles:
  - `user`
  - `admin`
- Bootstrap admins from `ADMIN_EMAILS`.
- Add seed data:
  - active season;
  - at least 8 narratives;
  - founder user;
  - supporter user;
  - crew member user;
  - admin user;
  - sample live/graduated/dead/image-queued/image-failed tokens.
- Add production-volume seed command for scale testing.
- Add test database setup/reset.
- Add `/api/me` or equivalent session check.

### Verification

- Prisma schema validates.
- Migrations apply cleanly to dev and test DBs.
- Seed script is idempotent.
- Production-volume seed can create the Stage 15 target dataset without hand editing.
- Auth integration tests pass.
- Protected routes reject anonymous users.
- Admin routes reject non-admins.
- Browser-use verifies sign in and sign out.

### End Gate

- A user can sign in through the browser.
- An admin can sign in through the browser.
- Test DB can be reset with one command.
- Seeded data appears in the app.
- Scale seed command is available for later stages.
- Commit and push.

## Stage 4: UI System And App Shell

### Goal

Build the durable visual foundation before feature screens multiply.

### PRD References

- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/21_asset_production_and_iconography.md`
- `PRD/reference_screens/README.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 3 complete.
- Reference images exist in `PRD/reference_screens`.

### Build

- Add custom Tailwind CSS v4 theme tokens.
- Add Radix primitives where useful.
- Add `lucide-react`.
- Create base UI components:
  - buttons;
  - tabs;
  - panels;
  - modals;
  - forms;
  - stat bars;
  - badges;
  - toasts;
  - loading states;
  - empty states;
  - error states;
  - degraded states.
- Create approachability primitives:
  - recommended action card;
  - stat group summary;
  - jargon help tooltip/popover;
  - active situation panel;
  - post-action result explanation.
- Create asset pipeline foundations:
  - asset inventory;
  - asset manifest format;
  - generated source/final asset directories;
  - chroma-key removal workflow documentation;
  - icon-first control and tooltip/popover patterns.
- Create app shell:
  - tablet and desktop left-side nav rail matching the reference screens;
  - mobile bottom nav;
  - phone top status bar;
  - active season display;
  - current user/founder display.
- Add accessibility patterns and visible focus states.
- Add stable `data-testid` contracts for browser-use and Playwright on primary controls.

### Verification

- Component tests for important primitives.
- Browser-use desktop visual audit.
- Browser-use mobile visual audit.
- Browser-use verifies that `/play` and shell states show one obvious next action.
- Browser-use verifies icon-only controls expose hover/focus/tap help.
- No incoherent text overlap.
- Keyboard focus is visible.
- Screenshot baselines can be captured without manual cropping.

### End Gate

- App shell matches the PRD/reference direction.
- Mobile layout is usable.
- UI primitives are ready for feature screens.
- Browser-use screenshots saved as implementation baselines if useful.
- Commit and push.

## Stage 5: Game Engine Core

### Goal

Build the deterministic server-controlled simulation logic before wiring complex UI.

### PRD References

- `PRD/02_gameplay_core_loop.md`
- `PRD/07_data_model.md`
- `PRD/09_simulation_engine.md`
- `PRD/15_production_acceptance_criteria.md`

### Entry Requirements

- Stage 4 complete.
- Prisma models for seasons, narratives, tokens, ticks, actions, and events exist or are ready to add.

### Build

- Define stat ranges and normalization.
- Define action catalog.
- Define support action catalog.
- Implement `applyAction`.
- Implement `simulateTokenTick`.
- Implement graduation logic.
- Implement failure/rug/archive logic.
- Implement scoring.
- Implement narrative heat/saturation/fatigue updates.
- Implement idempotency keys for actions and jobs.
- Keep mechanics config/seed-driven where practical.
- Add deterministic bulk simulation helpers for scale tests.

### Verification

- Unit tests cover every formula and action.
- Property/bounds tests prevent stats from escaping valid ranges.
- Deterministic seeded tests produce repeatable results.
- Bulk simulation test covers thousands of tokens/ticks without UI.
- Edge cases are covered:
  - zero hype;
  - max fatigue;
  - high bot risk;
  - low trust;
  - graduation threshold;
  - dead/rug states.

### End Gate

- Game engine can simulate a full token lifecycle without UI.
- Bulk simulation gives timing evidence for future scale gates.
- Test coverage is sufficient to tune safely.
- No client-submitted stat mutation is possible.
- Commit and push.

## Stage 6: Founder Profile And Launch Wizard

### Goal

Let a new player create a founder profile and launch a token quickly and clearly.

### PRD References

- `PRD/01_product_vision.md`
- `PRD/02_gameplay_core_loop.md`
- `PRD/07_data_model.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/21_asset_production_and_iconography.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 5 complete.
- Auth/session works.
- UI system is ready.

### Build

- Founder profile creation/editing.
- First-time user flow.
- `/play` empty/new-player state.
- `/launch/new` wizard:
  - basics;
  - narrative selection;
  - mascot prompt/upload field;
  - strategy/risk profile;
  - review.
- Live token card preview.
- Procedural placeholder card.
- Generated default token/placeholder assets with transparent backgrounds where needed.
- Token creation API/server action.
- Token launch into active season.

### Verification

- Unit tests for validation.
- Integration tests for token creation.
- E2E test for first launch.
- Browser-use first-time player playtest.
- Browser-use approachability check for first launch with no external explanation.
- Browser-use mobile launch wizard audit.
- Launch flow works with AI and image generation disabled.

### End Gate

- New player can sign in, create founder profile, and launch first token in under 3 minutes.
- Token appears in DB with initial stats and placeholder image.
- Launch does not depend on AI or image generation.
- Browser-use confirms the flow is understandable without human explanation.
- First recommended action appears immediately after launch and explains its tradeoff.
- Commit and push.

## Stage 7: Active Token Dashboard And Action Loop

### Goal

Make the core game loop playable for one active token.

### PRD References

- `PRD/02_gameplay_core_loop.md`
- `PRD/09_simulation_engine.md`
- `PRD/10_workers_queues_and_jobs.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 6 complete.
- Game engine has tested actions and simulation.

### Build

- `/launch/:id/manage` active token dashboard.
- Token header and graduation progress.
- Recharts chart with tick data.
- Grouped stats:
  - Growth;
  - Belief;
  - Community;
  - Risk.
- Recommended actions.
- Recommendation reasons and plain-language jargon help.
- Action categories.
- Cooldowns, energy, and budget display.
- Server-side action execution.
- Event feed.
- Active Situation pinned event choices.
- Post-action explanations.
- Simulation worker or scheduled local process.

### Verification

- Unit/integration tests for action execution.
- Worker tests for simulation tick.
- E2E test for taking at least 3 actions.
- Browser-use active launch stress flow.
- Browser-use confirms chart/stat movement and explanations.
- Browser-use confirms grouped stat summaries and action recommendations are understandable.
- Scripted action burst verifies cooldown/idempotency behavior.

### End Gate

- Player can manage a live token through multiple actions.
- Stats, chart, event feed, and resources update correctly.
- Risky actions warn before commit.
- Token can graduate or fail through simulated state.
- Action flow remains usable during a small scripted action burst.
- Commit and push.

## Stage 8: Seasons, Narratives, And Leaderboards

### Goal

Make the world shared, competitive, and readable.

### PRD References

- `PRD/02_gameplay_core_loop.md`
- `PRD/03_multiplayer_design.md`
- `PRD/08_api_and_realtime_contracts.md`
- `PRD/09_simulation_engine.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/15_production_acceptance_criteria.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 7 complete.
- Multiple seeded or created tokens can exist.
- Scale seed command from Stage 3 exists.

### Build

- Season page.
- Narrative heat map.
- Narrative opportunity labels.
- Narrative update worker.
- Leaderboard scoring.
- Leaderboard page with tabs.
- Public season event feed.
- Seed scenarios for crowded/hot/cooling narratives.
- Indexed queries and pagination/windowing for leaderboard and feed reads.

### Verification

- Unit tests for narrative updates and scoring.
- Integration tests for leaderboard refresh.
- E2E tests for season and leaderboard pages.
- Browser-use visual audit for season/narratives and leaderboard.
- Scale test runs leaderboard/narrative updates against production-like seed volume.

### End Gate

- Multiple launches affect narrative metas.
- Leaderboards update from real stored data.
- Player can understand hot vs crowded vs risky narratives.
- Leaderboard and season pages remain responsive with production-like seed data.
- Commit and push.

## Stage 9: Realtime Foundation

### Goal

Add live updates without destabilizing the core loop.

### PRD References

- `PRD/03_multiplayer_design.md`
- `PRD/08_api_and_realtime_contracts.md`
- `PRD/10_workers_queues_and_jobs.md`
- `PRD/13_deployment_and_ops.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 8 complete.
- Token state changes are already correct without realtime.

### Build

- `apps/realtime`.
- Socket.IO auth using session context.
- Redis pub/sub bridge.
- Rooms:
  - token;
  - season;
  - crew;
  - leaderboard;
  - narrative;
  - user.
- Client subscription hooks.
- Reconnect handling.
- Degraded realtime state.
- Synthetic socket load script.

### Verification

- Socket integration tests.
- Room authorization tests.
- E2E live update tests.
- Browser-use confirms token updates without refresh.
- Browser-use verifies reconnect/degraded messaging.
- Realtime load test reaches at least 100 concurrent socket clients.

### End Gate

- Token ticks, support actions, leaderboard changes, and graduation alerts broadcast live.
- Unauthorized users cannot subscribe to private rooms.
- App remains usable if realtime disconnects.
- Realtime meets the current scale target or a documented PRD-backed adjustment exists.
- Commit and push.

## Stage 10: Public Token Pages And Support Actions

### Goal

Make multiplayer support visible and meaningful outside the owner dashboard.

### PRD References

- `PRD/03_multiplayer_design.md`
- `PRD/08_api_and_realtime_contracts.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 9 complete.
- Public token data and realtime events are available.

### Build

- `/token/:id` public token page.
- Public chart/stat summary.
- Support action catalog.
- Support action execution.
- Support cooldowns and costs.
- Supporter list.
- Public event feed.
- Realtime support notifications.
- Rate limits and idempotency for support actions.

### Verification

- Integration tests for support actions.
- E2E test for supporting another token.
- Browser-use public token page audit.
- Browser-use verifies support feedback and cooldown.
- Scripted support burst verifies rate limits, bounds, and public page responsiveness.

### End Gate

- A player can support another player's token.
- Support changes are bounded, visible, and explained.
- Public token page is understandable without owner context.
- Support flow remains stable under scripted concurrent support.
- Commit and push.

## Stage 11: Crews

### Goal

Add coordinated multiplayer without direct griefing or chat complexity.

### PRD References

- `PRD/03_multiplayer_design.md`
- `PRD/07_data_model.md`
- `PRD/08_api_and_realtime_contracts.md`
- `PRD/11_ui_ux_spec.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 10 complete.
- Support actions work for individual players.

### Build

- Crew creation.
- Crew membership and roles.
- Crew page.
- Crew resources/energy.
- Featured launch.
- Crew support actions.
- Crew score/rank.
- Crew event feed.
- Crew moderation basics.
- Crew load fixtures for Stage 15 scale tests.

### Verification

- Integration tests for crew membership and permissions.
- E2E tests for create/join/feature/support.
- Browser-use crew flow playtest.
- Browser-use verifies crew page and support flow.
- Scale fixture creates at least 25 crews with active members and featured launches.

### End Gate

- Players can create/join crews.
- Crew can feature and support a launch.
- Crew actions affect token/crew state in bounded ways.
- Crew score/rank updates.
- Crew pages remain usable with production-like crew data.
- Commit and push.

## Stage 12: Local Text AI

### Goal

Add local AI flavor without making AI authoritative or required for gameplay.

### PRD References

- `PRD/04_ai_design_local_only.md`
- `PRD/10_workers_queues_and_jobs.md`
- `PRD/12_security_safety_and_abuse.md`
- `PRD/13_deployment_and_ops.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 11 complete.
- Local LLM runtime decision from Stage 1 is documented.
- Template fallback events exist.

### Build

- `apps/ai-service`.
- `apps/worker-ai-text`.
- Prompt package.
- AI output schemas.
- AI validation and repair/fallback.
- AI event generation.
- NPC posts.
- Season commentary.
- Founder coach.
- Admin AI logs.
- AI disabled/degraded mode.
- Queue concurrency controls for local CPU use.

### Verification

- Unit tests for schemas and validators.
- Integration tests with mocked model responses.
- Local model smoke test.
- Browser-use AI available audit.
- Browser-use AI unavailable audit.
- Verify AI cannot mutate game state directly.
- Queue burst test covers at least 100 text-AI jobs with fallback/error handling.

### End Gate

- AI events generate locally.
- Bad model output falls back safely.
- Gameplay works with AI disabled.
- Admin can inspect AI logs.
- No external AI API is required.
- Web/realtime remain responsive while AI queue is busy.
- Commit and push.

## Stage 13: Local Image Generation And Card Pipeline

### Goal

Complete the local image generation and token card asset pipeline.

### PRD References

- `PRD/05_image_generation_local_cpu.md`
- `PRD/21_asset_production_and_iconography.md`
- `PRD/10_workers_queues_and_jobs.md`
- `PRD/12_security_safety_and_abuse.md`
- `PRD/13_deployment_and_ops.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 12 complete.
- Image backend spike decision from Stage 1 is documented.
- Placeholder cards already work.

### Build

- `apps/worker-image`.
- Image prompt builder.
- Local mascot generation backend.
- Production asset generation workflow for static game art.
- Chroma-key background removal and alpha validation.
- Asset manifest updates for generated production assets.
- Queue states:
  - queued;
  - generating;
  - ready;
  - failed;
  - retrying.
- Storage layout under `data/images/{tokenId}/{version}/`.
- Card compositor:
  - raw mascot;
  - square token card;
  - wide token card;
  - share card.
- Regeneration cooldown/cost.
- Admin image job view.
- Image moderation/report hooks.
- Image queue backpressure and disk-space guardrails.

### Verification

- Unit tests for prompt builder and compositor helpers.
- Integration tests for image job lifecycle.
- Browser-use verifies queued/generating/ready/failed/retry states.
- Browser-use verifies public token page updates when image is ready.
- Browser-use verifies transparent asset edges and responsive crops across mobile/tablet/desktop.
- Image queue burst test covers at least 25 queued jobs with concurrency capped and web still responsive.

### End Gate

- Local image generation works without external APIs.
- Failed image generation leaves a usable placeholder.
- Final cards use app-rendered text, not model-rendered text.
- Admin can see failed/retry image jobs.
- Image queue pressure does not block core gameplay.
- Commit and push.

## Stage 14: Admin, Moderation, Operations, And Backups

### Goal

Make the app operable and safe enough to share.

### PRD References

- `PRD/12_security_safety_and_abuse.md`
- `PRD/13_deployment_and_ops.md`
- `PRD/15_production_acceptance_criteria.md`
- `PRD/16_implementation_checklist.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 13 complete.
- All major product systems exist.

### Build

- Admin dashboard.
- Season editor.
- Narrative editor.
- Reports queue.
- Token moderation.
- Image moderation.
- User moderation.
- Queue/job monitor.
- AI logs.
- Image job logs.
- Admin action logging.
- Health/degraded status page.
- Backup scripts.
- Restore scripts/docs.
- Nginx host-native deployment docs.
- systemd service templates.
- Operational scale view for active sessions, socket clients, queues, and worker lag.

### Verification

- Admin permission tests.
- Moderation integration tests.
- Backup and restore smoke test.
- Browser-use admin operations flow.
- Browser-use degraded mode flow.
- Verify local LLM, Redis, Postgres, and image runtime are not publicly exposed.
- Admin health view remains accurate during scripted queue and realtime load.

### End Gate

- Admin can see and act on reports, failed jobs, AI logs, and image jobs.
- Backups and restore are documented and tested.
- Health/degraded states are accurate.
- Share-ready host-native deployment path is documented.
- Admin screens expose enough status to diagnose scale/stress failures.
- Commit and push.

## Stage 15: Production QA, Stress, Scaling, And Release Candidate

### Goal

Prove the host-native app is ready to share without relying on human testing.

### PRD References

- `PRD/13_deployment_and_ops.md`
- `PRD/15_production_acceptance_criteria.md`
- `PRD/16_implementation_checklist.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/21_asset_production_and_iconography.md`

### Entry Requirements

- Stage 14 complete.
- All major features exist.
- Stage-specific browser-use findings are resolved or explicitly tracked as non-blocking.
- Scale seed/load commands exist.

### Build

- Tune scoring.
- Tune simulation.
- Tune action costs/cooldowns.
- Tune narrative heat/saturation/fatigue.
- Fix confusing UI.
- Resolve browser audit findings.
- Resolve accessibility findings.
- Resolve security/rate-limit findings.
- Resolve performance/scaling findings.
- Complete production asset pass and icon help pass.
- Create implementation screenshot baselines.
- Create release runbook for host-native deployment, backup, restore, rollback, and service restart.

### Verification

- `pnpm verify` passes.
- Full unit/integration/E2E suite passes.
- `pnpm test:browser-audit` passes or invokes the documented browser-use audit checklist.
- Browser-use page audit passes every major route:
  - `/`
  - `/play`
  - `/launch/new`
  - `/launch/:id/manage`
  - `/token/:id`
  - `/founder/:username`
  - `/crew/:slug`
  - `/seasons/:id`
  - `/leaderboard`
  - `/admin`
- Browser-use full playtest passes:
  - first launch;
  - active launch;
  - support;
  - crew;
  - leaderboard;
  - admin;
  - degraded modes.
- Browser-use approachability playtest passes on desktop and mobile.
- Browser-use asset/icon QA passes on mobile, tablet, and desktop.
- Mobile browser-use audit passes.
- Accessibility checks pass.
- Dependency audit/security checks pass or documented mitigations exist.
- Backup/restore verification passes.
- `pnpm test:stress` runs the concurrent action/support/worker/realtime stress suite.
- `pnpm test:scale` runs against the production-like dataset and records timing/health evidence.
- Browser-use validates the app while stress/scale scripts are running.
- 30-minute host-native soak test completes with no blocker errors.

### End Gate

- App is share-ready in host-native mode.
- No known blocker bugs remain.
- No known serious UI/UX confusion remains.
- No external AI APIs are required.
- No real trading/liquidity surface exists.
- Production assets are complete, optimized, transparent where needed, and tracked in the asset manifest.
- Scaling targets are met or PRD-backed adjustments with follow-up capacity plan are recorded.
- Release runbook is complete.
- Commit and push.

## Stage 16: Docker Packaging And Final Deployment Hardening

### Goal

Package the already-working host-native app without changing product behavior,
then verify the packaged stack against the same release bar.

### PRD References

- `PRD/13_deployment_and_ops.md`
- `PRD/15_production_acceptance_criteria.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

### Entry Requirements

- Stage 15 complete.
- Host-native app is already share-ready.
- Host-native release evidence is recorded.

### Build

- Dockerfiles for:
  - web;
  - realtime;
  - worker-simulation;
  - worker-ai-text;
  - worker-image;
  - ai-service.
- Docker Compose stack.
- Production volume strategy.
- Reverse proxy integration.
- Container health checks.
- Resource limits.
- Backup/restore in packaged mode.
- Deployment docs.
- Containerized scale/stress command mapping.

### Verification

- Docker stack builds.
- Docker stack starts cleanly.
- Same automated tests pass against Docker stack where practical.
- Browser-use production audit passes against Docker stack.
- Stress/scale suite runs against Docker stack or any excluded case is documented with a reason.
- Local LLM and image runtime remain private.
- Backup/restore works in packaged mode.

### End Gate

- Docker packaging is production-ready.
- Docker behavior matches host-native behavior.
- Final deployment docs are complete.
- Final production-release checklist is satisfied.
- Commit and push.

## Stop Conditions

Stop and fix before proceeding if:

- `pnpm verify` fails;
- migrations are not reproducible;
- browser-use finds a broken primary flow;
- browser-use finds unreadable, confusing, or overlapping UI on a major page;
- stress/scale testing shows web, realtime, or admin health becoming unusable at the current target;
- AI or image failures break core gameplay;
- auth/admin permissions are ambiguous;
- local AI/image/Postgres/Redis private services are exposed publicly;
- a stage requires a decision not recorded in the PRD.
