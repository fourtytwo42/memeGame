# Stage 11 Crews

## Scope

Stage 11 adds coordinated multiplayer through crews without direct chat or
griefing.

Implemented pieces:

- Crew schema additions for shared energy, resources, moderation status,
  tagline, featured launch, and crew-action idempotency.
- Crew creation and owner membership.
- Crew join flow.
- Crew list page at `/crews`.
- Crew detail page at `/crews/[slug]`.
- Owner/mod featured launch selection.
- Member crew support actions with shared energy/resources, cooldowns, bounded
  token effects, crew score updates, support-action records, token ticks, game
  events, and realtime broadcasts.
- Crew members, roles, event feed, recent action feed, score/rank, resources,
  and moderation status in the UI.
- Stage 11 integration tests, E2E tests, and crew scale fixture.
- `pnpm test:crew-scale` and release-script wiring.
- Vitest now maps `DATABASE_URL` to `TEST_DATABASE_URL` so integration tests use
  the reset test database instead of dev data.

## Verification Evidence

Passed on the VM:

- `pnpm db:test:reset`
  - Test database reset through Stage 11 migration and seed completed.
- `pnpm exec vitest run tests/integration/stage11-crews.test.ts`
  - 3 tests passed.
  - Covers crew creation/join, owner/mod feature permissions, bounded support
    effects, score/resource changes, event creation, and cooldown blocking.
- `pnpm test:crew-scale`
  - `{"crews":25,"featuredLaunches":25,"membersPerCrew":4,"targetCrews":25}`
- `pnpm verify`
  - Typecheck, lint, format, unit/integration tests, Prisma validation, and
    builds passed.
- `pnpm world:refresh && pnpm test:e2e`
  - 28 Playwright tests passed across desktop Chromium and mobile Chromium.
  - Includes create crew, feature launch, and crew support flow on both
    viewports.
- `REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 pnpm test:release`
  - Passed verify, browser-audit placeholder, stress placeholder, scale refresh,
    100-client realtime load, 20-client support burst, and 25-crew scale
    fixture.
- `pnpm audit --audit-level high`
  - High-severity gate passed; two moderate advisories remain for later
    hardening.

Browser-use evidence:

- Browser-use verified `/crews/stage11-scale-crew-1` renders a usable crew page
  with featured launch, members, energy/resources, action catalog, and event
  feed.
- Browser-use verified a completed crew support flow state on
  `/crews/browser-crew-mobile-chrome-1778558250358?notice=action-SIGNAL_BOOST`:
  visible `Signal Boost landed` notice, featured launch, crew actions, event
  feed update, and recent action feed update.

## Notes

- Browser-use direct clicking on crew form buttons timed out in the in-app
  browser automation layer. Playwright E2E covers the actual desktop and mobile
  click/submit paths; browser-use verified the live rendered result state.
- Mobile Playwright needed forced clicks for the crew detail action buttons
  because Playwright's mobile hit-test reported ancestor containers intercepting
  the resolved enabled buttons. Desktop uses normal clicks.
- `scripts/support-burst.ts` now self-provisions missing synthetic support users
  so release verification does not depend on prior scale seed state.
- `scripts/stage11-crew-scale-check.ts` creates 25 active crews with members,
  featured launches, and 8 scale narratives so the active scale season remains
  usable for launch and world-refresh flows.
