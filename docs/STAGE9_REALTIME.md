# Stage 9 Realtime Foundation

## Scope

Stage 9 adds the realtime foundation without changing the server-owned game loop as the source of truth.

Implemented pieces:

- `apps/realtime` Socket.IO service on port 3001.
- `packages/realtime` shared event contract, Redis publisher, and room target mapping.
- Redis pub/sub bridge from server-side game/world scripts to socket rooms.
- Auth.js session-cookie socket authentication for browser clients.
- Test-only raw `userId` socket auth fallback for integration fixtures.
- Public rooms for token, season, leaderboard, and narrative updates.
- Private rooms for user and crew updates with DB-backed authorization.
- Client realtime status panel with reconnect and degraded-state messaging.
- Live token tick, token event, support action, crew action, narrative, leaderboard, and graduation notification handlers.
- Synthetic realtime load script for 100 Socket.IO clients.
- Desktop/tablet left rail restored to match PRD reference screens; mobile keeps compact top/bottom navigation with a visible manage-launch icon.

## Commands

Host-native services used for verification:

```bash
pnpm --filter @meme-foundry/web dev --hostname 0.0.0.0 --port 3000
pnpm --filter @meme-foundry/realtime-app dev
```

Realtime load gate:

```bash
REALTIME_LOAD_TIMEOUT_MS=45000 pnpm test:realtime-load
```

Release gate now includes the realtime load target:

```bash
REALTIME_LOAD_TIMEOUT_MS=45000 pnpm test:release
```

## Verification Evidence

Passed on the VM:

- `pnpm exec vitest run tests/integration/stage9-realtime.test.ts`
  - 5 tests passed.
  - Covers token ticks, private user room denial, authenticated user room subscription, support action broadcasts, graduation alerts, and leaderboard updates.
- `REALTIME_LOAD_TIMEOUT_MS=45000 pnpm test:realtime-load`
  - `{"clients":100,"connected":100,"subscribed":100,"ticks":100}`
- `pnpm verify`
  - Typecheck, lint, format, unit/integration tests, Prisma validation, and builds passed.
- `pnpm test:e2e`
  - 24 browser tests passed across desktop Chromium and mobile Chromium.
  - Includes realtime no-refresh token tick test on both desktop and mobile.
- `REALTIME_LOAD_TIMEOUT_MS=45000 pnpm test:release`
  - Passed full release gate including verify, browser-audit placeholder, stress placeholder, scale, and realtime load.
  - Scale evidence: about 1,010 users, 2,502 tokens, 100,006 ticks, 8 narratives, 50 leaderboard rows, refresh under 1s.
- `pnpm audit --audit-level high`
  - High-severity gate passed; two moderate advisories remain for later hardening.

Browser-use evidence:

- `/leaderboard?tab=holders` shows the left-side navigation rail in the in-app browser and hides the topbar at the current viewport.
- `/launch/cmp1xsre9000djroa1q5vssud/manage` showed `Live updates connected` through the Auth.js session-cookie socket connection.
- A Redis-published `TOKEN_TICK` for the open token appeared in `realtime-message-feed` as `Live tick received` without a page refresh.
- With the realtime service stopped, the same manage page showed `Realtime degraded` and the plain-language fallback message.
- After restarting the realtime service, the panel returned to `Live updates connected` without requiring a new login.

## Notes

- `test:browser-audit` and `test:stress` are still Stage 2 placeholders. They are not considered final production hardening gates yet; later roadmap stages must replace them with real browser audit and stress implementations.
- Realtime is host-native for now. Docker remains deferred until the app is complete, tested, hardened, and share-ready.
