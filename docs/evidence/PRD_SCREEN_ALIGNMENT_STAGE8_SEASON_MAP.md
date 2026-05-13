# PRD Screen Alignment Stage 8 Season Narrative Map

Date: 2026-05-13

## Changes

- Enlarged the `/seasons/:slug` hero into a wider, more cinematic banner treatment.
- Added active season status, time-left, live-launch count, AI commentary, and daily challenge to the hero area.
- Enlarged narrative cards with image-forward layouts, opportunity labels, heat/saturation/fatigue bars, active launch count, and plain-language opportunity guidance.

## Browser-Use Verification

Browser-use was run against `/seasons/scale-season`.

Verified:

- Season narrative map hero is visible.
- AI commentary and daily challenge are visible high on the page.
- Narrative opportunity section shows heat, saturation, fatigue, active launches, and opportunity language.
- Top launches, season feed, and top crews are present.
- Distinct narrative and crew assets render through the Next image pipeline.
- No visible fixture/test label hits for `E2E`, `chromium`, `stage15`, `stress`, `Scale Token`, `Scale Crew`, or `Crew E2E`.
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

Stage 8 is complete.

- Narrative scanning is clearer and uses plain-language guidance.
- The first viewport is closer to the reference season/narrative-map direction.
- Fixture/test labels were not visible in browser-use checks.
