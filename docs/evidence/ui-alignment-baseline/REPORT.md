# UI Alignment Baseline Report

Date: 2026-05-12

Target: `http://192.168.50.209`

Roadmap stage: `UI_ALIGNMENT_ROADMAP.md` Stage 0.

## Evidence Captured

Baseline screenshots were captured into this directory for desktop, tablet, and
mobile viewports:

- `/play`
- `/launch/new`
- `/launch/:id/manage`
- `/token/:id`
- `/seasons`
- `/seasons/:slug`
- `/leaderboard`
- `/crews`
- `/crews/:slug`
- `/admin`

Capture command:

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm exec tsx scripts/ui-alignment-baseline.ts
```

Browser-use was also used against the live VM manage route. The DOM confirmed
the current left-rail shell, token art, manage page heading, chart/stat/action
sections, realtime panel, recent actions, and event feed.

## Cross-Screen Mismatches

The app is functional and has the left rail, but it still reads much plainer
than the PRD reference screens. The references are image-forward, neon,
high-density game command screens. The live app is mostly dark cards, text,
simple bars, and small thumbnails.

Production/test data is the largest immersion break. Normal screens expose
names such as `Crew E2E Target chromium-*`, `Crew Scale Narrative 8`, and
`Stage 11 Scale Crew 25`. Stage 1 should clean this before deeper visual work,
because better UI wrapped around test names will still look unfinished.

Several major screens have too little game art. Baseline image counts are
especially low for `/launch/new`, `/launch/:id/manage`, `/token/:id`,
`/seasons`, `/crews`, and `/admin`.

## `/play` vs `01_play_home_command_hub.png`

Matched:

- Persistent left navigation exists.
- Active token summary exists.
- Recommended action exists.
- Narrative heat, global events, leaderboard, and crew status exist.

Mismatches:

- Missing top resource/status strip like season, founder, energy, budget/clout,
  notifications.
- Active token card has no embedded sparkline/market movement.
- Narrative heat is a list of bars, not a map/heat dashboard or rich visual
  surface.
- Global events are long explanatory cards instead of compact event rows with
  timers/freshness.
- Leaderboard preview rows are visually cramped and currently dominated by test
  fixture names.
- Crew panel is a plain empty state, not a roster/status module.

## `/launch/new` vs `02_launch_wizard.png`

Matched:

- Launch form captures basics, narrative, mascot, strategy, and review data.
- Live preview exists.
- Launch copy makes simulated/no-real-trading status clear.

Mismatches:

- The primary path is a stacked form, not a true guided step wizard.
- No numbered stepper.
- Narrative choices are mostly text cards, not image cards with heat,
  saturation, fatigue, and opportunity bars.
- Preview is much simpler and has only one image.
- Mobile lacks the intended collapsible preview/sticky step controls.

## `/launch/:id/manage` vs `03_active_token_dashboard.png`

Matched:

- Token header, chart, grouped stats, action categories, realtime, recent
  actions, and event feed exist.
- Browser-use confirmed the live manage route is reachable and structured.

Mismatches:

- Header is not as strong as the reference stat strip.
- Only one image appears in the baseline screenshot; the reference uses strong
  token art and right-rail visual panels.
- No active situation decision row is visible in the first viewport.
- Chart lacks the annotated event-marker visual treatment from the reference.
- Recommended actions are present but not as compact/punchy as the reference row.
- Right rail lacks the full ecosystem: AI coach, top supporters, crew support,
  and narrative context.
- Action list is long and text-heavy.

## `/token/:id` vs `04_public_token_page.png`

Matched:

- Public token hero, public stats/chart, realtime, launch health, and support
  actions exist.
- No-real-trading language is present.

Mismatches:

- Hero lacks the large polished token-card treatment.
- Support actions are not presented as strongly as the reference action row.
- Right-side panels are incomplete compared with event feed, top supporters,
  AI/NPC posts, and image status.
- Baseline page has only one image and feels more like a stats page than a
  shareable public launch page.

## `/seasons` and `/seasons/:slug` vs `05_season_narratives.png`

Matched:

- Season and narrative data exists.
- Top launches exist on the season detail page.

Mismatches:

- No season banner art.
- Narrative map/cards have no image art in baseline.
- Heat/saturation/fatigue are present but visually plain.
- Missing top crews, richer global events, AI commentary, and challenge/prompt
  panels in the first viewport.
- Production data is mixed with scale/test-style naming.

## `/leaderboard` vs `06_leaderboard.png`

Matched:

- Leaderboard route exists.
- Category selector exists.
- Ranked rows include token images and scores.

Mismatches:

- No large stylized leaderboard title/banner treatment.
- Missing search/filter row.
- Missing right rail with user rank, nearby rivals, live rank changes, and
  season rewards.
- Rows are cards rather than a dense competitive table/list.
- Data is dominated by test fixture names.

## `/crews` and `/crews/:slug` vs `07_crew_page.png`

Matched:

- Crew list, create crew form, crew detail, featured launch, members, actions,
  resources, and event feed exist.

Mismatches:

- Baseline crew pages have no images.
- Crew detail lacks avatar/banner art.
- Featured launch lacks token art and strong progress/CTA treatment.
- Missing badges/rewards and leaderboard position panels.
- Event feed is plain/empty.
- Test fixture names dominate the experience.

## `/admin` vs `08_admin_dashboard.png`

Matched:

- Admin route has operations health, counts, season/narrative editing, reports,
  AI logs, image jobs, and queue-related data.

Mismatches:

- Uses the player shell rather than a dedicated dense admin console treatment.
- First viewport is sparse compared with the reference.
- No admin-specific left nav for dashboard, reports, moderation, queues, AI
  logs, image jobs, users, and settings.
- Health cards and tables are less dense and less operational.
- Missing stronger refresh/time-window controls in the first viewport.

## Highest-Impact Stage Order

Follow the roadmap order:

1. Stage 1: production-themed data cleanup.
2. Stage 2: visual system and asset application.
3. Stage 3: global shell alignment.
4. Stage 4: `/play` command hub.
5. Stage 5: `/launch/new` wizard.
6. Stage 6: active token dashboard.
7. Stage 9: leaderboard.
8. Stage 10: crews.
9. Stage 11: admin.

The data cleanup should happen first because it affects every visual screen and
will make later browser-use comparisons much more meaningful.
