# PRD Screen Alignment Stage 3 Asset Pass

Date: 2026-05-13

## Scope

Stage 3 focused on reducing obvious placeholder repetition and improving project-local raster asset coverage for visible game entities.

## Changes

- Added `scripts/prd-stage3-compose-assets.ts` to compose project-local transparent PNG variants from existing imagegen-produced source art.
- Composed 22 new production assets:
  - 12 token card variants under `apps/web/public/assets/game/tokens/`.
  - 6 crew avatar variants under `apps/web/public/assets/game/crews/`.
  - 4 crew badge/reward variants under `apps/web/public/assets/game/crews/`.
- Updated `assets/manifest/assets.json`; manifest now tracks 53 verified production assets.
- Updated current demo data in place:
  - 344 launch tokens now point at token-card variants.
  - 62 crews now point at crew-avatar variants.
- Hardened shared asset selection in `apps/web/src/lib/assets.ts` so old default token placeholders fall back to narrative-specific token card variants.
- Updated narrative art calls to prefer visible narrative names before slugs where seeded slugs are less descriptive.

## Browser-Use Verification

Browser-use was run against the live public VM app at `http://192.168.50.209`.

Routes checked:

- `/play`
- `/token/cmp2nzjhx0000xdoai640jhgs`
- `/leaderboard?tab=holders`
- `/crews/stage11-scale-crew-25`
- `/seasons/scale-season`

Observed live image state:

- `/play` first viewport rendered the active token with `/assets/game/tokens/cat-token-card.png`, visible narrative art for AI, wizard, and dog categories, and leaderboard rows using multiple token-card variants.
- `/token/cmp2nzjhx0000xdoai640jhgs` rendered `/assets/game/tokens/cat-token-card.png` plus category-correct cat narrative art.
- `/leaderboard?tab=holders` rendered many distinct token-card variants in the sampled first rows, including cat, frog, snack, wizard, robot, dog, AI, cozy, cult, and space variants.
- `/crews/stage11-scale-crew-25` rendered `/assets/game/crews/frog-foundry-crew-avatar.png` and the featured token card variant.
- `/seasons/scale-season` rendered distinct season, narrative, and crew assets, including wizard, AI, dog, community, frog, food, retro, robot, frog-foundry, and purple-forge assets.
- Console errors: `0` on all checked routes.

## Automated Verification

Passed:

```bash
pnpm assets:verify
pnpm --filter @meme-foundry/web typecheck
pnpm --filter @meme-foundry/web build
curl -fsS http://192.168.50.209/health
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

`pnpm test:visual-audit` passed all 11 major routes across mobile, tablet, and desktop. The audit recorded 53 images on `/admin/assets`, 51 images on `/leaderboard`, 18 images on `/seasons/scale-season`, and no horizontal overflow failures.

## End Gate Result

Stage 3 is complete.

- Production asset manifest verification passes.
- Live browser-use checks confirm default token art no longer dominates `/play`, `/token/:id`, `/leaderboard`, or `/crews/:slug`.
- New assets render through the live Next image pipeline on dark UI surfaces.
- Responsive visual audit passes across mobile, tablet, and desktop.
