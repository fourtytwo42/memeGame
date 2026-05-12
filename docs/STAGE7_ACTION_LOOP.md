# Stage 7 Active Token Dashboard And Action Loop Evidence

Stage 7 makes the core single-token game loop playable on the host-native VM.

## Implemented

- `/play` was redesigned into a denser PRD-aligned command hub with active token summary, recommended action, narrative heat, global events, leaderboard preview, and crew status.
- Old `/play?launched=<id>` launch-return URLs now redirect to `/launch/<id>/manage?launched=1` for the launched token.
- `/launch/[id]/manage` active token dashboard added with token identity, graduation progress, market chart, grouped stats, raw stat bars, active situation, action categories, recent action feed, and event feed.
- Server-owned action execution uses `ACTION_CATALOG`; the client never sends stat effects.
- Action execution enforces ownership, live token status, energy, fake budget, cooldowns, high-risk confirmation, and idempotency keys.
- Action execution persists `PlayerAction`, `TokenTick`, `GameEvent`, updated token stats/resources, and post-action explanation text.
- Added token `energy` and `PlayerAction.idempotencyKey` migration.
- Added `scripts/simulate-token-tick.ts` as a host-native scheduled/smoke worker entrypoint.
- Vitest aliases now cover app/package imports used by integration tests.

## Verification

Automated gates run on the VM:

- `pnpm verify` passed.
- `pnpm test:e2e` passed: 18 tests across desktop Chromium and mobile Chrome.
- `pnpm test:release` passed with current placeholder browser-audit/stress/scale scripts wired.
- `pnpm audit --audit-level high` passed with two known moderate findings remaining for later hardening.
- `tests/integration/stage7-action-loop.test.ts` covers action persistence, cooldown guard, high-risk confirmation guard, tick persistence, and terminal-state worker logic.
- `e2e/launch.spec.ts` launches a first token, lands on the manage dashboard, takes three distinct actions, and verifies persisted actions/ticks/events.

Browser-use evidence:

- In-app browser opened `http://192.168.50.209:3000/play` and confirmed command-hub sections: Recommended, Narrative heat, Leaderboard, Crew status.
- In-app browser opened `/launch/cmp1xsre9000djroa1q5vssud/manage` and confirmed manage dashboard sections: Simulated market, Action panel, Active situation, and action catalog content including Post Meme and High Risk Plays.

## Notes

- Reference screens remain directional, but `/play` and `/launch/:id/manage` now follow their information hierarchy and visual density much more closely than the earlier Stage 6 placeholder hub.
- Browser-use screenshot capture still times out in this environment; DOM/Playwright checks are current visual/structure evidence until screenshot capture is repaired in later QA stages.
