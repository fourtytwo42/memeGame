# UI Alignment Stage 12 Approachability Evidence

Date: 2026-05-13
Target: `http://192.168.50.209`

## Browser-Use Checks

- `/launch/new`: Browser-use verified the guided wizard progresses from Basics through Review, keeps preview visible, and explains the simulated-only launch.
- `/launch/:id/manage`: Browser-use verified the active game board exposes recommended action, narrative context, supporters, crew support, realtime status, and action feedback after `POST_MEME`.
- `/token/:id`: Browser-use verified public support language, Signal Boost labeling, no-wallet/no-real-trading copy, top/recent supporters, NPC feed, and image pipeline state.
- `/leaderboard`: Browser-use verified category tabs, search/filter route state, visible rows, nearby rivals, reward guidance, and graduation context.
- `/crews` and `/crews/:slug`: Browser-use verified crew creation/list surfaces, featured launch, member roster, action catalog, badges, event feed, and recent actions.
- `/admin`: Browser-use verified operations cards, queue table, system alerts, reports queue, AI logs, and image job queue.

## Automated Acceptance

- Accessibility: `PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:a11y`
  - Result: 11 routes checked, 0 issues.
- Responsive visual audit: `PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit`
  - Result: mobile/tablet/desktop passed for all 11 major routes.
- Mock user flows:
  - `PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm exec playwright test e2e/launch.spec.ts e2e/support.spec.ts e2e/crews.spec.ts e2e/shell.spec.ts --project=chromium`
  - Result: 8 passed.

## Approachability Result

The primary player screens answer:

- What is happening: active launch status, season state, public token state, crew target, or admin health.
- Why it happened: action feedback, event feeds, stat summaries, narrative labels, and coach/support panels.
- What can I do now: recommended move, support actions, crew actions, launch wizard controls, leaderboard filters.
- What is risky: high-risk action confirmations, disabled reasons, no-real-trading labels, saturation/fatigue/risk copy.
- What am I working toward: graduation progress, score/rank, season competition, crew score, rewards guidance.
