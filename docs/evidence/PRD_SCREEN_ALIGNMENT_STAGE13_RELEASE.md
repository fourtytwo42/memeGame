# PRD Screen Alignment Stage 13: Performance, Realtime, And Release Regression

Date: 2026-05-13
Target: `http://192.168.50.209`
Roadmap: `PRD_SCREEN_ALIGNMENT_ROADMAP.md` Stage 13

## Scope

Stage 13 reran the performance, realtime, asset, and full release gates after the PRD screen alignment work. This confirmed the visual and UX changes did not regress the production systems: game actions, support actions, realtime, scale refreshes, local AI, local image generation, backups, accessibility, and responsive layouts.

## Code Fix

The first stress run exposed a race in `scripts/stage15-stress.ts`: concurrent synthetic users were upserted by `username` while the create path also used unique emails. The script now upserts stress founders and supporters by unique email and restores the intended username in `update`, preserving the existing test data shape while avoiding unique constraint races.

## Required Regression Command

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 \
REALTIME_URL=http://192.168.50.209 \
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
pnpm test:stress && pnpm test:scale && pnpm test:realtime-load && pnpm test:support-burst && pnpm assets:verify
```

Result: passed.

Observed output:

- Stress: 12 launch clients, 24 support clients, 36 launch actions, 24 support actions, 60 ticks, 2,327 events, 283 snapshots, 491 ms.
- Scale: 215 users, 94 tokens, 1,014 ticks, 8 narratives, 50 leaderboard rows, 109 ms.
- Realtime load: 100 clients connected, 100 subscribed, 100 ticks.
- Support burst: 20 clients fulfilled, 2 expected duplicate/cooldown failures, 230 ms.
- Asset verification: 53 manifest-tracked assets verified.

## Full Release Command

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 \
REALTIME_URL=http://192.168.50.209 \
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
AI_TEXT_BURST_JOBS=100 \
IMAGE_BURST_JOBS=25 \
pnpm test:release
```

Result: passed.

Observed release coverage:

- Typecheck, lint, format check, Prisma validation, and production builds passed.
- 14 test files and 49 tests passed.
- Browser route audit: 11 routes ok.
- Responsive visual audit: 11 routes x 3 viewports ok.
- Accessibility audit: 11 routes, 0 issues.
- Stress: 12 launch clients, 24 support clients, 36 launch actions, 24 support actions, 120 ticks, 2,407 events, 283 snapshots.
- Scale: 215 users, 94 tokens, 1,094 ticks, 8 narratives, 50 leaderboard rows.
- Realtime load: 100 connected/subscribed clients.
- Support burst: 20 clients fulfilled, 2 expected duplicate/cooldown failures.
- Crew scale: 25 crews, 25 featured launches, 4 members per crew.
- Local AI smoke and AI text burst: 100/100 jobs fulfilled.
- Local image burst: 25 ready, 0 failed.
- Backup/restore smoke: passed in host-native mode.
- Asset verification: 53 assets verified.

## Browser-Use Confirmation

After restarting `meme-foundry-web` and `meme-foundry-realtime`, browser-use checked all eight PRD-mapped routes on the live VM:

- `/play`
- `/launch/new`
- `/launch/cmp2nzjhx0000xdoai640jhgs/manage`
- `/token/cmp23lyrz000b29oa92r3uyru`
- `/seasons/scale-season`
- `/leaderboard`
- `/crews/stage11-scale-crew-25`
- `/admin`

Required route text was present on every route, and severe console errors were `0` for each checked route.

## Stage 13 End Gate

Passed. Regression, realtime, asset, and full release commands pass; browser-use confirmed major routes after restart; final evidence is stored under `docs/evidence/prd-screen-alignment-final/`.
