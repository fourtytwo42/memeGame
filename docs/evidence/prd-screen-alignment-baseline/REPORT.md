# PRD Screen Alignment Baseline

Date: 2026-05-13
Target: `http://192.168.50.209`
Roadmap: `PRD_SCREEN_ALIGNMENT_ROADMAP.md`

## Purpose

This is the fresh Stage 0 baseline for the PRD screen alignment goal. It maps the
current live VM routes to the eight generated PRD reference screens and records
the major mismatches to fix in the remaining stages.

## Capture Method

Fresh responsive captures were generated on the VM with:

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

The visual audit passed for all routes and viewports, then the eight
PRD-mapped captures were copied into:

`docs/evidence/prd-screen-alignment-baseline/`

Browser-use was also used against the live VM pages to inspect visible state,
route text, and console errors during the comparison pass. The checked routes
loaded without console errors.

## Dynamic Route Map

| PRD reference                   | Live route used                            | Evidence filename pattern         |
| ------------------------------- | ------------------------------------------ | --------------------------------- |
| `01_play_home_command_hub.png`  | `/play`                                    | `*-01-play-home-command-hub.png`  |
| `02_launch_wizard.png`          | `/launch/new`                              | `*-02-launch-wizard.png`          |
| `03_active_token_dashboard.png` | `/launch/cmp23mmgi000rhqoa9vwesunj/manage` | `*-03-active-token-dashboard.png` |
| `04_public_token_page.png`      | `/token/cmp23mmgi000rhqoa9vwesunj`         | `*-04-public-token-page.png`      |
| `05_season_narratives.png`      | `/seasons/scale-season`                    | `*-05-season-narratives.png`      |
| `06_leaderboard.png`            | `/leaderboard`                             | `*-06-leaderboard.png`            |
| `07_crew_page.png`              | `/crews/stage11-scale-crew-25`             | `*-07-crew-page.png`              |
| `08_admin_dashboard.png`        | `/admin`                                   | `*-08-admin-dashboard.png`        |

Each route has desktop, tablet, and mobile screenshots.

## Baseline Mismatches

### Global

- Live UI is flatter and more sparse than the PRD references. The references
  have denser neon panels, stronger glow, textured backgrounds, and more
  game-HUD weight.
- The live resource/header strip is wide and sparse. References use compact
  resource cards integrated into the composition.
- Repeated/default art is still too visible: token art often repeats the same
  smiley coin/key image, narratives use repeated small icons, and crews reuse
  the same avatar style.
- Fixture/test names leak into visible surfaces:
  - season/top-launch content can show `Crew E2E Target chromium-*`;
  - leaderboard rows can show `stage15_stress_founder_*`;
  - admin can show `E2E Crew Season chromium`;
  - crew member names can show `lorekeeper_25_3`, `forgemaster_25_1`, and
    similar underscore-number names.
- Current demo energy is low, so key action screens appear more blocked than
  the active reference screens.

### `/play`

- Reference includes daily reward, event timers, crew member avatars, crew
  boosts, and a map-style narrative heat panel in the first viewport.
- Live has the right sections but narrative heat is a list/bar treatment.
- Live crew status can be an empty/no-crew state instead of an active crew
  state.
- Global event rows need stronger timer, urgency, and mechanical-impact
  treatment.

### `/launch/new`

- Reference emphasizes the Narrative step with large visual narrative cards.
  Live opens on Basics and is visually calmer.
- Live preview is simpler than the reference token preview card.
- Image queued/generating/fallback status needs a stronger badge treatment.
- Top chrome consumes more visual space than the reference.

### `/launch/:id/manage`

- Reference has an active situation row with 2-3 decision cards near the top.
  Live has a recommended move but not the same decision moment.
- Reference chart is prominent in the first viewport; live chart starts lower.
- Low current energy disables important actions.
- Right rail needs denser event feed, AI coach, top supporters, crew support,
  and narrative context.

### `/token/:id`

- Support action cards should move higher to match the reference.
- Right rail should show event feed, top supporters, NPC posts, and image status
  together earlier.
- Token art needs more uniqueness and stronger card framing.
- Public chart needs more visual energy and clearer support feedback.

### `/seasons/:slug`

- Reference has large image-forward narrative cards with distinct art. Live
  cards are smaller and more repetitive.
- Reference season banner is cinematic and wide. Live hero uses smaller art and
  more empty space.
- Top launches can expose fixture leakage.
- AI commentary and daily challenge are not prominent enough.

### `/leaderboard`

- Reference has a stylized title, season banner art, dense rows/table columns,
  rank changes, and reward badges.
- Live card rows are readable but simpler and less competitive.
- Fixture names can leak via stress-founder labels.
- Right rail needs richer player rank, nearby rivals, live movement, and reward
  treatment.

### `/crews/:slug`

- Live has the right structure but needs richer crew resources, larger featured
  launch CTA, member status styling, event feed, and badge art.
- Visible member names are fixture-like.
- Crew action cards are less visually distinct and lower-impact than the
  reference.

### `/admin`

- Live admin is functional but less dense than the reference.
- Live uses the player shell/resource strip; reference has a dedicated admin
  shell/sidebar and admin-specific top controls.
- Reference shows time window, auto-refresh, queue tables, reports, AI logs,
  image jobs, and system alerts together in the first viewport.
- Admin exposes test/evidence records in default views.

## Stage 0 End Gate

Passed.

- Fresh screenshots are captured under
  `docs/evidence/prd-screen-alignment-baseline/`.
- Exact dynamic routes are documented.
- Baseline mismatches are recorded for the remaining stages.
