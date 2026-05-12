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
- `test:release` now includes `pnpm test:a11y`.
- Fallback season commentary clamps generated titles to the schema limit after
  a long synthetic season name exposed the issue during release verification.

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

Screenshots are stored under `docs/evidence/stage15-browser-use/`.

For every captured route, the browser-use DOM snapshot confirmed:

- primary navigation is present in the left rail;
- top/bottom primary navigation is absent;
- the page loads nonblank content.

## Remaining Stage 15 Work

- Complete browser-use visual audits/playtests for all major flows.
- Complete soak, security, dependency, backup/restore, scale, degraded-mode,
  and release runbook evidence.
