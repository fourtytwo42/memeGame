# Stage 15 Release Hardening

This stage replaces the remaining placeholder release gates with repeatable
checks that fail on real release blockers.

## Implemented In This Chunk

- `pnpm test:browser-audit`
  - Runs `scripts/stage15-browser-audit.ts`.
  - Starts or reuses the VM web server.
  - Signs in through the real UI as the seeded admin.
  - Resolves dynamic audit routes from Prisma.
  - Verifies the PRD route set:
    - `/`
    - `/play`
    - `/launch/new`
    - `/launch/:id/manage`
    - `/token/:id`
    - `/founder/:username`
    - `/crews/:slug`
    - `/seasons/:slug`
    - `/leaderboard`
    - `/admin`
  - Confirms the primary navigation stays in the left rail.

- `pnpm test:a11y`
  - Runs `scripts/stage15-a11y.ts`.
  - Checks the same route set for release-blocking accessibility issues:
    - one `main` landmark;
    - one named primary nav;
    - at least one `h1`;
    - images with alt text;
    - visible controls with accessible names;
    - visible form fields with labels.

- `pnpm test:stress`
  - Runs `scripts/stage15-stress.ts`.
  - Creates deterministic synthetic founders and supporters.
  - Runs concurrent launch actions and support actions.
  - Refreshes narratives and leaderboards.
  - Fails if action writes, support writes, snapshots, or duration evidence are
    missing.

- `pnpm assets:verify`
  - Runs `scripts/verify-production-assets.ts`.
  - Verifies the imagegen production asset manifest and final PNG alpha assets.
  - Checks required category coverage, dimensions, transparent corners, subject
    coverage, and manifest fields.
  - Is included in `pnpm test:release`.

- `pnpm test:visual-audit`
  - Runs `scripts/stage15-visual-audit.ts`.
  - Signs in through the real UI and checks the same route set at mobile,
    tablet, and desktop viewport sizes.
  - Fails on blank/near-blank pages, missing main landmarks, hidden expected
    content, or horizontal overflow.
  - Saves screenshots to
    `docs/evidence/stage15-responsive-visual-audit/`.
  - Is included in `pnpm test:release`.

## UI Alignment

- The app shell now keeps primary navigation in a left-side rail for every
  viewport.
- Phones use a compact icon rail with accessible labels.
- The leaderboard category menu stays as a left-side stack instead of becoming a
  top horizontal menu.
- Added public founder and season detail pages so PRD/roadmap routes are real
  user-facing surfaces.

## Verification Evidence

Last verified in this chunk:

```bash
pnpm test:e2e
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:browser-audit
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:a11y
pnpm test:stress
REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 AI_TEXT_BURST_JOBS=100 IMAGE_BURST_JOBS=25 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:release
```

Observed results:

- `pnpm verify`: passed after the shell accessibility adjustment.
- Focused mobile shell/auth E2E after the shell adjustment: 8 passed.
- Full E2E after the shell adjustment: 28 passed.
- Browser audit: 10 routes passed.
- Accessibility scan: 10 routes, 0 issues.
- Stress: 12 launch clients, 24 support clients, 36 launch actions, 24 support
  actions, leaderboard snapshots refreshed.
- Full `pnpm test:release` with browser audit, accessibility, stress, scale,
  realtime load, support burst, crew scale, AI smoke/text burst, image burst,
  and backup/restore passed.
- `pnpm audit --audit-level moderate` passes with no known vulnerabilities
  after pnpm workspace overrides for patched `@hono/node-server` and `postcss`
  transitive versions.
- `pnpm test:soak` runs `scripts/stage15-soak.ts`; a short smoke run passed
  with stable web/realtime health and failed-image count held at the starting
  degraded-state baseline.
- 30-minute soak passed with 30 samples and `elapsedSeconds: 1743`; evidence is
  stored in `docs/evidence/stage15-soak-30min.txt` and
  `docs/evidence/stage15-soak-exit.txt`.
- `test:release` now includes `pnpm test:a11y`.
- Fallback season commentary clamps generated titles to the schema limit after
  a long synthetic season name exposed the issue during release verification.
- Production asset pass now has 32 manifest entries across brand, narratives,
  tokens, statuses, NPCs, crews, share art, and empty/degraded states. Evidence
  is recorded in `docs/STAGE15_PRODUCTION_ASSETS.md`.
- Responsive visual audit passed 11 routes across mobile, tablet, and desktop.
  It caught and drove fixes for mobile shell/content min-width behavior,
  `/play` leaderboard preview wrapping, `/crews/:slug` member rows, and
  `/leaderboard` result cards.

## Browser-Use Visual Audit

Browser-use drove the Codex in-app browser against the live VM app at
`http://192.168.50.209:3000` and captured viewport screenshots for:

- `/`
- `/play`
- `/launch/new`
- `/launch/cmp23mmgi000rhqoa9vwesunj/manage`
- `/token/cmp23mmgi000rhqoa9vwesunj`
- `/founder/founder`
- `/crews/stage11-scale-crew-25`
- `/seasons/scale-season`
- `/leaderboard?tab=holders`
- `/admin`
- `/admin/assets`

Screenshots are stored under `docs/evidence/stage15-browser-use/`.

For every captured route, the browser-use DOM snapshot confirmed:

- primary navigation is present in the left rail;
- top/bottom primary navigation is absent;
- the page loads nonblank content.

Browser-use also opened `/admin/assets` on the live VM and confirmed the
imagegen production assets render on checkerboard backgrounds for visual alpha
inspection.

## Browser-Use Playtesting During Soak

Browser-use mock-user checks during the 30-minute soak covered:

- founder sign-in with keyboard fallback;
- `/play` hub, manage affordance, active launch dashboard, action tradeoffs,
  and realtime status;
- supporter sign-in, public token support action, support success, and
  cooldown state;
- crew page, leaderboard side menu, and founder/admin access boundaries;
- admin sign-in and admin control room health/counts/reports/image jobs.

The `/play` hub now includes a first-viewport `No real trading` badge after the
approachability pass showed that safety cue was missing from the play hub.

## Remaining Stage 15 Work

- `docs/RELEASE_RUNBOOK.md` now covers host-native preflight,
  verification, service install/restart, health checks, backup/restore,
  rollback, soak/scale evidence, and final release checklist.
- Complete any final completion-audit gaps found before moving to Docker
  packaging.
