# PRD Screen Alignment Stage 1 Data Cleanup

Date: 2026-05-13
Target: `http://192.168.50.209`
Roadmap: `PRD_SCREEN_ALIGNMENT_ROADMAP.md`

## Objective

Remove visible test/stress/e2e fixture labels from normal product surfaces and
make the default admin/founder demo state feel active and playable.

## Implementation

Added `scripts/prd-stage1-demo-cleanup.ts`.

The script updates live VM demo data only:

- visible user handles and founder display names;
- bad season/narrative labels;
- token names, tickers, narratives, and descriptions;
- crew names, descriptions, taglines, energy, resources, and avatars;
- game event titles/descriptions;
- admin demo user support energy, founder profile, active token energy,
  treasury, stats, crew membership, and featured crew token.

Hidden deterministic IDs/slugs can remain for route/test stability. For
example, `/crews/stage11-scale-crew-25` can remain a URL, but the visible crew
name is themed.

## Cleanup Run

Command:

```bash
pnpm exec tsx scripts/prd-stage1-demo-cleanup.ts
```

Observed result:

```json
{
  "users": 178,
  "seasonsAndNarratives": {
    "seasons": 1,
    "narratives": 8
  },
  "tokens": 14,
  "crews": 27,
  "events": 423,
  "adminDemo": {
    "adminReady": true,
    "crew": "stage11-scale-crew-25",
    "token": "cmp2nzjhx0000xdoai640jhgs"
  }
}
```

## Data Verification

Direct Prisma verification found no visible bad-pattern hits in users, tokens,
crews, seasons, or sampled events.

The admin demo user now has:

- `supportEnergy: 100`
- crew membership in `Frog Foundry Alpha`
- active token `Punkinu 45`
- token energy `100`
- token treasury `$42,350`
- token crew `Frog Foundry Alpha`

## Browser-Use Verification

Browser-use checked live routes:

- `/play`
- `/seasons/scale-season`
- `/leaderboard`
- `/crews/stage11-scale-crew-25`
- `/admin`
- `/launch/cmp2nzjhx0000xdoai640jhgs/manage`

Results:

- No visible bad fixture labels on checked pages.
- Remaining `stage11` matches were only hidden link URL slugs, not visible text.
- `/launch/cmp2nzjhx0000xdoai640jhgs/manage` exposes an enabled safe `Take action`.
- Console errors: 0 on checked routes.

## Verification Commands

```bash
pnpm --filter @meme-foundry/web typecheck
pnpm --filter @meme-foundry/web build
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

Result: passed.

## Stage 1 End Gate

Passed.

- Visible fixture/test data was cleaned from normal product surfaces.
- Hidden deterministic slugs are preserved where useful for tests and routes.
- Main demo account has crew membership and enough energy for enabled gameplay.
- Browser-use verified the live routes.
- Typecheck, build, and responsive visual audit passed.
