# Stage 8 Seasons, Narratives, And Leaderboards Evidence

Stage 8 makes the shared world readable through real season, narrative, and leaderboard data.

## Implemented

- `/seasons` is now a real active-season page with season summary, narrative heat map, opportunity labels, top launches, and public season event feed.
- `/leaderboard` is now season-scoped and backed by stored `ScoreSnapshot` rows with tabs for score, market cap, holders, and graduated launches.
- Added `apps/web/src/lib/server/world-state.ts` for narrative opportunity labels, narrative meta refresh, score recalculation, and leaderboard snapshot refresh.
- Added `scripts/refresh-world-state.ts` for host-native scheduled/manual world refresh.
- Added `scripts/stage8-scale-check.ts` and wired `pnpm test:scale` to refresh leaderboards/narratives and assert a bounded refresh duration.
- Scale seed was run on the VM, creating production-like data: 1,000 users, 2,500 tokens, 25 crews, 8 narratives, and 100,000 ticks.

## Verification

Automated gates run on the VM:

- `pnpm world:refresh` passed for `genesis-season`: 8 narratives, 12 tokens, 85ms.
- `pnpm db:seed:scale` completed production-like seed data.
- `pnpm test:scale` passed on scale data: 1,010 users, 2,500+ tokens, 100,000+ ticks, 8 narratives, 50 leaderboard rows, 3.57s initial refresh and 182ms later release-gate refresh.
- `pnpm verify` passed.
- `pnpm test:e2e` passed: 20 tests across desktop Chromium and mobile Chrome.
- `pnpm test:release` passed with Stage 8 scale check wired; browser-audit/stress remain earlier placeholder scripts until their later roadmap stages.
- `pnpm audit --audit-level high` passed with two known moderate findings remaining for later hardening.
- `tests/integration/stage8-world-state.test.ts` covers narrative labels and leaderboard snapshot refresh.
- `e2e/shell.spec.ts` covers season and leaderboard pages/tabs.

Browser-use evidence:

- In-app browser opened `/seasons` and confirmed Narrative heat map, opportunity labels, Top launches, and Public season feed.
- In-app browser opened `/leaderboard` and confirmed leaderboard tabs plus ranked rows.
- In-app browser opened `/leaderboard?tab=holders` and confirmed the holders tab with scale tokens.

## Notes

- Stage 8 does not implement realtime; that is Stage 9.
- Browser-use screenshot capture still times out in this environment, so evidence is DOM/browser checks plus Playwright until the screenshot path is repaired.
