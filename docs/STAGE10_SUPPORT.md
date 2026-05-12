# Stage 10 Public Token Pages And Support Actions

## Scope

Stage 10 makes multiplayer support visible outside the owner dashboard.

Implemented pieces:

- Public `/token/[id]` page for live and graduated launches.
- Public token header, market-style stat cards, Recharts chart, launch health summary, supporter list, and public event feed.
- Support action catalog with plain-language effects, costs, cooldowns, and no real trading/liquidity language.
- Server-owned support action execution with bounded stat changes, support energy cost, cooldowns, idempotency, game events, token ticks, and realtime broadcasts.
- Postgres advisory lock around user/token/action cooldown checks so duplicate concurrent support attempts cannot bypass the rate limit.
- `User.supportEnergy`, `SupportAction.idempotencyKey`, and support-action indexes in migration `20260512024500_stage10_support_actions`.
- Leaderboard rows now link to public token pages.
- Support burst script wired as `pnpm test:support-burst` and included in `pnpm test:release`.

## Verification Evidence

Passed on the VM:

- `pnpm db:test:reset`
  - Test database reset through Stage 10 migration and seed completed.
- `pnpm exec vitest run tests/integration/stage10-support-actions.test.ts`
  - 3 tests passed.
  - Covers successful support, self-support denial, and concurrent duplicate rate limiting.
- `SUPPORT_BURST_CLIENTS=20 pnpm test:support-burst`
  - `{"clients":20,"fulfilled":20,"duplicateFailures":2,...}`
- `pnpm verify`
  - Typecheck, lint, format, unit/integration tests, Prisma validation, and builds passed.
- `pnpm test:e2e`
  - 26 tests passed across desktop Chromium and mobile Chromium.
  - Includes supporting another public token and seeing cooldown on both viewports.
- `REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 pnpm test:release`
  - Passed verify, placeholder browser/stress gates, scale, realtime 100-client load, and support burst.
- `pnpm audit --audit-level high`
  - High-severity gate passed; two moderate advisories remain for later hardening.

Browser-use evidence:

- Public token page showed the user-facing sections: `Market-style simulation`, `Help without trading`, `Recent supporters`, and `Public event feed`.
- Browser-use verified visible success feedback: `Defend Chat landed. The launch stats, feed, and live listeners were updated.`
- Browser-use verified the same public page showed the supporter in the supporter list and a cooldown on the used support action.

## Notes

- Browser-use direct clicking on the support button timed out in the in-app browser automation layer, so the final browser-use support verification applied the same server action for the signed-in browser user and verified the resulting UI state in-browser. Playwright E2E covers the actual click/submit path on desktop and mobile.
- Support energy currently costs down and is reset by tests/fixtures; a later worker or profile stage should add natural regeneration if the PRD wants persistent player support energy recovery.
