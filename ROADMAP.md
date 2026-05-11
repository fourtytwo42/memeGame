# Meme Foundry Build Roadmap

This roadmap is the build control document for Meme Foundry. It translates the
PRD set into ordered implementation stages with clear entry requirements and
end gates.

Do not skip stages. Do not start feature work from a later stage until the prior
stage gate is complete, verified, committed, and pushed.

## Roadmap Rules

- Build in vertical slices, but finish each slice to production quality.
- Keep the app host-native on the VM until Docker packaging is explicitly reached.
- Every stage must leave the repo in a working state.
- Every stage must have tests appropriate to the risk of that stage.
- Every user-facing stage must be checked with `browser-use:browser`.
- Update `MEMORY.md` with durable setup notes, decisions, commands, and blockers.
- Commit and push after every meaningful stage or working milestone.
- If a stage uncovers a bad assumption in the PRD, update the PRD before continuing.
- If a gate fails, fix the stage instead of building around the failure.

## Stage 0: Operating Baseline

### Goal

Make sure agents, humans, and the VM all agree on how the project is built.

### Entry Requirements

- Remote VM access works.
- GitHub auth works from the VM.
- `AGENTS.md`, `MEMORY.md`, and this `ROADMAP.md` exist.
- PRD folder exists locally and on the VM.

### Build

- Confirm the VM is the only build environment.
- Confirm `PRD/` remains ignored by Git.
- Confirm `ROADMAP.md` is tracked by Git.
- Confirm `AGENTS.md` points to `MEMORY.md` and `ROADMAP.md`.
- Confirm Git identity and GitHub remote.

### End Gate

- `git status` is clean on the VM.
- `git push` works.
- Agents can find and read `ROADMAP.md`.
- `MEMORY.md` records durable VM setup facts.

## Stage 1: Host-Native Platform Foundation

### Goal

Prepare the VM runtime foundation for a production-grade host-native build.

### Entry Requirements

- Stage 0 complete.
- VM disk has enough free space for app, database, Redis, local model, images, and logs.

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
- Document runtime commands in setup docs.

### Tests And Verification

- `psql` can connect to both databases.
- Redis responds to `PING`.
- Local LLM server responds locally and is not externally exposed.
- Image backend can run a tiny smoke generation or documented install smoke test.
- Nginx is installed but does not interfere with dev servers.

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
- Add environment validation.
- Add pino logging.
- Add base scripts:
  - `typecheck`
  - `lint`
  - `format:check`
  - `test`
  - `test:e2e`
  - `test:browser-audit`
  - `prisma:validate`
  - `build`
  - `verify`

### Tests And Verification

- Empty app builds.
- Typecheck passes.
- Lint passes.
- Unit test command passes.
- Playwright can open the local app.
- `browser-use:browser` can open the local app.

### End Gate

- `pnpm install` works from a clean checkout.
- `pnpm verify` passes.
- Health page renders in browser.
- Browser-use screenshot confirms the app shell is nonblank and readable.
- Commit and push.

## Stage 3: Data, Prisma, Auth, And Seed Foundation

### Goal

Establish the authoritative data model, migrations, auth, roles, and deterministic seed data.

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
  - sample live/graduated/dead/image-failed tokens.
- Add test database setup/reset.
- Add `/api/me` or equivalent session check.

### Tests And Verification

- Prisma schema validates.
- Migrations apply cleanly to dev and test DBs.
- Seed script is idempotent.
- Auth integration tests pass.
- Protected routes reject anonymous users.
- Admin routes reject non-admins.
- Browser-use verifies sign in and sign out.

### End Gate

- A user can sign in through the browser.
- An admin can sign in through the browser.
- Test DB can be reset with one command.
- Seeded data appears in the app.
- Commit and push.

## Stage 4: UI System And App Shell

### Goal

Build the durable visual foundation before feature screens multiply.

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
- Create app shell:
  - desktop nav;
  - mobile bottom nav;
  - top status bar;
  - active season display;
  - current user/founder display.
- Add accessibility patterns and visible focus states.

### Tests And Verification

- Component tests for important primitives.
- Browser-use desktop visual audit.
- Browser-use mobile visual audit.
- No incoherent text overlap.
- Keyboard focus is visible.

### End Gate

- App shell matches the PRD direction.
- Mobile layout is usable.
- UI primitives are ready for feature screens.
- Browser-use screenshots saved as implementation baselines if useful.
- Commit and push.

## Stage 5: Game Engine Core

### Goal

Build the deterministic server-controlled simulation logic before wiring complex UI.

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

### Tests And Verification

- Unit tests cover every formula and action.
- Property/bounds tests prevent stats from escaping valid ranges.
- Deterministic seeded tests produce repeatable results.
- Edge cases are covered:
  - zero hype;
  - max fatigue;
  - high bot risk;
  - low trust;
  - graduation threshold;
  - dead/rug states.

### End Gate

- Game engine can simulate a full token lifecycle without UI.
- Test coverage is sufficient to tune safely.
- No client-submitted stat mutation is possible.
- Commit and push.

## Stage 6: Founder Profile And Launch Wizard

### Goal

Let a new player create a founder profile and launch a token quickly and clearly.

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
- Token creation API/server action.
- Token launch into active season.

### Tests And Verification

- Unit tests for validation.
- Integration tests for token creation.
- E2E test for first launch.
- Browser-use first-time player playtest.
- Browser-use mobile launch wizard audit.

### End Gate

- New player can sign in, create founder profile, and launch first token in under 3 minutes.
- Token appears in DB with initial stats and placeholder image.
- Launch does not depend on AI or image generation.
- Commit and push.

## Stage 7: Active Token Dashboard And Action Loop

### Goal

Make the core game loop playable for one active token.

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
- Action categories.
- Cooldowns, energy, and budget display.
- Server-side action execution.
- Event feed.
- Active Situation pinned event choices.
- Post-action explanations.
- Simulation worker or scheduled local process.

### Tests And Verification

- Unit/integration tests for action execution.
- Worker tests for simulation tick.
- E2E test for taking at least 3 actions.
- Browser-use active launch stress flow.
- Browser-use confirms chart/stat movement and explanations.

### End Gate

- Player can manage a live token through multiple actions.
- Stats, chart, event feed, and resources update correctly.
- Risky actions warn before commit.
- Token can graduate or fail through simulated state.
- Commit and push.

## Stage 8: Seasons, Narratives, And Leaderboards

### Goal

Make the world shared, competitive, and readable.

### Entry Requirements

- Stage 7 complete.
- Multiple seeded or created tokens can exist.

### Build

- Season page.
- Narrative heat map.
- Narrative opportunity labels.
- Narrative update worker.
- Leaderboard scoring.
- Leaderboard page with tabs.
- Public season event feed.
- Seed scenarios for crowded/hot/cooling narratives.

### Tests And Verification

- Unit tests for narrative updates and scoring.
- Integration tests for leaderboard refresh.
- E2E tests for season and leaderboard pages.
- Browser-use visual audit for season/narratives and leaderboard.

### End Gate

- Multiple launches affect narrative metas.
- Leaderboards update from real stored data.
- Player can understand hot vs crowded vs risky narratives.
- Commit and push.

## Stage 9: Realtime Foundation

### Goal

Add live updates without destabilizing the core loop.

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

### Tests And Verification

- Socket integration tests.
- Room authorization tests.
- E2E live update tests.
- Browser-use confirms token updates without refresh.
- Browser-use verifies reconnect/degraded messaging.

### End Gate

- Token ticks, support actions, leaderboard changes, and graduation alerts broadcast live.
- Unauthorized users cannot subscribe to private rooms.
- App remains usable if realtime disconnects.
- Commit and push.

## Stage 10: Public Token Pages And Support Actions

### Goal

Make multiplayer support visible and meaningful outside the owner dashboard.

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

### Tests And Verification

- Integration tests for support actions.
- E2E test for supporting another token.
- Browser-use public token page audit.
- Browser-use verifies support feedback and cooldown.

### End Gate

- A player can support another player's token.
- Support changes are bounded, visible, and explained.
- Public token page is understandable without owner context.
- Commit and push.

## Stage 11: Crews

### Goal

Add coordinated multiplayer without direct griefing or chat complexity.

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

### Tests And Verification

- Integration tests for crew membership and permissions.
- E2E tests for create/join/feature/support.
- Browser-use crew flow playtest.
- Browser-use verifies crew page and support flow.

### End Gate

- Players can create/join crews.
- Crew can feature and support a launch.
- Crew actions affect token/crew state in bounded ways.
- Crew score/rank updates.
- Commit and push.

## Stage 12: Local Text AI

### Goal

Add local AI flavor without making AI authoritative or required for gameplay.

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

### Tests And Verification

- Unit tests for schemas and validators.
- Integration tests with mocked model responses.
- Local model smoke test.
- Browser-use AI available audit.
- Browser-use AI unavailable audit.
- Verify AI cannot mutate game state directly.

### End Gate

- AI events generate locally.
- Bad model output falls back safely.
- Gameplay works with AI disabled.
- Admin can inspect AI logs.
- No external AI API is required.
- Commit and push.

## Stage 13: Local Image Generation And Card Pipeline

### Goal

Complete the local image generation and token card asset pipeline.

### Entry Requirements

- Stage 12 complete.
- Image backend spike decision from Stage 1 is documented.
- Placeholder cards already work.

### Build

- `apps/worker-image`.
- Image prompt builder.
- Local mascot generation backend.
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

### Tests And Verification

- Unit tests for prompt builder and compositor helpers.
- Integration tests for image job lifecycle.
- Browser-use verifies queued/generating/ready/failed/retry states.
- Browser-use verifies public token page updates when image is ready.

### End Gate

- Local image generation works without external APIs.
- Failed image generation leaves a usable placeholder.
- Final cards use app-rendered text, not model-rendered text.
- Admin can see failed/retry image jobs.
- Commit and push.

## Stage 14: Admin, Moderation, Operations, And Backups

### Goal

Make the app operable and safe enough to share.

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

### Tests And Verification

- Admin permission tests.
- Moderation integration tests.
- Backup and restore smoke test.
- Browser-use admin operations flow.
- Browser-use degraded mode flow.
- Verify local LLM, Redis, Postgres, and image runtime are not publicly exposed.

### End Gate

- Admin can see and act on reports, failed jobs, AI logs, and image jobs.
- Backups and restore are documented and tested.
- Health/degraded states are accurate.
- Share-ready host-native deployment path is documented.
- Commit and push.

## Stage 15: Full Production QA And Playtesting

### Goal

Prove the host-native app is ready to share.

### Entry Requirements

- Stage 14 complete.
- All major features exist.

### Build

- Tune scoring.
- Tune simulation.
- Tune action costs/cooldowns.
- Tune narrative heat/saturation/fatigue.
- Fix confusing UI.
- Resolve browser audit findings.
- Resolve accessibility findings.
- Resolve security/rate-limit findings.
- Create implementation screenshot baselines.

### Tests And Verification

- `pnpm verify` passes.
- Full unit/integration/E2E suite passes.
- Browser-use page audit passes every major route.
- Browser-use full playtest passes:
  - first launch;
  - active launch;
  - support;
  - crew;
  - leaderboard;
  - admin;
  - degraded modes.
- Mobile browser-use audit passes.
- Backup/restore verification passes.

### End Gate

- App is share-ready in host-native mode.
- No known blocker bugs remain.
- No known serious UI/UX confusion remains.
- No external AI APIs are required.
- No real trading/liquidity surface exists.
- Commit and push.

## Stage 16: Docker Packaging And Final Deployment Hardening

### Goal

Package the already-working host-native app without changing product behavior.

### Entry Requirements

- Stage 15 complete.
- Host-native app is already share-ready.

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

### Tests And Verification

- Docker stack builds.
- Docker stack starts cleanly.
- Same automated tests pass against Docker stack where practical.
- Browser-use production audit passes against Docker stack.
- Local LLM and image runtime remain private.
- Backup/restore works in packaged mode.

### End Gate

- Docker packaging is production-ready.
- Docker behavior matches host-native behavior.
- Final deployment docs are complete.
- Commit and push.

## Stage Gate Evidence

Every stage should leave behind evidence:

- relevant commands run;
- tests passed;
- browser-use audit notes or screenshots when user-facing;
- updated docs if setup changed;
- updated `MEMORY.md` for durable operational context;
- clean Git status;
- pushed commit.

## Stop Conditions

Stop and fix before proceeding if:

- `pnpm verify` fails;
- migrations are not reproducible;
- browser-use finds a broken primary flow;
- a user-facing page has unreadable or overlapping UI;
- AI or image failures break core gameplay;
- auth/admin permissions are ambiguous;
- a stage requires a decision not recorded in the PRD.
