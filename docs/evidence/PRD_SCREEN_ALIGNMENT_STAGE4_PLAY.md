# PRD Screen Alignment Stage 4 Play Command Hub

Date: 2026-05-13

## Scope

Stage 4 tightened `/play` toward `PRD/reference_screens/01_play_home_command_hub.png`.

## Changes

- Added a first-viewport command snapshot strip with:
  - live event pressure;
  - leaderboard standing/leader context;
  - crew boost state;
  - daily quest prompt.
- Kept the existing active token, recommended action, and narrative heat panels immediately below the strip.
- Added clearer icon treatment to the recommended action card.
- Updated the `/play` leaderboard preview to use the shared `tokenImage()` helper so rows render the new token-card variants.

## Browser-Use Verification

Browser-use was run against `http://192.168.50.209/play`.

Visible route checks passed:

- `command-snapshot-strip` exists once and is visible.
- First command strip text exposed the current live pressure, standing/leader, crew boost, and daily quest.
- `play-primary-panel`, `recommended-action-card`, and `narrative-heat-panel` are visible.
- Page text includes the active token, recommended action, narrative heat, global events, leaderboard, crew status, and no-real-trading language.
- Rendered images include the active token card and multiple narrative/token variants.
- Console errors: `0`.

## Automated Verification

Passed:

```bash
pnpm --filter @meme-foundry/web typecheck
pnpm --filter @meme-foundry/web build
curl -fsS http://192.168.50.209/health
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

`pnpm test:visual-audit` passed `/play` and all other major routes on mobile, tablet, and desktop.

## End Gate Result

Stage 4 is complete.

- `/play` now reads more like a command hub before scrolling.
- The user can identify current token, best action, narrative pressure, active event pressure, leaderboard context, and crew state from the top command hub area.
- Responsive checks passed without scroll, clipping, or overflow regressions.
