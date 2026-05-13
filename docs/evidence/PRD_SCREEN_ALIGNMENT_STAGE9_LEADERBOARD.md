# PRD Screen Alignment Stage 9 Leaderboard

Date: 2026-05-13

## Changes

- Strengthened the leaderboard hero with season banner art, larger title treatment, active category badge, and ranked-row count.
- Added visible movement chips to ranked rows.
- Enriched nearby rival badges with rising/live movement language.
- Preserved side-tab navigation, search/filter route state, token art rows, player rank, rivals, live movement, and rewards rail.

## Browser-Use Verification

Browser-use was run against `/leaderboard`.

Verified:

- Season leaderboard hero is visible.
- Ranked competition, player rank, nearby rivals, live movement, rewards, and rising movement context are visible.
- No visible fixture/test label hits for `stage15_stress`, `stress`, `E2E`, or `chromium`.
- Filter route state works at `/leaderboard?tab=holders&q=frog`; the holders tab and query are preserved and results remain visible.
- Console errors: `0`.

## Automated Verification

Passed:

```bash
pnpm --filter @meme-foundry/web typecheck
pnpm --filter @meme-foundry/web build
curl -fsS http://192.168.50.209/health
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

## End Gate Result

Stage 9 is complete.

- First viewport better communicates ranked competition, player/rival context, and reward context.
- Search/filter route state is preserved.
- Fixture/test labels were not visible in browser-use checks.
