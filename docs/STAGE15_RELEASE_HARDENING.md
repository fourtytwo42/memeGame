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
pnpm verify
pnpm test:e2e
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:browser-audit
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:a11y
pnpm test:stress
```

Observed results:

- `pnpm verify`: passed after the shell accessibility adjustment.
- Focused mobile shell/auth E2E after the shell adjustment: 8 passed.
- Full E2E after the shell adjustment: 28 passed.
- Browser audit: 10 routes passed.
- Accessibility scan: 10 routes, 0 issues.
- Stress: 12 launch clients, 24 support clients, 36 launch actions, 24 support
  actions, leaderboard snapshots refreshed.

## Remaining Stage 15 Work

- Run the full `pnpm test:release` with the new gates.
- Complete browser-use visual audits/playtests for all major flows.
- Complete soak, security, dependency, backup/restore, scale, degraded-mode,
  and release runbook evidence.
