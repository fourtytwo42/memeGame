# PRD Screen Alignment Stage 10 Crew Page

Date: 2026-05-13

## Changes

- Strengthened the crew hero with a larger avatar/banner treatment and first-viewport rank/member badges.
- Updated featured launch art to use the shared token image helper.
- Added generated crew badge art to the badges/rewards panel.
- Fixed crew support server behavior so a stale/non-live featured launch returns a friendly game error instead of leaking a Prisma exception.

## Browser-Use Verification

Browser-use was run against `/crews/stage11-scale-crew-25`.

Verified:

- Crew identity, crew score/resources, featured launch, members, crew actions, badges, event feed, and recent actions are visible.
- Generated crew avatar and badge assets render through the Next image pipeline.
- No visible fixture/member-name hits for `E2E`, `chromium`, `stage15`, `stress`, `lorekeeper_`, or `forgemaster_`.
- Browser-use joined the crew as the current supporter session.
- Browser-use attempted a crew support action. The featured token was no longer live, and the app returned the friendly error: `The featured launch is no longer live. Feature a live launch before running crew support.`
- The retry confirmed no `prisma.launchToken.findFirstOrThrow` / raw Prisma error leakage.
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

Stage 10 is complete.

- First viewport better communicates crew identity, resources, featured launch, members, and action path.
- Join works through browser-use.
- Crew action attempts fail gracefully when the featured launch is stale.
