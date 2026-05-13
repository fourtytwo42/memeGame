# PRD Screen Alignment Stage 6 Manage Dashboard

Date: 2026-05-13

## Scope

Stage 6 aligned `/launch/:id/manage` toward `PRD/reference_screens/03_active_token_dashboard.png`.

## Changes

- Added a top active situation row with up to three real action decision cards:
  - best move;
  - option 2;
  - option 3.
- Decision cards use the existing server-owned action catalog and show purpose, upside, downside, energy, budget, and cooldown state.
- Preserved the full recommended action form, all-action grid, risk confirmation behavior, disabled states, cooldowns, and server validation.
- Replaced an inner `<main>` landmark in the dashboard component with a normal content `<div>` to avoid nested main landmarks inside the app shell.

## Browser-Use Verification

Browser-use was run against:

- `/launch/cmp2nzjhx0000xdoai640jhgs/manage`

Checks completed:

- Manage dashboard showed active token header, decision cards, recommended move, market chart, grouped stats, action panel, top supporters, crew support, founder coach, event feed, and narrative context.
- Browser-use found 17 real `Take action` buttons.
- Browser-use performed one enabled safe action through the live UI.
- After the action, the route showed action feedback, recent actions, and event feed state.
- Console errors: `0`.

## Automated Verification

Passed:

```bash
pnpm --filter @meme-foundry/web typecheck
pnpm --filter @meme-foundry/web build
curl -fsS http://192.168.50.209/health
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

The first Stage 6 visual-audit run caught two main landmarks on the manage route. The inner dashboard landmark was corrected and the audit passed across all major routes on mobile, tablet, and desktop.

## End Gate Result

Stage 6 is complete.

- The manage dashboard has a stronger active decision row near the top.
- A safe action was executed through browser-use and feedback was verified.
- The dashboard keeps the existing validation and action handling behavior.
- Responsive and landmark checks pass.
